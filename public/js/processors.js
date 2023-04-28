// namespace
if (typeof app === `undefined`) app = {};
if (typeof app.state === `undefined`) app.state = {};
if (typeof app.state.collection === `undefined`) app.state.collection = {};


app.changeBatchProcessingView = function (header) {


    switch (app.batchModalState) {
        case "uploadBatch":
            batchProcessorIdLabel.innerHTML = "Upload Batch";
            break;
        default:
            batchProcessorIdLabel.innerHTML = header;
    }

    if (!app.$batchProcessorAutofillContentId) app.$batchProcessorAutofillContentId = $("#batchProcessorAutofillContentId");
    if (!app.$batchProcessorUploadContentId) app.$batchProcessorUploadContentId = $("#batchProcessorUploadContentId");
    if (!app.$batchProcessorMintContentId) app.$batchProcessorMintContentId = $("#batchProcessorMintContentId");
    if (!app.$batchProcessorMintBatchContentId) app.$batchProcessorMintBatchContentId = $("#batchProcessorMintBatchContentId");

    let iconName = "#mintbatch";

    switch (header) {
        case "Update Metadata":
            app.$batchProcessorAutofillContentId.removeClass("hidden");
            iconName = "#autofix";
            app.$batchProcessorUploadContentId.addClass("hidden");
            app.$batchProcessorMintContentId.addClass("hidden");
            app.$batchProcessorMintBatchContentId.addClass("hidden");
            app.refreshAutoFillForm();
            break;
        case "Upload":
            app.$batchProcessorAutofillContentId.addClass("hidden");
            app.$batchProcessorUploadContentId.removeClass("hidden");
            app.$batchProcessorMintContentId.addClass("hidden");
            app.$batchProcessorMintBatchContentId.addClass("hidden");
            iconName = "#cloudupload";
            break;
        case "Apply Selection to Batch":
            app.$batchProcessorAutofillContentId.addClass("hidden");
            app.$batchProcessorUploadContentId.addClass("hidden");
            app.$batchProcessorMintContentId.removeClass("hidden");
            app.$batchProcessorMintBatchContentId.addClass("hidden");
            iconName = "#addtobatch";
            break;
        case "Batch Actions":
            app.$batchProcessorAutofillContentId.addClass("hidden");
            app.$batchProcessorUploadContentId.addClass("hidden");
            app.$batchProcessorMintContentId.addClass("hidden");
            app.$batchProcessorMintBatchContentId.removeClass("hidden");
            iconName = "#mintbatch";
            break;
    }

    batchModalIconId.setAttribute('xlink:href', iconName);
}


app.updateAssetsGroupingData = (assets) => {

    app.catalogAssetsScanGroups = {};
    app.catalogAssetsScanSubGroups = [];

    for (let asset of assets) {

        if (asset.metadata) {
            for (const sourceFile of asset.metadata.buildData.sourceFiles) {

                if (sourceFile.isNftMetadata || sourceFile.filePath === "metadata.json") continue; // skip metadata for upload, created in Mintr


                let group = app.getGroupFromFilename(sourceFile.filePath);
                if (group[0] === ".") continue;
                if (!app.catalogAssetsScanGroups[group]) app.catalogAssetsScanGroups[group] = {
                    name: group, count: 0, files: []
                };
                app.catalogAssetsScanGroups[group].count++;
                app.catalogAssetsScanGroups[group].files.push(sourceFile.filePath);

                let subGroup = app.getSubGroupFromFilename(sourceFile.filePath);
                if (subGroup) {
                    const fileTypeInfo = app.getFileTypeInfo(app.getFileExtension(sourceFile.filePath));

                    const key = subGroup + "_" + fileTypeInfo.fileType;
                    let item = app.catalogAssetsScanSubGroups.find(item => item.key === key);
                    if (!item) {
                        app.catalogAssetsScanSubGroups.push({
                            name: subGroup,
                            key: key,
                            type: fileTypeInfo.fileType,
                            count: 0,
                            info: fileTypeInfo,
                            files: []
                        });
                        item = app.catalogAssetsScanSubGroups[app.catalogAssetsScanSubGroups.length - 1];
                    }

                    item.count++;
                    item.files.push(sourceFile.filePath);
                }
            }
        }
    }

    app.catalogAssetsScanSubGroups.sort(function (a, b) {
        var textA = a.name.toUpperCase();
        var textB = b.name.toUpperCase();
        return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    });

    // console.log("app.catalogAssetsScanSubGroups: ", app.catalogAssetsScanSubGroups);
// cataloginOptionsFilesListId.innerHTML = app.currentFileScanGroupReport;
}

app.autoFillFormIsDirty = true;

app.refreshAutoFillForm = () => {

    console.log("[ refreshAutoFillForm ]");

    app.autoFillFormIsDirty = false;
    let autoFillGroupingOption = autoFillGroupingOptionId.value;
    app.currentGroupingMode = "autofill";
    if (app.state.collection.autoFillGroupingOption !== autoFillGroupingOption) {
        // autoFillGroupingOption is one of "fileType", "subGroups", "singleFiles"
        app.state.collection.autoFillGroupingOption = autoFillGroupingOption;
        app.doStartAutoFillAll();
    }
}

app.doStartAutoFillAll = async function () {

    // console.log("[ doStartAutoFillAll ]");

    if (app.autoFillFormIsDirty)
        app.refreshAutoFillForm();

    app.changeBatchProcessingView("Update Metadata");

    $("#autoFillGroupingOptionId").change(function () {
        app.refreshAutoFillForm();
    });

    $('#autoFillContentScopeId input[type="radio"]').click(function () {
        app.doStartAutoFillAll();
    });

    let doJustSelectedNft = $("#autoFillProcessItems1").is(':checked');

    // read all items in the collection to get count of all assets
    let assets = await app.db.assets
        .where("collectionId")
        .equals(app.state.collection.currentId)
        .toArray();

    await app.loadCurrentCollectionMediaImportOptions();

    // get totals and groups from the assets
    app.updateAssetsGroupingData(assets);

    // get count of all assets
    let fileTypes = {};
    let subGroups = {};
    let singleFiles = {};

    let currentAssetFileTypes = [];
    let fileTypesSorted = [];
    let toDoCount = 0;
    let nonMintedCount = 0;

    for (let asset of assets) {

        let isCurrentAsset = app.currentAsset ? asset.id === app.currentAsset.id : false;
        if (asset.state === "todo") toDoCount++;

        if (asset.state !== "minted") nonMintedCount++;

        if (asset.metadata) {
            for (const sourceFile of asset.metadata.buildData.sourceFiles) {
                if (sourceFile.fileStatus.isRendered === false) continue;
                if (sourceFile.isNftMetadata || sourceFile.filePath === "metadata.json") continue; // skip metadata for upload, created in Mintr

                // const subGroup = app.getSubGroupFromFile(sourceFile);
                let subGroup = app.getSubGroupFromFilename(sourceFile.name || sourceFile.filePath)
                const fileName = app.getFileName(sourceFile.filePath);
                const parts = fileName.split(".");
                const type = app.getFileTypeInfo(parts[parts.length - 1], "a");

                // console.log(sourceFile);

                if (!doJustSelectedNft || doJustSelectedNft && isCurrentAsset) {
                    if (!fileTypes[type.fileType]) {
                        fileTypes[type.fileType] = {
                            name: type.fileType.toUpperCase(), count: 1, info: type
                        }
                    } else {
                        fileTypes[type.fileType].count++;
                    }


                    if (!subGroups[subGroup]) {
                        subGroups[subGroup] = {
                            name: subGroup, count: 1, info: type
                        }
                    } else {
                        subGroups[subGroup].count++;
                    }

                    if (!singleFiles[fileName]) {
                        singleFiles[fileName] = {
                            name: fileName, count: 1, info: type
                        }
                    } else {
                        singleFiles[fileName].count++;
                    }
                }
                // console.log(`[ doStartAutoFillAll ] fileType: ${type.fileType} - isMedia: ${type.isMedia} - icon: ${type.icon} - actionForThisFile: ${actionForThisFile}`);
            }
        }

    }


    // sort by default media order
    if (app.state.defaultMediaOrder) {
        let cnt = 1;
        for (const e of app.state.defaultMediaOrder) {
            let oneMedia = fileTypes[e.type];

            if (oneMedia) fileTypesSorted.push(oneMedia);
        }
        if (fileTypesSorted.length !== fileTypes.length) fileTypesSorted = fileTypes;
    } else {
        for (const fileType in fileTypes) {
            fileTypesSorted.push(fileTypes[fileType]);
        }
    }

    let html = "";
    let itemCnt = 1;

    let groups = [];
    // autoFillGroupingOption is one of "fileType", "subGroups", "singleFiles"
    if (app.state.collection.autoFillGroupingOption === "subGroups") {
        groups = subGroups;
    } else if (app.state.collection.autoFillGroupingOption === "fileType") {
        // if (app.batchModalState !== "autoFillCurrent")
        groups = fileTypesSorted;
        // else
        //     groups = currentAssetFileTypes;
    } else if (app.state.collection.autoFillGroupingOption === "singleFiles") {
        groups = singleFiles;
    }

    // console.log("[ doStartAutoFillAll ] groups: ", groups);

    for (const index in groups) {

        let orderHtml = `<input type="number" class="form-control catalogItemOrder" placeholder="">`;
        // console.log("[ doStartAutoFillAll ] index: " + index + " - groups:", groups[index]);
        let fileInfo = groups[index].info;
        // console.log("[ doStartAutoFillAll ] index: " + index + " - fileInfo: ", fileInfo);

        let fileType = fileInfo.fileType || "";

        let icon = groups[index].info ? groups[index].info.icon : "";

        let rules = app.getMediaImportRulesFromSubGroup(groups[index].name);


        let template = app.autoFillFileItemTemplate;
        template = template.replace(/ICON/g, icon);
        template = template.replace(/LABEL/g, groups[index].name);
        template = template.replace(/COUNT/g, groups[index].count);
        template = template.replace(/DATAORDER/g, itemCnt);
        template = template.replace(/DATAFILETYPE/g, fileType);
        template = template.replace(/DATASUBGROUP/g, groups[index].name);
        template = template.replace(/LINK_ISCHECKED/g, rules && rules.isLink === true ? "checked" : "");
        template = template.replace(/THUMB_ISCHECKED/g, rules && rules.isThumbnail === true ? "checked" : "");
        template = template.replace(/MAIN_ISCHECKED/g, rules && rules.isMain === true ? "checked" : "");
        template = template.replace(/ORDER/g, orderHtml);

        if (fileType === "json" || fileType === "csv") template = template.replace(/HIDDEN/g, "hidden");

        html += template;
        itemCnt++;
    }

    autofillFileTypeOptionsId.innerHTML = html;
    processItems_AllToDoItemsId.innerHTML = "(" + toDoCount + ")";
    processItems_NonMintedItemsId.innerHTML = "(" + nonMintedCount + ")";

}


app.doAutoFillOfSelectedNft = function () {


    if (!app.batchModal) app.batchModal = new bootstrap.Modal('#batchProcessorId');
    app.state.collection.batchMode = "todo"; //auto–fill
    app.drawBatchModalUi();

    $("#autoFillJustCurrentNftOptionParentId").removeClass("hidden");
    $("#autoFillProcessItems1").prop("checked", true);

    app.batchModalState = "autoFillCurrent";
    app.batchModal.show();

}


app.doUploadOfSelectedNft = function () {
    if (!app.batchModal) app.batchModal = new bootstrap.Modal('#batchProcessorId');

    app.state.collection.batchMode = "ready"; //upload
    app.drawBatchModalUi();
    app.batchModalState = "uploadReady";
    app.batchModal.show();

    uploadAutoFillJustCurrentNftOptionParentId.classList.remove("hidden");

    // if (!app.uploadModal) app.uploadModal = new bootstrap.Modal('#uploadModal');
    // app.uploadModalDoneAction = app.uploadAllForCurrentAsset;
    // app.uploadModal.show();
}


/*app.doUploadAllSourceFiles = function (asset) {
    if (!app.uploadModal) app.uploadModal = new bootstrap.Modal('#uploadModal');

    app.uploadModalDoneAction = app.uploadAllForCurrentAsset;
    app.uploadModal.show();
}*/


app.doUpload = (asset) => {
    // app.uploadAllSourceFiles(app.currentAsset);
}


// Example Input
// NFT identifier:            nft1q6hp586pvwmgmph2l6lcqxk4rd54zmgsjldkhen34yldqqsqmxhq3hlxps
// Current NFT coin ID:       670172ac8f986c9632e1b9024a56df6e870a418ba9256873c7bf9e9e800ba0d8
// Metadata hash:             f5e8dbbe6589e8c59a32eb627cfb1c4e2a0f4b90ab9623be6d43e8ca00f37d75
// NFT identifier:            nft1tq6nu5yrwyqkndxa9v0cs90unruch3u0h300ksv57cj284ala7ds3fwz42
// Current NFT coin ID:       03dc116c62b364944a3efc7b39de614b79b37ab414326d398420694cd1c1c3a6
// Metadata hash:             871d9cec7ccdb8567e6627dcfa60041412ce60217d2a1fb5cf77abddad8c896f

app.addNftIdList = (file, callback = null) => {

    console.log("[ addNftIdList ] file: ", file);


    let fileReader = new FileReader();
    fileReader.addEventListener("load", async function (event) {

        let fileSource = event.target.result;

        // not the special file we are looking for?
        const searchResult = fileSource.lastIndexOf("Metadata hash");
        if (searchResult < 0) {
            if (callback !== null) callback();
            return;
        }

        // flag to be imported as a generic file
        // file.used = true;
        app.setFileUsed(file);
        // file.imported = true;

        const lines = fileSource.split("\n");

        // parse the stream from the nft id text file by putting them in an array of {id,hash} objects
        app.addNftIdListItems = [];
        for (const line of lines) {
            const lineParts = line.split(":");
            if (!lineParts[0]) continue; // weird end of file chars
            const lineLabel = lineParts[0].trim().toLowerCase();
            const lineValue = lineParts[1].trim();

            // console.log("[ addNftIdList ] line: " + lineLabel + " - lineValue: " + lineValue);

            // build object
            if (!app.addNftIdCurrentItem) app.addNftIdCurrentItem = {};
            if (lineLabel === "nft identifier") app.addNftIdCurrentItem.id = lineValue;
            if (lineLabel === "metadata hash") app.addNftIdCurrentItem.hash = lineValue;
            if (lineLabel === "current nft coin id") app.addNftIdCurrentItem.coinId = lineValue;

            // add to array and reset object when complete
            if (app.addNftIdCurrentItem.id && app.addNftIdCurrentItem.hash && app.addNftIdCurrentItem.coinId) {
                app.addNftIdListItems.push(JSON.parse(JSON.stringify(app.addNftIdCurrentItem)));
                app.addNftIdCurrentItem = {};
            }
        }

        console.log("[ addNftIdList ] addNftIdListItems: ", app.addNftIdListItems);
        // metadataHash:"0a2694d169a32f65c8ecd68739eee1c35356235880d6f6bda9a2ef28468a6e74"

        if (app.addNftIdListItems.length > 0) {

            const assets = await app.db.assets
                .where('collectionId')
                .equals(app.state.collection.currentId)
                .toArray();

            let foundCount = 0;
            for (const asset of assets) {
                if (!asset.metadata || !asset.metadata.metadataHash) continue; // avoid bad data being written
                // console.log("[ addNftIdList ] metadataHash: " + asset.metadata.metadataHash + " - asset: ", asset);
                const result = app.addNftIdListItems.find(obj => {
                    // console.log("[ addNftIdList ] metadataHash: " + asset.metadata.metadataHash + " - obj.hash: " + obj.hash);
                    return obj.hash === asset.metadata.metadataHash
                });

                // found a record with a matching hash?
                if (result !== undefined) {
                    foundCount++;
                    asset.metadata.nftId = result.id;
                    asset.metadata.coinId = result.coinId;
                    console.log(`[ addNftIdList ] FOUND ${foundCount}! metadataHash: ` + asset.metadata.metadataHash + " - asset.metadata: ", asset.metadata);
                    await app.db.assets
                        .where('id')
                        .equals(asset.id)
                        .modify({metadata: asset.metadata});

                } else {
                    // clear coin Id, because old coin IDs are not valid anymore
                    asset.metadata.coinId = "";
                    await app.db.assets
                        .where('id')
                        .equals(asset.id)
                        .modify({metadata: asset.metadata});
                }

            }

        }
        if (callback !== null) callback();


    });

    //Read the image
    fileReader.readAsText(file);


}


app.uploadAllSourceFiles = async function (asset, callback = null) {

    if (!asset) {
        if (callback !== null) callback();
        return;
    }

    let options = {
        overwrite: (overwriteUploadModeId && overwriteUploadModeId.checked),
        check: (checkUploadedFirstUploadModeId && checkUploadedFirstUploadModeId.checked)
    };

    let mode = "newOnly";

    if (justMetadataUploadModeId && justMetadataUploadModeId.checked) mode = "metadataOnly";

    if (overwriteUploadModeId && overwriteUploadModeId.checked) mode = "all";

    // console.log(`[ uploadAllSourceFiles ] START - mode: ${mode} `, asset);

    await app.loadCurrentCollectionMediaImportOptions();

    let needMetadataUpload = mode === "all" || mode === "metadataOnly";

    if (mode !== "metadataOnly") {
        for (const sourceFile of asset.metadata.buildData.sourceFiles) {
            if (sourceFile.isNftMetadata || sourceFile.filePath === "metadata.json") continue; // skip metadata for upload (uploaded later)

            const uploadNeeded = await app.isUploadNeeded(sourceFile, asset, options);
            if (!uploadNeeded) {
                // console.log("[ uploadAllSourceFiles ] ABORTED - uploadNeeded: " + uploadNeeded);
                continue;
            }
            // console.log("[ uploadAllSourceFiles ] UPLOAD : ", sourceFile);

            // upload metatdata if new assets are uploaded
            needMetadataUpload = true;

            app.addToQueue({
                priority: 4,
                state: "uploaded",
                action: "uploadSourceFile",
                sourceFile: sourceFile,
                asset: asset,
                options: options
            });

        }
    }

    if (needMetadataUpload) {
        app.addToQueue({
            priority: 4, // same as uploadSourceFile priority or it will have to wait for all to finish 1
            action: "uploadMetadata", asset: asset
        });
    } else {
        // console.log("[ uploadAllSourceFiles ] SKIPPED METADATA UPLOAD: ", asset);
    }

    if (!app.uploadFilepickerData) {
        if (!app.uploadModal) app.uploadModal = new bootstrap.Modal('#uploadModal');
        app.uploadModal.show();
    } else {
        app.doNextInQueue();
    }

    if (callback !== null) callback();
}


app.isUploadNeeded = (sourceFile, asset, options) => {

    return new Promise(async (resolve, reject) => {


        if (!sourceFile.fileStatus.isValid) {
            // console.log("[ isUploadNeeded ] ABORTED - NOT VALID: ", sourceFile);
            resolve(false);
            return;
        }
        /* if (sourceFile.isLink === false && sourceFile.isMain === false && sourceFile.isThumbnail === false) {
             // console.log("[ isUploadNeeded ] ABORTED - not used in the metadata, so this sourceFile was skipped! ", sourceFile);
             resolve(false);
             return;
         }*/

        if (!options.overwrite && !options.check && sourceFile.fileStatus.isUploaded === true) {
            // console.log("[ isUploadNeeded ] ABORTED ALREADY UPLOADED AND NOT OVERWRITING OR CHECKING", sourceFile);
            resolve(false);
            return;
        }

        if (options.check && sourceFile.fileStatus.isUploaded === true) {
            const uploadedFilePassed = await app.checkUploadedFile(sourceFile, asset);
            if (uploadedFilePassed) {
                // console.log("[ isUploadNeeded ] ABORTED - UPLOAD PASSED HASH CHECK: ", sourceFile);
                resolve(false);
                return;
            } else {
                console.log("[ isUploadNeeded ] FILE UPLOADED FILE CHECK, UPLOADING AGAIN: ", sourceFile);
            }
        }
        // when true, upload needed
        resolve(true);
    });
}


app.startAutoFillAll = async function () {

    let options = {
        overwrite: (overwriteAutoFillModeId && overwriteAutoFillModeId.checked)
    };

    app.refreshCatalogNeeded = true;

    await app.saveCurrentCollectionMediaImportOptions();

    let doJustSelectedNft = $("#autoFillProcessItems1").is(':checked');
    let doAllNotMintedItems = $("#autoFillProcessItems3").is(':checked');

    // determines the order of media, the first is considered the main asset
    await app.updateDefaultMediaOrder();
    await app.saveState();

    let assets = [];

    if (doAllNotMintedItems) {

        assets = await app.db.assets
            .where(['collectionId+state'])
            .notEqual([app.state.collection.currentId, "minted"])
            .toArray();

        // console.log(`[ startAutoFillAll ] - doAllNotMintedItemsSTART - overwrite: ${options.overwrite} - assets: `, assets);

    } else if (app.batchModalState === "autoFillCurrent" && doJustSelectedNft) {

        assets = await app.db.assets
            .where('id')
            .equals(app.currentAssetId)
            .toArray();

        // console.log(`[ startAutoFillAll ] - autoFillCurrent - overwrite: ${options.overwrite} - assets: `, assets);

    } else {

        assets = await app.db.assets
            .where(['collectionId+state'])
            .equals([app.state.collection.currentId, "todo"])
            .toArray();

        // console.log(`[ startAutoFillAll ] - todo - overwrite: ${options.overwrite} - assets: `, assets);

    }

    for (let asset of assets) {
        app.addToQueue({
            priority: 3, action: "autofill", asset: asset, options: options
        });
        app.doNextInQueue();
    }

}


app.addAllToBatch = async function () {

    let createNewBatch = newBatchWithSelectionModeId && newBatchWithSelectionModeId.checked;
    let replaceBatch = replaceBatchWithSelectionModeId && replaceBatchWithSelectionModeId.checked;
    let removeFromBatch = removeFromBatchWithSelectionModeId && removeFromBatchWithSelectionModeId.checked;

    let selectedBatchId = $("#addToBatchOptionsId").val();

    console.log(`[ addAllToBatch ] START selectedBatchId: `, selectedBatchId);


    let newBatchId = -1;

    if (createNewBatch) {

        if (!app.state.mintBatch) app.state.mintBatch = {};
        // new batch values from defaults
        app.state.mintBatch.options = {
            name: newBatchNameId.value || "untitled",
            metadataFileName: "bulk_mint_metadata.csv",
            pathToFile: "~/Downloads/",
            royalty: app.state.collection.userData.royaltyPercent || 3, // default royalty is 3
            offerAmountInMojo: app.convertXchToMojoString(app.state.collection.userData.fee),
            royaltyAddress: app.state.collection.userData.royaltyAddress
        }

        await app.db.batches.add({
            options: app.state.mintBatch.options,
            dateCreated: new Date().getTime(),
            collectionId: app.state.collection.currentId,
            assetIndexes: app.state.selection.arrayOfIndexes
        }).then((newId) => {
            newBatchId = newId;

            app.renderCollectionBatchList();
        });
    } else {
        if (replaceBatch) {

            console.log(`[ addAllToBatch ] START replaceBatch ${selectedBatchId} with: `, app.state.selection.arrayOfIndexes);
            await app.db.batches.update(parseInt(selectedBatchId), {
                assetIndexes: app.state.selection.arrayOfIndexes
            });


        } else if (removeFromBatch) {

            //update batch
            const batchData = await app.db.batches
                .where('id')
                .equals(parseInt(selectedBatchId))
                .toArray();

            // console.log(`[ removeFromBatch ] START assetIndexes: `, batchData[0].assetIndexes);

            for (const arrayOfIndex of app.state.selection.arrayOfIndexes) {
                batchData[0].assetIndexes = batchData[0].assetIndexes.filter(e => e !== arrayOfIndex);
            }
            console.log(`[ removeFromBatch ] batchData[0].assetIndexes: `, batchData[0].assetIndexes);

            await app.db.batches.update(parseInt(selectedBatchId), {
                assetIndexes: batchData[0].assetIndexes
            });

        } else {

            //update batch
            const batchData = await app.db.batches
                .where('id')
                .equals(parseInt(selectedBatchId))
                .toArray();

            console.log(`[ addAllToBatch ] START assetIndexes: `, batchData[0].assetIndexes);

            //  splat operator for array union (limited support?)
            var union = [...new Set([...batchData[0].assetIndexes, ...app.state.selection.arrayOfIndexes])];

            await app.db.batches.update(parseInt(selectedBatchId), {
                assetIndexes: union
            });

        }
        app.renderCollectionBatchList();
    }


}


app.startUploadAll = async function () {

    if (!app.uploadModal) app.uploadModal = new bootstrap.Modal('#uploadModal');
    app.prepareFilePickerListeners();
    app.uploadModalDoneAction = app.doUploadAll;
    app.uploadModal.show();
    await app.loadCurrentCollectionMediaImportOptions();
}


app.doUploadAll = async function () {

    // console.log("[ doUploadAll ] ");

    if (!app.state.collection.userData.nftStorageApiToken) {
        alert("Missing NFT Storage API Token");
        return;
    }

    if (uploadCurrentNFTId && uploadCurrentNFTId.checked) {
        app.addToQueue({
            priority: 5, action: "uploadAllSourceFiles", asset: app.currentAsset
        });
        app.doNextInQueue();
    } else if (app.batchModalState === "uploadBatch") {


        const batches = await app.db.batches
            .where("id")
            .equals(app.currentBatchId)
            .toArray();

        for (let batch of batches) {

            // console.log("[ doUploadAll ][ uploadBatch ] app.currentBatchId " + app.currentBatchId, batch);
            for (let assetIndex of batch.assetIndexes) {

                const assets = await app.db.assets
                    .where('[collectionId+index]')
                    .equals([app.state.collection.currentId, assetIndex])
                    .toArray();

                // console.log("[ doUploadAll ][ uploadBatch ] assetIndex: " + assetIndex + " - assets: ", assets);
                if (assets.length > 0) {
                    app.addToQueue({
                        priority: 5, action: "uploadAllSourceFiles", asset: assets[0]
                    });
                    app.doNextInQueue();
                }

            }
        }


    } else {
        // upload everything in a collection!
        const assets = await app.db.assets
            .where("collectionId")
            .equals(app.state.collection.currentId)
            .toArray();

        for (let asset of assets) {
            app.addToQueue({
                priority: 5, action: "uploadAllSourceFiles", asset: asset
            });
            app.doNextInQueue();
        }
    }

}

//
// app.doUploadAll = function () {
//
//     console.log("[ doUploadAll ] ");
//     app.db.open().then(function () {
//
//
//         // upload all "to do"
//         // return app.db.assets
//         //     .where(['collectionId+state'])
//         //     .equals([app.state.collection.currentId, "ready"])
//         //     .toArray();
//
//         // upload everything in a collection!
//         return app.db.assets
//             .where("collectionId")
//             .equals(app.state.collection.currentId)
//             .toArray();
//
//     }).then(function (assets) {
//
//         for (let asset of assets) {
//             // console.log(asset);
//
//             app.addToQueue({
//                 priority: 5,
//                 action: "uploadAllSourceFiles",
//                 asset: asset
//             });
//             app.doNextInQueue();
//             // app.uploadAllSourceFiles(asset);
//         }
//
//     }).catch(Dexie.MissingAPIError, function () {
//         console.log("Couldn't find indexedDB API");
//     });
//
// }


app.doStartUploadAll = function () {
    // console.log("[ doStartAutoFillAll ] ");
    uploadAutoFillJustCurrentNftOptionParentId.classList.add("hidden")
    app.changeBatchProcessingView("Upload");
}


app.doAddAllToBatch = function () {
    app.changeBatchProcessingView("Apply Selection to Batch");
}

app.doStartMintBatch = function () {
    app.changeBatchProcessingView("Batch Actions");
    // app.mintBatchFormToOptions();
    app.drawMintBatchOptions("doStartMintBatch");
}

// contentRating: "G",
// contentSize: "2.5 MB",
// height: "1000px",
// width: "1000",
// duration: "T0M10S",
// "@type": "VideoObject",
// encodingFormat: "video/mp4",
app.defaultMetadataDataNode = {
    "@context": "https://schema.org", thumbnail: [], encodesCreativeWork: {}
}

// "encodingFormat": "FILE_ENCODING",
app.thumbnailMetadataTemplate = `
{
    "@type": "FILE_TYPE",
    "sha256": "FILE_HASH",
    "height": "FILE_HEIGHT",
    "width": "FILE_WIDTH",
    "name": "FILE_NAME",
    "size": "FILE_SIZE",
    "url": "FILE_URL"
}`;

// "encodingFormat": "FILE_ENCODING",
app.mediaMetadataTemplate = `
{
    "@type": "FILE_TYPE",
    "sha256": "FILE_HASH",
    "name": "FILE_NAME",
    "size": "FILE_SIZE",
    "url": "FILE_URL"
}`;


app.getFileInfoForMetadata = (fileFound) => {

    // console.log("[ getFileInfoForMetadata ] file: ", fileFound);

    return new Promise((resolve, reject) => {


        let data = {};
        let fileReader = new FileReader();
        fileReader.onload = async function (theFile) {

            data.hash = await app.getHash(theFile.target.result);
            data.size = theFile.total;

            let fileFormat = app.getFileMediaFormat(fileFound);
            // console.log('[ getFileInfoForMetadata ] File loaded - fileFormat: ' + fileFormat, theFile);


            if (fileFormat === "image" || fileFormat === "video") {

                // console.log('[ getFileInfoForMetadata ] Reading media dimensions - fileFormat: ' + fileFormat + ' - file size: ', data.size);

                fileReader.onload = (theMediaFile) => {
                    // console.log('[ getFileInfoForMetadata ] LOADED MEDIA fileFormat: ', theMediaFile);

                    if (fileFormat === "image") {
                        const mediaElement = new Image();
                        mediaElement.onload = () => {

                            data.width = mediaElement.width;
                            data.height = mediaElement.height;

                            // console.log('[ getFileInfoForMetadata ] READ IMAGE SIZE' + ' - width:' + data.width + ' - height: ' + data.height + ' - this:' + this);

                            resolve(data);
                        }
                        mediaElement.onerror = () => {
                            // reject('[ getFileInfoForMetadata ] reading media dimensions... oops, something went wrong with the file reader.')
                            resolve(data);
                        }
                        mediaElement.src = theMediaFile.target.result;
                    }
                    // resolve(data);
                    if (fileFormat === "video") {

                        const videoEl = document.getElementById("importVideoForSizingId");
                        videoEl.addEventListener("loadedmetadata", function (e) {
                            data.width = this.videoWidth;
                            data.height = this.videoHeight;
                            data.duration = this.duration;
                            // console.log('[ getFileInfoForMetadata ] READ VIDEO SIZE ' + '- width:' + data.width + ' - height: ' + data.height + ' - duration: ' + data.duration + ' - size: ' + data.size, this);
                            // videoEl.src = "";
                            resolve(data);

                        }, false);
                        videoEl.src = theMediaFile.target.result;

                    }

                }
                fileReader.readAsDataURL(fileFound);
            } else {
                resolve(data);
            }

        }
        fileReader.onerror = () => {
            // reject('oops, something went wrong with the file reader.')
            resolve(data);
        }
        fileReader.readAsArrayBuffer(fileFound);

    });


}

app.getMediaImportRulesFromFileType = (type) => {
    let parts = type.split("/");
    if (parts.length > 1) type = parts[1];

    for (let i in app.state.collection.mediaImportOptions) {
        if (app.state.collection.mediaImportOptions[i].type && app.state.collection.mediaImportOptions[i].type === type) return app.state.collection.mediaImportOptions[i];
    }
    return null;
}

app.getMediaImportRulesFromFileName = (filename) => {
    let subGroup = app.getSubGroupFromFilename(filename);
    // console.log("[ getMediaImportRulesFromFileName ] filename: " + filename + " - subGroup: ", subGroup);
    const rules = app.getMediaImportRulesFromSubGroup(subGroup);
    // console.log("[ getMediaImportRulesFromFileName ] mediaImportOptions: ", app.state.collection.mediaImportOptions);
    // console.log("[ getMediaImportRulesFromFileName ] rules: ", rules);
    return rules;
}

app.getMediaImportRulesFromSubGroup = (subGroup) => {
    // console.log("[ getMediaImportRulesFromSubGroup ] subGroup: " + subGroup + " app.state.collection.mediaImportOptions: ", app.state.collection.mediaImportOptions)
    for (let i in app.state.collection.mediaImportOptions) {
        // console.log("[ getMediaImportRulesFromSubGroup ] [" + i + "]: ", app.state.collection.mediaImportOptions[i])
        if (app.state.collection.mediaImportOptions[i].subgroup && app.state.collection.mediaImportOptions[i].subgroup === subGroup) return app.state.collection.mediaImportOptions[i];
    }

    return null;
}


/*app.getDataNodeMetadata = () => {

    let data = {};
    // make a copy of the default data
    data = JSON.parse(JSON.stringify(app.defaultMetadataDataNode));

    data.thumbnail = [];
    data.encodesCreativeWork = [];

    return data;
}*/

// adds metadata for thumbnails and Asset Links
app.updateAssetReferences = function (asset) {

    // console.log("[ updateAssetReferences ] app.state.collection.mediaImportOptions: ", app.state.collection.mediaImportOptions);
    console.log("[ updateAssetReferences ] asset: ", asset);

    // if (!asset.metadata.data) asset.metadata.data = JSON.parse(JSON.stringify(app.defaultMetadataDataNode));

    // make a copy of the default data
    asset.metadata.data = JSON.parse(JSON.stringify(app.defaultMetadataDataNode));
    asset.metadata.data.thumbnail = [];
    asset.metadata.data.encodesCreativeWork = [];
    asset.thumbnailFirstSrc = "";
    asset.thumbnailSrcSet = "";
    asset.thumbnailSrcSetHtml = "";

    app.state.addAssetReferencesWithoutLinks = true;
    app.useAssetsWithoutRules = true;

    let mainCount = 0;
    let sortOrder = 1;
    if (asset.metadata.buildData) {
        for (let i = 0; i < asset.metadata.buildData.sourceFiles.length; i++) {

            if (asset.metadata.buildData.sourceFiles[i].index === "-") continue;

            if (!app.state.addAssetReferencesWithoutLinks && !asset.metadata.buildData.sourceFiles[i].ipfs) continue;

            if (asset.metadata.buildData.sourceFiles[i].fileStatus.isRendered === false || asset.metadata.buildData.sourceFiles[i].fileStatus.isValid === false) continue;

            /*if (!asset.metadata.buildData.sourceFiles[i].type) {
                // metadata.json files don't have a type
                console.log("[ updateAssetReferences ] missing type, aborted: ", asset.metadata.buildData.sourceFiles[i]);
                continue;
            }*/


            let filename = asset.metadata.buildData.sourceFiles[i].name || asset.metadata.buildData.sourceFiles[i].filePath;
            let rules = app.getMediaImportRulesFromFileName(asset.metadata.buildData.sourceFiles[i].filePath);

            console.log("[ updateAssetReferences ] sourceFile: ", asset.metadata.buildData.sourceFiles[i]);


            if (rules) {
                console.log("[ updateAssetReferences ] rule: ", rules);

                asset.metadata.buildData.sourceFiles[i].isThumbnail = rules.isThumbnail;
                if (rules.isMain) {
                    // only allow a single main file
                    mainCount++
                    asset.metadata.buildData.sourceFiles[i].isMain = mainCount === 1;
                } else {
                    asset.metadata.buildData.sourceFiles[i].isMain = false;
                }
                asset.metadata.buildData.sourceFiles[i].isLink = rules.isLink;
            } else {
                // console.log("[ updateAssetReferences ] NO RULES!!!!!!!!!!!: ", asset.metadata.buildData.sourceFiles[i].filePath);
            }

            /*
                    if (rules.isLink === true) {
            // The issue is that attributes are being added to the metadata for file refs. this should only be done when writing the metadata to preview or the final file
                        let found = false;
                        let trait_type = "Link (" + asset.metadata.buildData.sourceFiles[i].type + ")";
                        console.log("[ updateAssetReferences ] ADD LINK: " + trait_type);
                        let value = asset.metadata.buildData.sourceFiles[i].ipfs;
                        for (const attribute of asset.metadata.attributes) {
                            if (attribute.trait_type === trait_type || attribute.value === value) {
                                attribute.trait_type = trait_type;
                                attribute.value = value;
                                attribute.isInsertedLink = true;
                                found = true;
                                break;
                            }
                        }
                        if (!found) asset.metadata.attributes.push({trait_type: trait_type, value: value, isInsertedLink: true});
                    }*/


            if (app.useAssetsWithoutRules || (rules && rules.isMain === true)) {
                // let fileType = (asset.metadata.buildData.sourceFiles[i].processedFileType ? asset.metadata.buildData.sourceFiles[i].processedFileType : app.getFileType(asset.metadata.buildData.sourceFiles[i].filePath)).toUpperCase();
                asset.metadata.sourceImageFileName = asset.metadata.buildData.sourceFiles[i].filePath;
                asset.metadata.mainFileUrl = asset.metadata.buildData.sourceFiles[i].ipfs;
                asset.metadata.assetHash = asset.metadata.buildData.sourceFiles[i].hash;
                // console.log("[ updateAssetReferences ] FOUND MAIN: " + fileType);
                asset.metadata.data["@type"] = app.getSchemaFileType(asset.metadata.buildData.sourceFiles[i].type);

                if (asset.metadata.buildData.sourceFiles[i].type)
                    asset.metadata.data["encodingFormat"] = asset.metadata.buildData.sourceFiles[i].type;

                if (asset.metadata.buildData.sourceFiles[i].size) asset.metadata.data["contentSize"] = app.formatSizeUnits(asset.metadata.buildData.sourceFiles[i].size);

                if (asset.metadata.buildData.sourceFiles[i].width) {
                    asset.metadata.data["width"] = parseInt(asset.metadata.buildData.sourceFiles[i].width);
                }

                if (asset.metadata.buildData.sourceFiles[i].height) {
                    asset.metadata.data["height"] = parseInt(asset.metadata.buildData.sourceFiles[i].height);
                }

                if (asset.metadata.buildData.sourceFiles[i].duration) asset.metadata.data["duration"] = moment.duration(asset.metadata.buildData.sourceFiles[i].duration, 'second').toISOString();

                // asset.metadata.data["height"] = parseInt(asset.metadata.buildData.sourceFiles[i].height);

            }


            let template = app.thumbnailMetadataTemplate;

            if (!asset.metadata.buildData.sourceFiles[i].height || isNaN(asset.metadata.buildData.sourceFiles[i].height))
                template = app.mediaMetadataTemplate;

            template = template.replace(/FILE_NAME/g, app.getFileName(asset.metadata.buildData.sourceFiles[i].filePath));
            template = template.replace(/FILE_TYPE/g, app.getSchemaFileType(app.getFileType(filename)));
            // template = template.replace(/FILE_ENCODING/g, asset.metadata.buildData.sourceFiles[i].type);
            template = template.replace(/FILE_HASH/g, asset.metadata.buildData.sourceFiles[i].hash);
            template = template.replace(/FILE_HEIGHT/g, parseInt(asset.metadata.buildData.sourceFiles[i].height));
            template = template.replace(/FILE_WIDTH/g, parseInt(asset.metadata.buildData.sourceFiles[i].width));
            template = template.replace(/FILE_URL/g, asset.metadata.buildData.sourceFiles[i].ipfs);
            template = template.replace(/FILE_SIZE/g, app.formatSizeUnits(asset.metadata.buildData.sourceFiles[i].size));


            let json = JSON.parse(template);

            if (asset.metadata.buildData.sourceFiles[i].type)
                json.encodingFormat = asset.metadata.buildData.sourceFiles[i].type;

            if (rules && rules.isThumbnail === true) {

                asset.metadata.data.thumbnail.push(json);

                if (asset.metadata.buildData.sourceFiles[i].ipfs) {
                    if (asset.thumbnailFirstSrc === "") asset.thumbnailFirstSrc = asset.metadata.buildData.sourceFiles[i].ipfs;
                    asset.thumbnailSrcSet += asset.metadata.buildData.sourceFiles[i].ipfs + " " + asset.metadata.buildData.sourceFiles[i].width + "w, "
                }
            }


            if (app.useAssetsWithoutRules || (rules && (rules.isMain === true || rules.isLink === true))) {
                asset.metadata.data.encodesCreativeWork.push(json);
            }

        }
    }

    if (asset.thumbnailSrcSet !== "") asset.thumbnailSrcSetHtml = `srcset="${asset.thumbnailSrcSet}" src="${asset.thumbnailFirstSrc}"`;
}

app.capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

app.applyDefaultMediaOrderToBuildDataAssets = function (asset) {

    if (!asset.metadata.buildData) return;

    let foundThumbnail = true;
    let thumbnailWidth = 0;


    for (let i = 0; i < asset.metadata.buildData.sourceFiles.length; i++) {
        asset.metadata.buildData.sourceFiles[i].index = app.getDefaultIndexForFile(asset.metadata.buildData.sourceFiles[i].filePath);

        // if (asset.metadata.buildData.sourceFiles[i].isThumbnail === true && asset.metadata.buildData.width > thumbnailWidth) {
        if (asset.metadata.buildData.sourceFiles[i].isThumbnail === true && asset.metadata.buildData.sourceFiles[i].thumb) {
            asset.metadata.buildData.thumbIndex = i;
            thumbnailWidth = asset.metadata.buildData.width;
            foundThumbnail = true;
        }
    }

    if (!foundThumbnail) {
        for (let i = 0; i < asset.metadata.buildData.sourceFiles.length; i++) {
            if (asset.metadata.buildData.sourceFiles[i].index === 1) {
                asset.metadata.buildData.thumbIndex = i;
                return;
            }
        }
    }
}

app.getDefaultIndexForFile = function (filename) {
    if (!app.state || !app.state.defaultMediaOrder) return;
    const parts = filename.split(".");
    const ext = parts[parts.length - 1];

    // console.log("[ getDefaultIndexForFile ] " + ext);
    // console.log(app.state.defaultMediaOrder);

    for (const e of app.state.defaultMediaOrder) {
        if (ext === e.type) return e.originalOrder
    }
}


//
// Step: To Do "Auto–fill renamed to "Update Metadata"
// Copy details to each item from defaults
//
app.doAutoFill = async function (action, callback = null) {

    // console.log("[ doAutoFill ] START ", action);

    action.asset = await app.getAssetDataWithId(action.asset.id);

    let collectionData = await app.getCollectionData(action.asset.collectionId);

    // console.log("[ doAutoFill ] collectionData: ", collectionData);

    action.asset.metadata.seriesNumber = action.asset.index;

    action.asset.metadata = app.copyMetadataToMetadata(collectionData, action.asset.metadata, action.options.overwrite);

    // console.log("[ doAutoFill ] action.asset.metadata: ", action.asset.metadata);

    let nextState = "ready";

    app.applyDefaultMediaOrderToBuildDataAssets(action.asset);

    await app.updateDefaultMediaOrder();

    app.updateAssetReferences(action.asset);

    const overrides = app.state.collection.userData.overrides || app.defaultOverrideCheckboxValues;
    if (overrides.seriesTotalCheckboxId !== true) {

        const total = await app.db.assets
            .where('collectionId')
            .equals(action.asset.collectionId)
            .count();

        action.asset.metadata.seriesTotal = total;
    }

    let data = {
        name: app.getTitleForUi(action.asset), metadata: action.asset.metadata, state: nextState
    }

    if (action.asset.thumbnailSrcSet) data.thumbnailSrcSet = action.asset.thumbnailSrcSet;

    await app.db.assets
        .where('id')
        .equals(action.asset.id)
        .modify(data);

    if (app.currentAsset && action.asset.id === app.currentAsset.id) {
        app.collectionEditorEditItem(action.asset.id);
        app.updateUiListItem(action.asset);
    }

    if (callback !== null) callback();

}

/*app.isAssetReady = function (asset) {

    let isReadyForUpload = true;

    for (const sourceFile of asset.metadata.buildData.sourceFiles) {
        // if(sourceFile.fileStatus.isRendered)
    }

    return isReadyForUpload;
}*/


app.getTitleForUi = function (asset) {
    return asset.metadata.nftName || asset.filePath || "";
}


app.updateUiListItem = function (asset) {
    let el = $('*[data-id="' + asset.id + '"]');
    // console.log("[ updateUiListItem ]");

    $(el).find('.itemState').html(app.getHumanReadableState(asset.state));
    $(el).find('.itemTitle').html(app.getTitleForUi(asset));

    // console.log(el);
    // console.log($(el).find('.itemTitle'));
}

/*

app.uploadAll = async function (asset, callback = null) {

    console.log("[ uploadAll ]");
    console.log(asset.metadata);

    let uploadOverwrite = true;

    for (const sourceFile of asset.metadata.buildData.sourceFiles) {
        app.uploadSourceFile(sourceFile, asset, options, app.queueActionComplete);
    }

    app.db.open()
        .then(function () {

            app.db.assets
                .where('index')
                .equals(asset.index)
                .modify({metadata: asset.metadata})
                .then(function () {
                    if (callback !== null) callback();
                });

        });

}
*/

app.findFileInUploadFilePickerData = (sourceFile) => {
    // console.log("[ findFileInUploadFilePickerData ] sourceFile: ", sourceFile);

    let name = sourceFile.name;
    if (!sourceFile.name) {
        if (!sourceFile.filePath) return null;
        name = app.getFileName(sourceFile.filePath);
    }

    for (const index in app.uploadFilepickerData) {

        if (app.uploadFilepickerData[index].name === name) {
            // console.log("[ findFileInUploadFilePickerData ] FOUND!!! filepicker: ", app.uploadFilepickerData[index].name, " - name: ", name);
            return app.uploadFilepickerData[index];
        }
        // console.log("[ findFileInUploadFilePickerData ] filepicker: ", app.uploadFilepickerData[index].name, " - name: ", name);
    }
    return null;
}


app.readFile = (file) => {
    return new Response(file).arrayBuffer();
}

app.checkUploadedFile = (sourceFile, asset) => {
    return new Promise(async (resolve, reject) => {

        if (!sourceFile.ipfs) {
            console.log("[ checkUploadedFile ] ABORT - No Upload: ", sourceFile);
            resolve(false);
            return;
        }

        // console.log("[ checkUploadedFile ] sourceFile: ", sourceFile);
        // console.log("[ checkUploadedFile ] asset: ", asset);

        app.currentlyCheckingFileName = sourceFile.name || app.getFileName(sourceFile.filePath);

        jQuery.ajax(sourceFile.ipfs, {
            dataType: 'binary', xhr() {
                let myXhr = jQuery.ajaxSettings.xhr();
                myXhr.responseType = 'blob';
                myXhr.addEventListener('progress', app.downloadProgress, false);
                return myXhr;
            }
        }).then(async (response) => {
            // response is a Blob, convert to arrayBuffer, and get it's hash
            const arrayBuffer = await new Response(response).arrayBuffer();
            const hashOfFile = await app.getHash(arrayBuffer);

            if (sourceFile.hash !== "" && sourceFile.hash === hashOfFile) {
                // console.log("[ checkUploadedFile ] VALID: SUCCESS DOWNLOADING, HASHES MATCH: (hashOfFile: " + hashOfFile + ")", sourceFile);
                resolve(true);
            } else {
                // console.log("[ checkUploadedFile ] NOT VALID: SUCCESS DOWNLOADING, HASHES MISMATCH: (hashOfFile: " + hashOfFile + ")", sourceFile);
                resolve(false);
            }

        });


    });
}

/*app.base64ToBlob = (base64, mimetype, slicesize) => {
    if (!window.atob || !window.Uint8Array) {
        // The current browser doesn't have the atob function. Cannot continue
        return null;
    }
    mimetype = mimetype || '';
    slicesize = slicesize || 512;
    let bytechars = atob(base64);
    let bytearrays = [];
    for (let offset = 0; offset < bytechars.length; offset += slicesize) {
        let slice = bytechars.slice(offset, offset + slicesize);
        let bytenums = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            bytenums[i] = slice.charCodeAt(i);
        }
        let bytearray = new Uint8Array(bytenums);
        bytearrays[bytearrays.length] = bytearray;
    }
    return new Blob(bytearrays, {type: mimetype});
};*/


app.uploadSourceFile = async (sourceFile, asset, options, callback = null) => {

    const uploadNeeded = await app.isUploadNeeded(sourceFile, asset, options);
    if (!uploadNeeded) {
        // console.log("[ uploadSourceFile ] ABORTED - uploadNeeded: " + uploadNeeded);
        if (callback !== null) callback();
        return;
    }


    // console.log("[ uploadSourceFile ] sourceFile: ", sourceFile);
    // console.log("[ uploadSourceFile ] asset: ", asset);

    let file = sourceFile;
    if (!sourceFile.thumb) {
        // console.log("[ uploadSourceFile ] NO IMPORTED DATA TO UPLOAD");
        // console.log(sourceFile);


        if (sourceFile.hash) {
            file = app.findFileInUploadFilePickerData(sourceFile)

            if (file) {
                // console.log("[ uploadSourceFile ] DISABLED!!!! FOUND HASH, FOUND MATCHING FILE IN FILEPICKER FILES - file: ", file);
                // allowing upload to continue
            } else {
                // console.log("[ uploadSourceFile ] FOUND HASH, BUT NO MATCHING FILE FOUND!");
                if (callback !== null) callback();
            }

        } else if (callback !== null) {
            callback();
            return;
        }

    } else {
        file = sourceFile.thumb || file;
    }

    // used for the UI queue display
    app.currentlyUploadingFileName = sourceFile.name || app.getFileName(sourceFile.filePath);

    // console.log("[ uploadSourceFile ] file: ", file);

    $.ajax({
        type: "POST",
        url: "https://api.nft.storage/upload",
        data: file,
        xhr: function () {
            let myXhr = $.ajaxSettings.xhr();
            if (myXhr.upload) {
                myXhr.upload.addEventListener('progress', app.uploadProgress, false);
            }
            return myXhr;
        },
        contentType: false,
        processData: false,
        headers: {
            "Authorization": "Bearer " + app.state.collection.userData.nftStorageApiToken, "Content-Type": file.type
        },
        success: async function (result) {

            sourceFile.ipfs = 'https://' + result.value.cid + ".ipfs.nftstorage.link"
            sourceFile.fileStatus.isUploaded = true;
            // console.log("success")
            // console.log(sourceFile);

            // console.log("[ uploadSourceFile ] success - writing metadata: ", asset.metadata);

            app.db.assets
                .where('index')
                .equals(asset.index)
                .modify({metadata: asset.metadata, state: "uploaded"})
                .then(function () {
                    // console.log("[ uploadSourcefile ] UPLOADED modified metadata:", asset.metadata);
                    if (callback !== null) callback();
                });


        },
        error: function (error) {
            console.log("error")
            console.log(error);
            if (callback !== null) callback();
        }
    });
}


app.downloadProgress = (e) => {
    // console.log(e);
    uploaderReportDetailsId.innerHTML = "<b>Checking (Downloading): </b>" + (app.currentlyCheckingFileName || "") + ` 100% | ${e.loaded} / ${e.total} `;
}

app.uploadProgress = (e) => {
    // console.log(e);

    if (e.lengthComputable) {
        if (e.loaded < 100) {
            let Percentage = parseInt((e.loaded * 100) / e.total);
            uploaderReportDetailsId.innerHTML = "<b>Uploading: </b>" + (app.currentlyUploadingFileName || "") + ` ${Percentage}% | ${e.loaded} / ${e.total} `;
        } else {
            uploaderReportDetailsId.innerHTML = "<b>Uploaded: </b>" + (app.currentlyUploadingFileName || "") + ` 100% | ${e.loaded} / ${e.total} `;
        }
    } else {
        uploaderReportDetailsId.innerHTML = app.currentlyUploadingFileName + `${e.loaded} / ?`;
    }
}


app.uploadMetadata = async function (asset, callback = null) {


    asset = await app.getAssetDataWithId(asset.id);
    app.updateAssetReferences(asset);

    let metadataSourceFile = await app.updateMetadataFile(asset);
    let json = app.generateJsonFromMetadata(asset.metadata);

    // used for the UI queue display
    app.currentlyUploadingFileName = "Metadata";

    // console.log("[ uploadMetadata ] asset.metadata", asset.metadata);

    $.ajax({
        type: "POST", url: "https://api.nft.storage/upload", data: json, xhr: function () {
            var myXhr = $.ajaxSettings.xhr();
            if (myXhr.upload) {
                myXhr.upload.addEventListener('progress', app.uploadProgress, false);
            }
            return myXhr;
        }, contentType: false, processData: false, headers: {
            "Authorization": "Bearer " + app.state.collection.userData.nftStorageApiToken,
            "Content-Type": "application/json"
        }, success: async function (result) {

            metadataSourceFile.ipfs = 'https://' + result.value.cid + ".ipfs.nftstorage.link"
            asset.metadata.metadataUrl = metadataSourceFile.ipfs;

            // console.log("[ uploadMetadata ] writing metadata: ", asset.metadata);
            // console.log("metadataJsonIpfs: " + metadataSourceFile.ipfs);
            app.db.assets
                .where('[collectionId+index]')
                .equals([app.state.collection.currentId, asset.index])
                .modify({metadata: asset.metadata})
                .then(function () {
                    // console.log("[ uploadMetadata ] UPLOADED", asset.metadata);
                    if (callback !== null) callback();
                });


        }, error: function (error) {
            console.log("error")
            console.log(error);
            if (callback !== null) callback();
        }
    });


}


app.getMetadataFileFromSourceFiles = function (asset) {

    for (const sourceFile of asset.metadata.buildData.sourceFiles) {
        if (sourceFile.isNftMetadata) {
            return sourceFile;
        }
    }

    let newItem = {
        index: "-", filePath: "metadata.json", isNftMetadata: true, fileStatus: {
            isRendered: true, // isRendered means there is a file at the location mentioned in the build file
            isValid: true, // isValid means there is a file, and it's hash has been saved, so it's ready for upload
            isUploaded: true // isUploaded means the file has been uploaded to IPFS (URL and Hash available)
        }
    };

    asset.metadata.buildData.sourceFiles.push(newItem);

    return asset.metadata.buildData.sourceFiles[asset.metadata.buildData.sourceFiles.length - 1];
}

// create/update the metadata json file for the NFT
app.updateMetadataFile = function (asset, callback = null) {

    return new Promise(async (resolve, reject) => {
        let metadataSourceFile = app.getMetadataFileFromSourceFiles(asset);

        let json = app.generateJsonFromMetadata(asset.metadata);

        let metadataUint8 = new TextEncoder().encode(json);
        metadataSourceFile.hash = await app.getHash(metadataUint8);

        asset.metadata.metadataHash = metadataSourceFile.hash;

        resolve(metadataSourceFile);
    });
}


app.addToMintBatch = (asset, mintParams = {}) => {

    return new Promise((resolve, reject) => {

        // console.log("[ addToMintBatch ] asset: ", asset);

        asset.batches = asset.batches || [];
        asset.batches.push(mintParams.batchId);

        app.db.open()
            .then(() => {

                app.db.assets
                    .where('id')
                    .equals(asset.id)
                    .modify({state: "minted", batches: asset.batches})
                    .then(function () {
                        resolve();
                    });

            });
    });

}
