const {createFFmpeg, fetchFile} = FFmpeg;
let ffmpeg;


// namespace
if (typeof app === `undefined`) app = {};
if (typeof app.state === `undefined`) app.state = {};
if (typeof app.state.collection === `undefined`) app.state.collection = {};

app.waitSeconds = ms => new Promise(res => setTimeout(res, ms));
app.delayAfterVideoEncoding = 300;

app.getFileMediaFormat = file => {
    let parts = file.type.split("/");
    if (parts[0] === "image") return "image";
    if (parts[0] === "video") return "video";
    return "other";
}

app.getFileTypeAction = file => {
    return app.getFilePathAction(file.name);
}

app.getFilePathAction = filePathOrName => {
    const fileType = app.getFileType(filePathOrName);
    return app.state.transcoding.assetTypeActions[fileType];
}

app.getSubGroupAction = subGroup => {
    // return app.state.currentFileScanSubGroups.find(item => item.name === subGroup);
    return app.state.transcoding.assetTypeActions[subGroup];
}


app.getAssetFileBuildData = (dbIndexToUpdate, fileIndex = -1) => {

    return new Promise(async (resolve, reject) => {
        app.db.open().then(function () {

            return app.db.assets

                .where('[collectionId+index]')
                .equals([app.state.collection.currentId, dbIndexToUpdate])
                .where('index')
                .equals(dbIndexToUpdate)
                .toArray()
                .then(function (allData) {
                    if (fileIndex === -1)
                        resolve(allData[0].metadata.buildData);
                    else
                        resolve(allData[0].metadata.buildData.sourceFiles[fileIndex]);

                });
        });
    });
}


app.getSubGroupFromFile = file => {

    // console.log(`[ getActionForGroupingTypeFromFile ] file: `, file);
    let subGroup = app.getSubGroupFromFilename(file.name || file.filePath)

    if (app.state.lastScanCollectionGroupMode === "singleFiles") {
        // console.log(`[ getActionForGroupingTypeFromFile ] return fileType: `, app.getFileType(file.name));
        subGroup = file.name;
    } else if (app.state.lastScanCollectionGroupMode === "fileType") {
        // console.log(`[ getActionForGroupingTypeFromFile ] return fileType: `, app.getFileType(file.name));
        subGroup = app.getFileType(file.name);
    } else if (subGroup === "") {
        subGroup = app.getFileType(file.name);
    }

    return subGroup;
}

app.getActionForGroupingTypeFromFile = (file, whoCalledMe = "") => {
    let subGroup = app.getSubGroupFromFile(file);
    let action = app.getSubGroupAction(subGroup);
    // console.log(`[ getActionForGroupingTypeFromFile ] whoCalledMe: ${whoCalledMe} - action:: ${action} - file: `, file);
    return action;
}

app.doProcessActionForFile = async (options, callback = null) => {


    if (!options.fileFound) {
        if (callback !== null) callback();
        return;
    }
    if (options.dbIndexToUpdate === undefined) {
        if (callback !== null) callback();
        return;
    }

    let file = options.fileFound;
    let dbIndexToUpdate = options.dbIndexToUpdate;
    let metadata = options.metadata;
    let sourceFileIndex = options.sourceFileIndex;
    let sourceFileType = app.getFileMediaFormat(file);

    let action = app.getActionForGroupingTypeFromFile(file, "doProcessActionForFile");
    if (action === "ignore") {
        if (callback !== null) callback();
        return;
    }
    let needsCallback = true;

    if (action === "ignore") {
        if (callback !== null) callback();
        return;
    }

    if (action === "scan") {
        needsCallback = false;

        // load the raw data for the file hash
        let fileReader = new FileReader();
        fileReader.onload = async function (event) {


            let hashOfFile = await app.getHash(event.target.result);

            // because new files may have been added to the buildData sourceFiles, we need to read the db again, to merge the data
            app.db.open().then(function () {

                return app.db.assets
                    .where('[collectionId+index]')
                    .equals([app.state.collection.currentId, dbIndexToUpdate])
                    .toArray()
                    .then(function (allData) {
                        if (allData !== undefined && allData.length !== 0) {


                            // console.log("SCAN ASSET: ", allData[0].metadata.buildData.sourceFiles, " to insert: ", metadata.buildData.sourceFiles[sourceFileIndex]);

                            // find the right asset and update it
                            for (let i = 0; i < allData[0].metadata.buildData.sourceFiles.length; i++) {
                                if (allData[0].metadata.buildData.sourceFiles[i].filePath && metadata.buildData.sourceFiles[sourceFileIndex] && metadata.buildData.sourceFiles[sourceFileIndex].filePath
                                    && allData[0].metadata.buildData.sourceFiles[i].filePath === metadata.buildData.sourceFiles[sourceFileIndex].filePath) {
                                    allData[0].metadata.buildData.sourceFiles[i].thumbHash = hashOfFile;
                                    allData[0].metadata.buildData.sourceFiles[i].fileStatus.isValid = true;
                                    allData[0].metadata.buildData.sourceFiles[i].size = event.total;
                                    break;
                                }
                            }

                            app.db.open()
                                .then(() => {

                                    app.db.assets
                                        .where('[collectionId+index]')
                                        .equals([app.state.collection.currentId, dbIndexToUpdate])
                                        .modify({metadata: allData[0].metadata})
                                        .then(async () => {
                                            // file.scanned = true;
                                            // file.used = true;
                                            app.setFileUsed(file);
                                            // console.log("[ doProcessActionForFile ] SCAN DONE " + sourceFileIndex);
                                            if (callback !== null) callback();
                                        })
                                });

                        } else {
                            if (callback !== null) callback();
                        }

                    })
            });
        }

        fileReader.readAsArrayBuffer(file);


        return;
    }

    if (action === "convert" && app.convertMp4ToAnimatedWebP === true && sourceFileType === "video") {

        needsCallback = false;

        if (!ffmpeg) {
            ffmpeg = createFFmpeg();
        }

        ffmpeg.setLogger(({type, message}) => {
            if (type === "fferr") {
                // console.log(message);
                // detailMessage.innerHTML = message;
            }
        });

        if (!ffmpeg.isLoaded()) {
            await ffmpeg.load();
        }

        // console.log("CONVERT VIDEO");
        // console.log(app.state.transcoding);

        let widthPixels = app.state.transcoding.videosResizeAmount;
        let fps = app.state.transcoding.videosFps;
        let quality = app.state.transcoding.videosQuality;
        let name = "animated.webp";

        quality = quality.toString();

        ffmpeg.FS('writeFile', name, await fetchFile(file));
        // console.log("CONVERT VIDEO - writeFile DONE");


        const vFilter = "fps=" + fps + ",scale=" + widthPixels + ":-1:flags=lanczos";
        await ffmpeg.run('-i', name, '-vf', vFilter, '-vcodec', 'libwebp', '-lossless', '0', '-compression_level', '6', '-q:v', quality, '-loop', '0', '-preset', 'picture', '-an', '-vsync', '0', 'output.webp');
        // message.innerHTML = 'Completed transcoding!';

        // console.log("CONVERT VIDEO - TRANSCODING DONE");

        const data = await ffmpeg.FS('readFile', 'output.webp');

        let animatedWebP = new Blob([data.buffer], {type: 'image/webp'});

        // A Blob() is almost a File() - it's just missing the two properties below which we will add
        animatedWebP.lastModifiedDate = new Date();
        animatedWebP.name = name;

        const arrayBuffer = await animatedWebP.arrayBuffer();
        let thumbHash = await app.getHash(arrayBuffer);

        metadata.buildData.thumbIndex = sourceFileIndex;


        // because new files may have been added to the buildData sourceFiles, we need to read the db again, to merge the data
        app.db.open().then(function () {

            return app.db.assets
                .where('[collectionId+index]')
                .equals([app.state.collection.currentId, dbIndexToUpdate])
                .toArray()
                .then(function (allData) {
                    if (allData !== undefined && allData.length !== 0) {


                        // console.log("CONVERT VIDEO - asset: ", allData[0].metadata.buildData.sourceFiles, " to insert: ", metadata.buildData.sourceFiles[sourceFileIndex]);

                        for (let i = 0; i < allData[0].metadata.buildData.sourceFiles.length; i++) {
                            if (allData[0].metadata.buildData.sourceFiles[i].filePath === metadata.buildData.sourceFiles[sourceFileIndex].filePath) {
                                allData[0].metadata.buildData.sourceFiles[i].thumb = animatedWebP;
                                allData[0].metadata.buildData.sourceFiles[i].thumbHash = thumbHash;
                                allData[0].metadata.buildData.sourceFiles[i].processedFileType = "webp";
                                allData[0].metadata.buildData.sourceFiles[i].fileStatus.isValid = true;
                                allData[0].metadata.buildData.thumbIndex = i;
                                break;
                            }
                        }

                        app.db.open()
                            .then(() => {
                                app.db.assets
                                    .where('[collectionId+index]')
                                    .equals([app.state.collection.currentId, dbIndexToUpdate])
                                    .modify({metadata: allData[0].metadata})
                                    .then(async () => {
                                        // file.imported = true;
                                        // file.used = true;
                                        app.setFileUsed(file);
                                        // console.log("[ doProcessActionForFile ] CONVERT VIDEO set thumbIndex to " + sourceFileIndex);
                                        const url = URL.createObjectURL(animatedWebP);
                                        $('img[data-index="' + dbIndexToUpdate + '"]').attr('src', url);
                                        if (callback !== null) callback();
                                    })
                            });

                    }
                });

        });

        return;
    }

    if (action === "convert" && app.convertMp4ToGif === true && sourceFileType === "video") {
        // && !app.state.transcoding.videosIgnore && !app.state.transcoding.videosDoImport) {
        // if (sourceFileType === "video") {
        needsCallback = false;
        continueCallback = true;
        app.indexOfCurrentThumbnailToMakeGifFor = dbIndexToUpdate;

        let fileName = file.name;
        let fileType = file.type;
        let fileSize = (file.size / 1024).toFixed(2);

        let b64Str = await app.readFileAsDataURL(file);
        if (!app.videoElement) app.videoElement = document.createElement('video');


        app.videoObject = await app.loadVideo(app.videoElement, b64Str);
        app.videoObject.autoplay = false;
        app.videoObject.muted = true;
        app.videoObject.loop = false;

        let vidDuration = parseInt(app.videoObject.duration);

        // startPoint.setAttribute('max', vidDuration);


        /* startPoint.addEventListener('change', (evt) => {
             let newStartTime = evt.target.value;
             app.videoObject.currentTime = newStartTime;
         }, false);*/

        // let vidHeight = app.videoObject.videoHeight; // 720
        // let vidWidth = app.videoObject.videoWidth; // 1280


        app.state.video = {
            displayedSize: 1000,
            height: 1000,
            width: 1000,
            startTime: 5,
            fps: 10,
            scale: 1,
            quality: 1 //  [1,30] | Best=1 | >20 not much speed improvement
        }

        app.videoObject.height = app.state.video.height;
        app.videoObject.width = app.state.video.width;
        app.videoObject['style']['height'] = `${app.state.video.height}px`;
        app.videoObject['style']['width'] = `${app.state.video.width}px`;

        // start time in video
        app.videoObject.currentTime = app.state.video.startTime;

        if (inputVideoPreview.innerHTML.trim() === "") inputVideoPreview.appendChild(app.videoObject);


        if (!app.videoCanvas) {
            app.videoCanvas = document.createElement('canvas');
            app.scaleCanvas(app.videoCanvas, app.videoObject, app.state.video.height, app.state.video.width, app.state.video.scale);
            document.getElementById('hiddenCanvas').appendChild(app.videoCanvas);
        }

        // =============== calculate displayed sizes ====================
        let sizeBenchmark = app.state.video.height;
        if (app.state.video.width > app.state.video.height) {
            sizeBenchmark = app.state.video.width;
        }
        let scaleRatio = parseFloat(app.state.video.displayedSize / sizeBenchmark);
        let displayedHeight = scaleRatio * app.state.video.height;
        let displayedWidth = scaleRatio * app.state.video.width;

        app.videoObject['style']['height'] = `${displayedHeight}px`;
        app.videoObject['style']['width'] = `${displayedWidth}px`;

        app.scaleCanvas(app.videoCanvas, app.videoObject, displayedHeight, displayedWidth, app.state.video.scale);

        if (!app.encoder)
            app.encoder = new GIFEncoder(app.state.video.width, app.state.video.height);

        app.encoder.setRepeat(0);
        app.encoder.setDelay(6);
        app.encoder.setQuality(app.state.video.quality);//  [1,30] | Best=1 | >20 not much speed improvement.

        var startTime = 0;
        var frameIndex = 0;
        // var staticFrames = '';

        var requiredFPSDelay = 0;

        var requiredFPS = app.state.video.fps; // frames per second

        const step = async () => {
            if (startTime === 0) {
                startTime = (Date.now());
            }// in milliseconds

            if (!app.videoCanvasContext)
                app.videoCanvasContext = app.videoCanvas.getContext('2d', {willReadFrequently: true});
            app.videoCanvasContext.drawImage(app.videoObject, 0, 0, displayedWidth, displayedHeight);
            app.encoder.addFrame(app.videoCanvasContext);

            if (FPS === 0) {
                let elapsed = ((Date.now()) - startTime) / 1000.0;
                FPS = (frameIndex / elapsed) * 1000.0;
                requiredFPSDelay = FPS - (requiredFPS * 1000);
                if (requiredFPSDelay < 0) {
                    requiredFPSDelay = 0;
                }
            }

            // console.log([FPS, (requiredFPS*1000), requiredFPSDelay]);
            await new Promise((resolve, reject) => setTimeout(resolve, requiredFPSDelay));

            if (continueCallback) {
                app.videoObject.requestVideoFrameCallback(step);
            }
        };


        if (!app.videoObject.addedEventListener) {
            app.videoObject.addedEventListener = true;

            app.videoObject.addEventListener('play', (vEvt) => {
                if (continueCallback) {
                    app.videoObject.requestVideoFrameCallback(step);
                }
                app.encoder.start();
            }, false);

            app.videoObject.addEventListener('ended', (vEvt) => {
                loadingBar['style']['display'] = 'none';
                continueCallback = false;
                app.encoder.finish();

                var fileType = 'image/gif';

                app.readableStream = app.encoder.stream();
                app.binaryGif = app.readableStream.getData();
                app.b64Str = 'data:' + fileType + ';base64,' + app.encode64(app.binaryGif);


                $('img[data-index="' + app.currentDbIndexToUpdate + '"]').attr('src', app.b64Str);

                app.db.open()
                    .then(function () {
                        app.db.assets

                            .where('[collectionId+index]')
                            .equals([app.state.collection.currentId, app.currentDbIndexToUpdate])

                            .modify({gif: app.b64Str})
                            .then(function () {

                                console.log(`[ doProcessActionForFile ] GIF ENCODER DONE FOR ${app.currentDbIndexToUpdate} `);

                                /* newImg.onload = () => {
                                     // no longer need to read the blob so it's revoked
                                     URL.revokeObjectURL(url);
                                 }; */
                                // file.imported = true;
                                // file.used = true;
                                app.setFileUsed(file);
                                // $('img[data-index="' + app.currentDbIndexToUpdate + '"]').attr('src', app.b64Str);
                                needsCallback = false;
                                if (callback !== null) callback();
                            })

                    });


            }, false);
        }
        /*var convertBtn = document.getElementById('convertBtn');
        convertBtn.addEventListener('click', () => {
            app.videoObject.play();
            convertBtn.removeEventListener('click', null, false);
        }, false);*/

        app.videoObject.play();

        // };
        return;

    }

    if (action === "import" && (sourceFileType === "image" || sourceFileType === "video")) {

        needsCallback = false;
        // console.log("[ doProcessActionForFile ] IMPORT IMAGE")

        // let newOnly = newOnlyModeId && newOnlyModeId.checked;


        let fileReader = new FileReader();
        fileReader.onload = async function (event) {

            // you can keep blob or save blob to another position
            const blob = new Blob([event.target.result])

            // console.log("[ doProcessActionForFile ]  dbIndexToUpdate: " + dbIndexToUpdate + "  options: ", options);

            let allData = [];

            if (options.asset) {
                app.insertFileIntoAssetSourceFiles(options.fileFound, options.asset);
                sourceFileIndex = options.asset.metadata.buildData.sourceFiles.length - 1;
                allData.push(options.asset);
            } else {
                allData = await app.db.assets
                    .where('[collectionId+index]')
                    .equals([app.state.collection.currentId, dbIndexToUpdate])
                    .toArray();
            }

            if (allData !== undefined && allData.length !== 0
                && allData[0].metadata.buildData.sourceFiles[sourceFileIndex]) {

                allData[0].metadata.buildData.sourceFiles[sourceFileIndex].thumb = blob;

                if (!allData[0].metadata.buildData.thumbIndex
                    || allData[0].metadata.buildData.thumbWidth < allData[0].metadata.buildData.sourceFiles[sourceFileIndex].width) {
                    allData[0].metadata.buildData.thumbIndex = sourceFileIndex;
                    allData[0].metadata.buildData.thumbWidth = allData[0].metadata.buildData.sourceFiles[sourceFileIndex].width;
                }

                // console.log("[ doProcessActionForFile ] FOUND dbIndexToUpdate: " + dbIndexToUpdate + " - writing: ", allData[0]);

                await app.db.assets.update(allData[0].id, allData[0]);

                const url = URL.createObjectURL(blob);
                $('img[data-index="' + dbIndexToUpdate + '"]').attr('src', url);
                // file.imported = true;
                // file.used = true;
                app.setFileUsed(file);
                file.size = event.total;
                if (callback !== null) callback();

            } else {
                // console.log("[ doProcessActionForFile ] NONE FOUND");
                if (callback !== null) callback();
            }


        };
        fileReader.onerror = function (event) {
            console.log("[ doProcessActionForFile ] ERROR READING FILE " + sourceFileIndex + " ", file);
            // debugger
        };
        fileReader.readAsArrayBuffer(file);

        return;
    }

    if (action === "convert" && sourceFileType === "image") {

        needsCallback = false;

        let fileReader = new FileReader();
        fileReader.addEventListener("load", async event => {
            let sourceMediaData = event.target.result;


            console.log("[ doProcessActionForFile ] type: " + app.state.transcoding.imagesFileType);
            // console.log(sourceMediaData);
            // console.log(file);

            let img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => {

                if (!app.generatorCanvas) app.generatorCanvas = document.createElement('canvas');

                if (!app.ctx) app.ctx = app.generatorCanvas.getContext("2d", {willReadFrequently: true});

                app.generatorCanvas.width = app.state.transcoding.imagesResizeAmount;
                app.generatorCanvas.height = app.generatorCanvas.width * (img.height / img.width);
                app.ctx.drawImage(img, 0, 0, app.generatorCanvas.width, app.generatorCanvas.height);

                app.generatorCanvas.toBlob(async blob => {


                    //A Blob() is almost a File() - it's just missing the two properties below which we will add
                    blob.lastModifiedDate = new Date();
                    blob.name = "fileName." + app.state.transcoding.imagesFileType;

                    metadata.buildData.sourceFiles[sourceFileIndex].thumb = blob;

                    const arrayBuffer = await blob.arrayBuffer();
                    metadata.buildData.sourceFiles[sourceFileIndex].thumbHash = await app.getHash(arrayBuffer);

                    // valid because the file is ready for upload with a thumb and thumbHash
                    metadata.buildData.sourceFiles[sourceFileIndex].fileStatus.isValid = true;
                    metadata.buildData.sourceFiles[sourceFileIndex].processedFileType = app.state.transcoding.imagesFileType;


                    metadata.buildData.thumbIndex = sourceFileIndex;


                    app.db.open()
                        .then(() => {
                            console.log("[ doProcessActionForFile ] writing metadata: ", metadata);

                            app.db.assets

                                .where('[collectionId+index]')
                                .equals([app.state.collection.currentId, dbIndexToUpdate])
                                .modify({metadata: metadata})
                                .then(() => {
                                    console.log("[ doProcessActionForFile ] set thumbIndex to " + sourceFileIndex + " NOW SET TO VALID");
                                    const url = URL.createObjectURL(blob);
                                    $('img[data-index="' + dbIndexToUpdate + '"]').attr('src', url);
                                    // file.imported = true;
                                    // file.used = true;
                                    app.setFileUsed(file);
                                    if (callback !== null) callback();

                                })
                        });

                }, "image/" + app.state.transcoding.imagesFileType, (app.state.transcoding.imagesQuality / 100));
            }

            img.src = sourceMediaData;

            // if (callback !== null) callback();

        });

        //Read the image, which triggers the event above
        fileReader.readAsDataURL(file);
        return;
    }

    if (needsCallback && callback !== null) callback();

}


app.insertFileIntoAssetSourceFiles = (file, asset) => {

    // let newItem = file;

    file.fileStatus = {
        isRendered: true, // isRendered means there is a file at the location mentioned in the build file
        isValid: true, // isValid means there is a file, and it's hash has been saved, so it's ready for upload
        isUploaded: false // isUploaded means the file has been uploaded to IPFS (URL and Hash available)
    }
    file.mediaScan = {rendered: 0, uploaded: 0, valid: 0}
    file.isNftMetadata = false;

    // let newItem = {
    //     index: "-", filePath: file.filePath, isNftMetadata: false, fileStatus: {
    //         isRendered: true, // isRendered means there is a file at the location mentioned in the build file
    //         isValid: true, // isValid means there is a file, and it's hash has been saved, so it's ready for upload
    //         isUploaded: true // isUploaded means the file has been uploaded to IPFS (URL and Hash available)
    //     }
    // };

    asset.metadata.buildData.sourceFiles.push(file);

    // return asset.metadata.buildData.sourceFiles[asset.metadata.buildData.sourceFiles.length - 1];
}

app.addGenericAssetMetadataToFileObject = (asset, file) => {

    if (!asset.metadata) {
        asset.metadata = {
            buildData: {
                isMinted: false,
                sourceFiles: [file],
                thumbIndex: 0,
                thumbWidth: 100
            }
        }
    }

    console.log("[ addGenericAssetMetadataToFileObject ] asset: ", asset);
}

// add the buildData object to metadata that needs it
app.addBuildDataObjectIfNeeded = (metadata) => {

    // console.log("[ addBuildDataObjectIfNeeded ] metadata: ", metadata);

    if (!metadata.buildData) metadata.buildData = {};
    if (!metadata.buildData.isMinted) metadata.buildData.isMinted = false;
    if (!metadata.buildData.sourceFiles) metadata.buildData.sourceFiles = [];

}


app.getSchemaFileType = (fileType) => {

    if (!fileType) {
        return "DataDownload";
    }

    let parts = fileType.split("/");
    if (parts.length > 1) fileType = parts[0];

    switch (fileType) {
        case "3d":
        case "fbx":
        case "obj":
        case "usd":
        case "model":
            return "3DModel";
        case "article":
        case "story":
            return "AmpStory";
        case "audio":
        case "wav":
        case "aif":
        case "aiff":
        case "flac":
        case "mp3":
        case "ogg":
            return "AudioObject";
        case "image":
        case "webp":
        case "jpeg":
        case "jpg":
        case "gif":
        case "png":
            return "ImageObject";
        case "media":
            return "MediaObject";
        case "musicvideo":
            return "MusicVideoObject";
        case "video":
        case "mp4":
            return "VideoObject";
        case "csv":
        case "data":
        case "binary":
        case "file":
        case "json":
        default:
            return "DataDownload";
    }
}


app.convertDurationToIsoForSchema = (t) => {

    t = t.toString();

    //dividing period from time
    let x = t.split('T'),
        duration = '',
        time = {},
        period = {},
        //just shortcuts
        s = 'string',
        v = 'variables',
        l = 'letters',
        // store the information about ISO8601 duration format and the divided strings
        d = {
            period: {
                string: x[0].substring(1, x[0].length),
                len: 4,
                // years, months, weeks, days
                letters: ['Y', 'M', 'W', 'D'],
                variables: {}
            },
            time: {
                string: x[1],
                len: 3,
                // hours, minutes, seconds
                letters: ['H', 'M', 'S'],
                variables: {}
            }
        };
    //in case the duration is a multiple of one day
    if (!d.time.string) {
        d.time.string = '';
    }

    for (let i in d) {
        let len = d[i].len;
        for (let j = 0; j < len; j++) {
            d[i][s] = d[i][s].split(d[i][l][j]);
            if (d[i][s].length > 1) {
                d[i][v][d[i][l][j]] = parseInt(d[i][s][0], 10);
                d[i][s] = d[i][s][1];
            } else {
                d[i][v][d[i][l][j]] = 0;
                d[i][s] = d[i][s][0];
            }
        }
    }
    period = d.period.variables;
    time = d.time.variables;
    time.H += 24 * period.D +
        24 * 7 * period.W +
        24 * 7 * 4 * period.M +
        24 * 7 * 4 * 12 * period.Y;

    if (time.H) {
        duration = time.H + ':';
        if (time.M < 10) {
            time.M = '0' + time.M;
        }
    }

    if (time.S < 10) {
        time.S = '0' + time.S;
    }

    duration += time.M + ':' + time.S;
    return duration;
}