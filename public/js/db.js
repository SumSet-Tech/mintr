// namespace
if (typeof app === `undefined`) app = {};
if (!app.libraryData) app.libraryData = {};
if (!app.libraryData.collections) app.libraryData.collections = [];
if (!app.state) app.state = {};
if (!app.queue) app.queue = {};
if (!app.state.defaultData) app.state.defaultData = {};
if (!app.queue.actions) app.queue.actions = [];


app.convertMp4ToGif = false;
app.convertMp4ToAnimatedWebP = true;

let collectionData = {
    name: "My Collection", description: "A description of My Collection", files: []
};

app.libraryData.collections.push(collectionData);

// init the db
app.dbNeedsInit = true;
app.initIndexedDb = function () {

    if (!app.dbNeedsInit && app.db) return;
    app.dbNeedsInit = false;

    app.db = new Dexie("NFTrMintrDB");
    app.db.version(31).stores({
        currentNft: '++id,userData',
        collections: '++id,name,description,fileScan,metadata,mediaImportOptions',
        assets: '++id,collectionId,name,index,[collectionId+index],state,filePath,[collectionId+filePath],file,metadata,[collectionId+state],[collectionId+rarityRankPadded],[collectionId+name],thumbIndex,rarityScore,rarityRank,searchTerms,rarityRankPadded,group,[collectionId+group],batches',
        batches: '++id,name,dateCreated,collectionId,assetIndexes,options',
        settings: '++id,appState'
    });

}


app.getAssetsForCurrentFilter = function () {

    return new Promise((resolve, reject) => {
        if (app.state.collection.assets) {
            resolve(app.state.collection.assets);
            return;
        }
        app.db.open().then(function () {
            return app.db.assets
                .where("collectionId")
                .equals((app.state.collection.currentId))
                .toArray()
                .then(function (allData) {
                    resolve(allData);
                });
        });
    });

}


app.deleteAllCollectionAssets = function (collectionId, callback) {

    app.db.open().then(function () {

        return app.db.assets
            .where('collectionId')
            .equals(collectionId)
            .delete();

    }).then(function (assets) {
        app.db.open().then(function () {

            return app.db.batches
                .where('collectionId')
                .equals(collectionId)
                .delete();

        }).then(function (assets) {
            if (callback !== null) callback();
        });
    }).catch(Dexie.MissingAPIError, function () {
        console.log("Couldn't find indexedDB API");
    });

}

app.getCollectionTotal = function (collectionId, callback) {
    // console.log("[ getCollectionTotal ]");
    // console.log(collectionId);
    app.db.open().then(function () {

        if (app.state.collection.filter && app.state.collection.filter !== "all") {
            return app.db.assets
                .where(['collectionId+state'])
                .equals([collectionId, app.state.collection.filter])
                .filter(function (asset) {
                    if (!asset.searchTerms) return false;
                    return asset.searchTerms.search(app.currentSearchTerm) > -1;
                })
                .count();
        } else {
            return app.db.assets
                .where('collectionId')
                .equals(collectionId)
                .filter(function (asset) {
                    if (!asset.searchTerms) return false;
                    return asset.searchTerms.search(app.currentSearchTerm) > -1;
                })
                .count();
        }

    }).then(function (total) {

        app.state.collection.itemsTotal = total;
        if (callback !== null) callback();

    }).catch(Dexie.MissingAPIError, function () {
        console.log("Couldn't find indexedDB API");
    });

}

app.getItemData = function (itemId, callback) {

    app.db.open().then(function () {

        return app.db.assets
            .where('id')
            .equals(itemId)
            .toArray();

    }).then(function (asset) {

        // console.log(asset[0]);
        if (callback !== null) callback(asset[0]);

    }).catch(Dexie.MissingAPIError, function () {
        console.log("Couldn't find indexedDB API");
    });
}


app.getAssetDataWithIndex = function (assetIndex) {

    // console.log("[ getAssetData ] ID: " + assetId);
    return new Promise((resolve, reject) => {

        // because new files may have been added to the buildData sourceFiles, we need to read the db again, to merge the data
        app.db.open().then(function () {

            return app.db.assets

                .where("[collectionId+index]")
                .equals([app.state.collection.currentId, parseInt(assetIndex)])
                .toArray()
                .then(function (allData) {
                    if (allData !== undefined && allData.length !== 0) {
                        // console.log("[ getAssetData ] ID: " + assetId + " was found");
                        resolve(allData[0]);
                    } else {
                        // console.log("[ getAssetData ] ID: " + assetId + " was not found");
                        resolve(null);
                    }
                });
        });
    });
}


app.getAssetDataWithId = function (assetId) {

    // console.log("[ getAssetData ] ID: " + assetId);
    return new Promise((resolve, reject) => {

        // because new files may have been added to the buildData sourceFiles, we need to read the db again, to merge the data
        app.db.open().then(function () {

            return app.db.assets
                .where("id")
                .equals(parseInt(assetId))
                .toArray()
                .then(function (allData) {
                    if (allData !== undefined && allData.length !== 0) {
                        // console.log("[ getAssetData ] ID: " + assetId + " was found");
                        resolve(allData[0]);
                    } else {
                        // console.log("[ getAssetData ] ID: " + assetId + " was not found");
                        resolve(null);
                    }
                });
        });
    });
}


app.saveCurrentEditorSearchTerms = function (userData) {

    if (!app.currentAssetId) return;

    return new Promise((resolve, reject) => {

        // because new files may have been added to the buildData sourceFiles, we need to read the db again, to merge the data

        let searchTerms = app.getSearchTermsFromJson(userData);
        app.db.assets
            .where('id')
            .equals(parseInt(app.currentAssetId))
            .modify({metadata: userData, searchTerms: searchTerms})
            .then(function () {
                resolve(null);
            });


    });
}


// called to set up auto-fill when starting process
app.getCollectionData = function (collectionId) {

    // console.log("[ getCollectionData ] ID: " + collectionId);
    return new Promise((resolve, reject) => {

        app.db.open().then(function () {

            return app.db.collections
                .where('id')
                .equals(parseInt(collectionId))
                .toArray()
                .then(async allData => {
                    if (allData[0].mediaImportOptions && allData[0].mediaImportOptions.length > 0) {
                        app.state.collection.mediaImportOptions = allData[0].mediaImportOptions
                        await app.saveState();
                    }
                    resolve(allData[0].userData);
                });

        }).catch(Dexie.MissingAPIError, function () {
            console.log("Couldn't find indexedDB API");
        });
    });

}


app.getFileExtension = (filePathOrFileName) => {
    let pathParts = filePathOrFileName.split(".");
    return pathParts[pathParts.length - 1];
}

app.getFilenameFromFilepath = (filePathOrFileName) => {
    let pathParts = filePathOrFileName.split("/");
    if (pathParts.length > 1) return pathParts[pathParts.length - 1]; else return filePathOrFileName;
}

app.getGroupFromFilename = (filename) => {
    let filenameParts = app.getFilenameFromFilepath(filename).split("_");

    if (filenameParts[0] !== app.getFilenameFromFilepath(filename)) return filenameParts[0];

    filenameParts = app.getFilenameFromFilepath(filename).split(".");
    return filenameParts[0];
}

app.getSubGroupFromFilename = (filename) => {


    switch (app.currentGroupingMode === "import" ? app.state.currentFileScanSubGroups : app.state.collection.autoFillGroupingOption) {
        case "fileType":
            return app.getFileType(filename).toUpperCase();

        case "singleFiles":
            return app.getFilenameFromPath(filename);

        default:
        case "subGroups":
            let filenameParts = app.getFilenameFromFilepath(filename).split("_");
            if (filenameParts.length < 2) {
                return "";
            }
            filenameParts.shift();
            return filenameParts.join("_");
    }

}

app.doDeleteCurrentCollection = function () {

    // console.log("[ doDeleteCurrentCollection ] id: " + app.state.collection.currentId);

    if (!app.state.collection.currentId) return;

    app.db.assets
        .where("collectionId")
        .equals(app.state.collection.currentId.toString())
        .delete()
        .then(async deleteCount => {
            // console.log("Deleted " + deleteCount + " objects - for collection ID: " + app.state.collection.currentId);

            // if (deleteCount>0) {
            //     console.log("Deleted collection ID: " + app.state.collection.currentId);
            // } else {
            //     console.log("Delete failed collection not found. ID: " + app.state.collection.currentId);
            // }

            await app.db.collections
                .where("id")
                .equals(parseInt(app.state.collection.currentId))
                .delete();

            await app.db.batches
                .where("id")
                .equals(app.state.collection.currentId)
                .delete();

            // go to collections page
            window.location.href = "../collections";

        });

}

app.doDeleteCurrentNft = function (callback = null) {

    // console.log("[ doDeleteCurrentNft ] to delete: ", app.currentAsset);

    if (!app.currentAsset) return;

    app.db.assets
        .where("id")
        .equals(app.currentAsset.id)
        .delete()
        .then(function (deleteCount) {
            // console.log("Deleted " + deleteCount + " objects - for collection ID: " + app.state.collection.currentId);
            app.currentAsset = null;
            // redraw
            app.loadCurrentCollection("doDeleteCurrentNft");
            app.drawPanel();
        });

}


app.doResetCurrentCollection = async function (callback = null) {

    if (!app.state.collection.currentId) return;

    // console.log("[ doResetCurrentCollection ] id: " + app.state.collection.currentId);
    app.state.collection.userData = JSON.parse(JSON.stringify(app.defaultData));
    app.copyDataToForm(app.state.collection.userData, "doResetCurrentCollection");
    await app.saveCurrentCollectionToDb(app.state.collection.userData);


    // app.resetDefaultOverrideCheckboxValues();
    app.overridesToDefaultSettingsForm();
    // app.copyDataToForm(app.state.defaultData);
    // app.saveFormState("doResetCurrentCollection");
    //

    if (callback !== null) callback();


}


app.getCurrentFilteredAmount = async function () {

}


app.loadCollectionAssets = async function (collectionId, callback) {

    let orderBy = "index";

    // console.log("[ loadCollectionAssets ] collectionId: " + collectionId);

    app.db.open().then(async function () {

        if (app.state.collection.offset !== undefined) {

            // orderBy = "rarityRank";
            // app.currentSearchTerm = "";

            let doSearch = app.currentSearchTerm && app.currentSearchTerm !== "";

            // console.log("[ loadCollectionAssets ] collection ID: " + collectionId + " sortBy: " + app.collectionSortBy + " doSearch? " + doSearch + " - searchTerm: " + app.currentSearchTerm);

            if (app.collectionSortBy === "title") {

                if (app.state.collection.filter && app.state.collection.filter !== "all") {
                    return app.db.assets
                        .where(['collectionId+name'])
                        .between([collectionId, ""], [collectionId, "\uffff"])
                        .filter(function (asset) {
                            if (!asset.searchTerms) return false;
                            return asset.searchTerms.search(app.currentSearchTerm) > -1;
                        }).offset(app.state.collection.offset)
                        .limit(app.state.collection.items).toArray();
                } else {
                    return app.db.assets
                        .where(['collectionId+name'])
                        .between([collectionId, ""], [collectionId, "\uffff"])
                        .filter(function (asset) {
                            if (!asset.searchTerms) return false;
                            return asset.searchTerms.search(app.currentSearchTerm) > -1;
                        })
                        .offset(app.state.collection.offset)
                        .limit(app.state.collection.items)
                        .toArray();
                }
            } else if (app.collectionSortBy === "rank") {

                if (app.state.collection.filter && app.state.collection.filter !== "all") {
                    return app.db.assets
                        .where(['collectionId+rarityRankPadded'])
                        .between([collectionId, ""], [collectionId, "\uffff"])
                        .filter(function (asset) {
                            if (!asset.searchTerms) return false;
                            return asset.searchTerms.search(app.currentSearchTerm) > -1;
                        }).offset(app.state.collection.offset)
                        .limit(app.state.collection.items).toArray();
                } else {
                    return app.db.assets
                        .where(['collectionId+rarityRankPadded'])
                        .between([collectionId, ""], [collectionId, "\uffff"])
                        .filter(function (asset) {
                            if (!asset.searchTerms) return false;
                            return asset.searchTerms.search(app.currentSearchTerm) > -1;
                        })
                        .offset(app.state.collection.offset)
                        .limit(app.state.collection.items)
                        .toArray();
                }


            } else if (app.collectionSortBy === "item") {


                if (app.state.collection.filter && app.state.collection.filter !== "all") {
                    return app.db.assets
                        .where(['collectionId+index'])
                        .between([collectionId, 0], [collectionId, 99999999999])
                        .filter(function (asset) {
                            if (!asset.searchTerms) return false;
                            return asset.searchTerms.search(app.currentSearchTerm) > -1;
                        }).offset(app.state.collection.offset)
                        .limit(app.state.collection.items).toArray();
                } else {
                    return app.db.assets
                        .where(['collectionId+index'])
                        .between([collectionId, 0], [collectionId, 99999999999])
                        .filter(function (asset) {
                            if (!asset.searchTerms) return false;
                            return asset.searchTerms.search(app.currentSearchTerm) > -1;
                        })
                        .offset(app.state.collection.offset)
                        .limit(app.state.collection.items)
                        .toArray();
                }


            } else if (doSearch) {

                // console.log("[ loadCollectionAssets ] B");

                if (app.state.collection.filter && app.state.collection.filter !== "all") {
                    return app.db.assets
                        .where(['collectionId+state'])
                        .equals([collectionId, app.state.collection.filter])
                        .filter(function (asset) {
                            if (!asset.searchTerms) return false;
                            return asset.searchTerms.search(app.currentSearchTerm) > -1;
                        }).offset(app.state.collection.offset)
                        .limit(app.state.collection.items).toArray();
                } else {
                    return app.db.assets
                        .where('collectionId')
                        .equals(collectionId)
                        .filter(function (asset) {
                            if (!asset.searchTerms) return false;
                            return asset.searchTerms.search(app.currentSearchTerm) > -1;
                        })
                        .offset(app.state.collection.offset)
                        .limit(app.state.collection.items)
                        .toArray();
                }

            } else if (app.state.collection.filter && app.state.collection.filter !== "all") {

                // console.log("[ loadCollectionAssets ] C");

                // console.log("app.state.collection.filter: " + app.state.collection.filter);
                return app.db.assets
                    .where(['collectionId+state'])
                    .equals([collectionId, app.state.collection.filter])
                    .offset(app.state.collection.offset)
                    .limit(app.state.collection.items)
                    .toArray();

            } else {

                // console.log("[ loadCollectionAssets ] D");

                return app.db.assets
                    .where('collectionId')
                    .equals(collectionId)
                    .offset(app.state.collection.offset)
                    .limit(app.state.collection.items)
                    .toArray();
            }

        } else {

            // console.log("[ loadCollectionAssets ] E");

            return app.db.assets
                .where('collectionId')
                .equals(collectionId)
                .toArray();
        }


    }).then(function (assets) {

        // console.log("[ loadCollectionAssets ] collection ID: " + collectionId + " LOADED ", assets);

        app.state.collection.assets = assets;

        app.drawCollectionPreviewTraitsTable();


        if (callback !== null) callback();

    }).catch(Dexie.MissingAPIError, function () {
        console.log("Couldn't find indexedDB API");
    });
}


app.loadDisplayState = function () {

    if (window.location.href.indexOf("#") > -1) {

        let urlParts = window.location.href.split("#");
        let queryString = urlParts[1];

        if (queryString) {
            app.state.collection.queryParsed = app.returnQueryParsed(queryString);

            if (app.state.collection.queryParsed.page) app.state.collection.page = app.state.collection.queryParsed.page;

            if (app.state.collection.queryParsed.items) app.state.collection.items = app.state.collection.queryParsed.items;
            if (app.state.collection.queryParsed.filter) app.state.collection.filter = app.state.collection.queryParsed.filter;
            if (app.state.collection.queryParsed.search) app.currentSearchTerm = app.state.collection.queryParsed.search;
        }
    }

    app.state.collection.page = app.state.collection.page ? app.state.collection.page : 1;
    app.state.collection.items = app.state.collection.items ? app.state.collection.items : app.defaultItemsToDisplay;
    app.state.collection.filter = app.state.collection.filter ? app.state.collection.filter : "all";
    app.state.collection.offset = (app.state.collection.page * app.state.collection.items) - app.state.collection.items;
    app.currentSearchTerm = app.currentSearchTerm ? app.currentSearchTerm : "";

    // console.log("[ loadDisplayState ]");
    // console.log(app.state.collection);
}


app.saveStateWithCallback = async function (callback = null, whoCalled = "") {

    // console.log("[ saveStateWithCallback ] whoCalled: "+whoCalled);
    await app.saveState();
    if (callback !== null) callback();
}


app.saveState = function () {
    try {
        return new Promise(async (resolve, reject) => {
            // resolve();
            // return;
            // console.log("[ saveState ] app.state: ", app.state);
            // console.log("[ saveState ] royaltyPercent?: ", app.state.defaultData.royaltyPercent);

            await app.db.settings.put({id: 1, appState: app.state})
                .catch(function (err) {
                    console.log(err.message)
                });

            resolve();


            /*app.db.open().then(function () {
                return app.db.settings.get(1).then(function (allData) {
                    if (allData !== undefined) {
                        return app.db.settings.update(1, {appState: app.state}).then(function () {
                            resolve();
                        });
                    } else {
                        return app.db.settings.put({appState: app.state}).then(function () {
                            resolve();
                        });
                    }
                });

            });*/
        });
    } catch (error) {
        console.log("[ saveState ] error: ", error);
    }
}


/*app.loadStateWithCallback = async function (callback = null, whoCalled = "") {

    console.log(`[ loadState ] cnt 1: ${app.queue.actions.length} - whoCalled: ${whoCalled}`);

    app.db.open().then(function () {

        return app.db.settings.get(1, {appState: app.appState}).then(function (allData) {

            if (allData !== undefined) {
                app.state = allData.appState;
                console.log("[ loadState ] DONE ", app.state);
                // console.log(`[ loadState ] cnt 2: ${app.queue.actions.length} - whoCalled: ${whoCalled}`);
                if (callback !== null) callback();
            }
        });

    }).catch(Dexie.MissingAPIError, function () {
        console.log("Couldn't find indexedDB API");
    });
}*/


app.loadState = function () {

    return new Promise((resolve, reject) => {
        // console.log(`[ loadState ]`);

        app.db.open().then(function () {

            return app.db.settings.get(1, {appState: app.appState}).then(function (allData) {

                if (allData !== undefined) {
                    app.state = allData.appState;
                    // console.log("[ loadState ] DONE ", app.state);
                    // console.log(`[ loadState ] cnt 2: ${app.queue.actions.length} - whoCalled: ${whoCalled}`);
                    resolve();
                }
            });

        }).catch(Dexie.MissingAPIError, function () {
            console.log("Couldn't find indexedDB API");
            resolve();
        });

    });

}


// when the page starts up (init), load the data from the last session
app.loaduserDataFromIndexedDbOrDefaults = function () {

    // console.log("[ loaduserDataFromIndexedDbOrDefaults ]");


    app.db.open().then(function () {
        let result = app.db.currentNft.get(1, {userData: app.userData}).then(function (allData) {
            if (allData) {
                // console.log("[ loaduserDataFromIndexedDbOrDefaults ] loaded userData ",allData.userData);
                app.userData = allData.userData;
                app.handleReloadEdgeCases();
                app.updateAppWithNewUserData();
            } else {
                // console.log("Nothing was found, using defaultData");
                app.userData = JSON.parse(JSON.stringify(app.state.defaultData));
                result = app.db.currentNft.add({userData: app.userData});
            }
        });

        return result;

    }).catch(Dexie.MissingAPIError, function () {
        console.log("Couldn't find indexedDB API");
    });
}

// writing changes for next time
app.writeuserDataToIndexedDB = function (userData) {

    app.initIndexedDb();

    app.db.open().then(function () {

        let result = app.db.currentNft.update(1, {userData: userData}).then(function (allData) {
            if (allData) {
                // console.log("Updated data");
            } else {
                // console.log("Nothing was found, writing new record (this shouldn't happen)");
                result = app.db.currentNft.add({userData: userData});
            }
        });

        return result;

    }).catch(Dexie.MissingAPIError, function () {
        console.log("Couldn't find indexedDB API");
    }).catch(function (e) {
        console.log(e);
    });
}

/*function handleFileSelect(evt) {

    console.log("handleFileSelect");
    var files = evt.target.files; // FileList object

    // Loop through the FileList and render image files as thumbnails.
    for (var i = 0, f; f = files[i]; i++) {
        console.log("handleFileSelect for");
        var reader = new FileReader();
        // Closure to capture the file information.
        reader.onload = (function (theFile) {
            return function (e) {
                console.log("reader.onload");
                var fileString = e.target.result;
                console.log("fileString size : " + fileString.length);
                localforage.setItem(theFile.name, fileString);

                var newNoeud = document.createElement('li');
                newNoeud.addEventListener('click', function () {
                    console.log("click openFile on " + theFile.name);
                    openFile(theFile.name);
                }, false);
                newNoeud.innerHTML = theFile.name;
                document.getElementById('ulTag').appendChild(newNoeud);
            };
        })(f);

        // Read in the image file as a data URL.
        reader.readAsDataURL(f);
    }
}*/


app.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB, IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.OIDBTransaction || window.msIDBTransaction, dbVersion = 1.0;

app.deleteBeforeCreating = true;


app.getDefaultMediaOrder = function (type) {
    // app.state.defaultMediaOrder
    // if(type==="application/json")
    // there is another version of this already, which needs work (text appears as plain)
}


app.getHydratedDataToStore = function (file, asset = null) {

    // console.log(`[ getHydratedDataToStore ] ${file.name} `, file);

    let newData = asset !== null ? asset : {};

    newData.filePath = file.name;
    newData.collectionId = asset ? asset.collectionId : app.state.collection.currentId;
    newData.index = asset ? asset.index : app.addFilesToDBCatalogCurrentIndex;

    if (file.type === "application/json") {


        newData.importedBuildData = true;
        newData.used = true;
        newData.group = app.getGroupFromFilename(file.name);
        // console.log("[ getHydratedDataToStore ] adding queue: loadJsonBuildData ", file, asset);
        // const action = app.getActionForGroupingTypeFromFile(file);
        // if (action !== "ignore")
        app.addToQueue({
            priority: 6, state: "todo", action: "loadJsonBuildData", index: newData.index, file: file, asset: asset
        });

        // app.doNextInQueue(); // now called after adding all to queue to track the completion of json build data parsing
    }

    return newData;
}

app.getFilenameFromPath = (fullPath) => {
    if (!fullPath) return fullPath;
    // return fullPath.replace(/^.*[\\\/]/, '')
    // console.log("fullPath: ", fullPath);
    let parts = fullPath.split("/");
    return parts[parts.length - 1];
}


app.makeSourceFileForBuildData = (file, asset) => {

    try {
        return new Promise(async (resolve, reject) => {

            const action = app.getActionForGroupingTypeFromFile(file, "makeSourceFileForBuildData");
            if (action === "ignore") {
                resolve();
                return;
            }

            let foundIndex = -1;
            let newOnly = newOnlyModeId && newOnlyModeId.checked;

            if (asset.metadata && asset.metadata.buildData) {
                for (const index in asset.metadata.buildData.sourceFiles) {
                    if (app.getFilenameFromPath(asset.metadata.buildData.sourceFiles[index].filePath) === app.getFilenameFromPath(file.name)) {
                        // console.log("[ makeSourceFileForBuildData ] asset.metadata.buildData.sourceFiles[index]: ", asset.metadata.buildData.sourceFiles[index]);
                        foundIndex = index;

                        if (newOnly) {
                            // let subGroup = app.getSubGroupFromFilename(file.name)
                            // let action = app.getSubGroupAction(subGroup);

                            // const action = app.getActionForGroupingTypeFromFile(file);
                            if ((action === "convert" || action === "import") && !asset.metadata.buildData.sourceFiles[index].thumb) {

                                // console.log("[ makeSourceFileForBuildData ] CONTINUE - CONVERT/IMPORT MODE: FOUND MATCH, NEW ONLY MODE, NO THUMB: ", asset.metadata.buildData.sourceFiles[index]);
                                app.addToQueue({
                                    priority: 3,
                                    action: "doProcessActionForFile",
                                    fileFound: file,
                                    dbIndexToUpdate: asset.index,
                                    metadata: asset.metadata,
                                    sourceFileIndex: index
                                });
                                app.doNextInQueue();
                                resolve();
                                return;
                            } else {

                                // console.log("[ makeSourceFileForBuildData ] ABORT - FOUND MATCH, NEW ONLY MODE: ", asset.metadata.buildData.sourceFiles[index]);
                                resolve();
                                return;
                            }

                        }
                    }
                }
            }

            // expensive call
            let fileData = await app.getFileInfoForMetadata(file);

            let data = {
                index: 0,
                name: file.name,
                filePath: file.name,
                lastModified: file.lastModified,
                size: file.size,
                type: file.type,
                hash: fileData.hash,
                fileStatus: {
                    isRendered: true, isUploaded: false, isValid: true
                }
            }

            if (fileData.duration) data.duration = fileData.duration;

            if (fileData.width) {
                data.width = fileData.width;
                data.height = fileData.height;
            }


            if (asset.metadata) {
                if (foundIndex === -1 && asset.metadata.buildData) asset.metadata.buildData.sourceFiles.push(data);


                // console.log("[ makeSourceFileForBuildData ] writing metadata: ", asset.metadata);

                await app.db.assets
                    .where('id')
                    .equals(asset.id)
                    .modify({metadata: asset.metadata})
                    .catch(error => console.log(error));


                if (asset.metadata.buildData) {
                    app.addToQueue({
                        priority: 3,
                        action: "doProcessActionForFile",
                        fileFound: file,
                        dbIndexToUpdate: asset.index,
                        metadata: asset.metadata,
                        sourceFileIndex: asset.metadata.buildData.sourceFiles.length - 1
                    });
                    app.doNextInQueue();
                }

            }
            resolve();


        });
    } catch (error) {
        // console.log("[ makeSourceFileForBuildData ] error: ", error);
    }

}

app.assignToGroup = async (file, callback = null) => {


    let group = app.getGroupFromFilename(file.name);
    let foundMatch = false;

    if (app.loadModalState === "nft") {

        let allData = [app.currentAsset];
        foundMatch = true;
        app.setFileUsed(file);
        await app.makeSourceFileForBuildData(file, allData[0]);

    } else if (app.state.transcoding.groupFilesByFileName) {

        let allData = await app.db.assets
            .where(['collectionId+group'])
            .equals([app.state.collection.currentId, group])
            .toArray();

        if (allData !== undefined && allData.length !== 0) {
            foundMatch = true;
            app.setFileUsed(file);
            await app.makeSourceFileForBuildData(file, allData[0]);
        }
    }

    if (!foundMatch) {
        // confirm that type is importable?
        // create new nft
        const newId = await app.addBlankNft();

        // get asset from db
        let assets = await app.db.assets.where('id').equals(newId).toArray();

        assets[0].group = group;

        await app.db.assets.put(assets[0]);

        app.setFileUsed(file);

        // assign to be written
        // console.log("[ assignToGroup ] NO MATCH: " + file.name + " created asset: ", assets[0]);
        await app.makeSourceFileForBuildData(file, assets[0]);
    }

    app.assignToGroupCount++;

    if (callback !== null) callback();


}

app.addGenericFile = async (options, callback = null) => {

    if (!options.asset) {
        if (callback !== null) callback();
        return;
    }

    // options.file.used = true;
    app.setFileUsed(options.file);

    console.log("[ addGenericFile ] Add generic to " + options.file.name + " in asset: ", options.asset);
    await app.makeSourceFileForBuildData(options.file, options.asset);


    /*   let hydrated = app.getHydratedDataToStore(options.file, options.asset);
       console.log("[ addGenericFile ] NEW writing metadata: ", hydrated);


       app.addToQueue({
           priority: 3,
           action: "doProcessActionForFile",
           fileFound: options.file,
           dbIndexToUpdate: options.asset.index,
           metadata: options.asset.metadata,
           asset: options.asset

       });

       app.doNextInQueue();*/

    if (callback !== null) callback();


}


app.getSearchTermsFromJson = (json) => {
    // console.log("[ getSearchTermsFromJson ]");
    let terms = "";
    if (json.attributes) {
        for (let i = 0; i < json.attributes.length; i++) {
            if (typeof json.attributes[i].value !== 'string' || !json.attributes[i].value instanceof String) continue;
            let myVal = json.attributes[i].value.toLowerCase();
            if (app.wordsThatMeanNone.indexOf(myVal) > -1) continue;
            terms += app.getFilterString("attribute" + json.attributes[i].trait_type) + ",";
            terms += app.getFilterString(json.attributes[i].trait_type) + app.searchTermDelimiter + app.getFilterString(json.attributes[i].value) + ",";
        }
    }
    if (json.nftName) terms += app.getFilterString(json.nftName) + ","; else if (json.name) terms += app.getFilterString(json.name) + ",";
    // console.log(terms);
    return terms;
}


//
// loadJsonBuildData is called by the queue
//
app.loadJsonBuildData = (file, dbIndexToUpdate, asset, callback = null) => {

    let fileReader = new FileReader();
    fileReader.addEventListener("load", async function (event) {

        let fileSource = event.target.result;
        // console.log("[ loadJsonBuildData ] file: " + file.name + " - fileSource: ", fileSource);

        let fileSourceJson = "";
        try {
            fileSourceJson = JSON.parse(fileSource);
        } catch (e) {
            if (callback !== null) callback();
            return;
        }

        let newMetadata = fileSourceJson;

        //  it's a JSON build file?
        if (newMetadata.nftrCatalogItemSchema || newMetadata.buildData || (newMetadata.attributes && newMetadata.image && newMetadata.name)) {

            if ((overwriteModeId && !overwriteModeId.checked && asset !== null && asset.metadata)) {

                //overwrite JSON file with metadata saved in IndexedDB
                newMetadata = asset.metadata;

                // console.log("[ loadJsonBuildData ] asset.metadata: ", asset.metadata);

                // Copy data found when no data is already present (don't overwrite all)
                app.copyMetadataToMetadata(fileSourceJson, newMetadata, false);
            }

            // todo: add all possible options for generic json data
            newMetadata.nftName = asset && asset.name ? asset.name : newMetadata.name || newMetadata.nftName || "";
            newMetadata.nftDescription = asset && asset.description ? asset.description : newMetadata.description || "";

            // console.log("[ loadJsonBuildData ] name: ", newMetadata.nftName);
            // console.log("[ loadJsonBuildData ] newMetadata: ", newMetadata);

            let searchTerms = app.getSearchTermsFromJson(newMetadata);

            app.addBuildDataObjectIfNeeded(newMetadata);

            app.db.assets
                .where('[collectionId+index]')
                .equals([app.state.collection.currentId, dbIndexToUpdate])
                .modify({
                    metadata: newMetadata, searchTerms: searchTerms, state: "todo", name: newMetadata.nftName
                })
                .then(function () {
                    app.lookForMatchingAssets(newMetadata, dbIndexToUpdate, callback);
                });

        } else {
            // console.log("[ loadJsonBuildData ] Aborted, not the correct schema, or build data doesn't exist");
            if (callback !== null) callback();
        }

    });

    //Read the image
    fileReader.readAsText(file);

}


//
// called after a JSON file with build data is found
//
app.lookForMatchingAssets = async function (metadata, dbIndexToUpdate, callback = null) {

    // let buildData = metadata.buildData;
    // console.log("[ lookForMatchingAssets ] dbIndexToUpdate: " + dbIndexToUpdate + " overwriteModeId.checked: " + overwriteModeId.checked, metadata);

    app.currentDbIndexToUpdate = dbIndexToUpdate;
    let callbackNeeded = true;

    if (metadata.buildData) {
        for (let sourceFileIndex = 0; sourceFileIndex < metadata.buildData.sourceFiles.length; sourceFileIndex++) {

            if ((overwriteModeId && !overwriteModeId.checked) && metadata.buildData.sourceFiles[sourceFileIndex].fileStatus.isValid === true) {
                // console.log("[ lookForMatchingAssets ] ABORTING - source file already valid and not overwriting existing callbackNeeded: ", callbackNeeded);
                callbackNeeded = true;
                continue;
            }

            // console.log("[ lookForMatchingAssets ] dbIndexToUpdate: " + dbIndexToUpdate + " - sourceFileIndex: "
            //     + sourceFileIndex + " - overwriteModeId.checked: " + overwriteModeId.checked, metadata.buildData.sourceFiles[sourceFileIndex]);


            let filenamePart = app.getFilenameFromPath(metadata.buildData.sourceFiles[sourceFileIndex].filePath);
            let fileFound = app.findAssetFileNameInFileScan(filenamePart);


            if (fileFound) {

                fileFound.used = true;
                fileFound.matchedBuildFileDescription = true;
                let fileFormat = app.getFileMediaFormat(fileFound);


                metadata.buildData.sourceFiles[sourceFileIndex].fileStatus.isValid = true;
                metadata.buildData.sourceFiles[sourceFileIndex].type = fileFound.type;
                metadata.buildData.sourceFiles[sourceFileIndex].fileFormat = fileFormat;

                let fileData = await app.getFileInfoForMetadata(fileFound);
                metadata.buildData.sourceFiles[sourceFileIndex].height = fileData.height;
                metadata.buildData.sourceFiles[sourceFileIndex].width = fileData.width;
                metadata.buildData.sourceFiles[sourceFileIndex].hash = fileData.hash;

                callbackNeeded = false;

                app.processFoundAsset(dbIndexToUpdate, metadata, fileFound, sourceFileIndex, callback);


                /*let data = {};

                // THE GATHERING OF FILE DATA NEEDS TO HAPPEN IN A DIFFERENT MOMENT, AND THIS SHOULD JUST BE PROCESSING FILES FOUND DURING A JSON BUILD DATA FILE SETUP
                let fileReader = new FileReader();
                fileReader.onload = async function (theFile) {

                    metadata.buildData.sourceFiles[sourceFileIndex].hash = await app.getHash(theFile.target.result);
                    metadata.buildData.sourceFiles[sourceFileIndex].byteLength = theFile.target.result.byteLength;

                    if (fileFormat === "image" || fileFormat === "video") {
                        console.log('[ getFileInfoForMetadata ] Reading media dimensions');

                        fileReader.onload = async (theMediaFile) => {
                            const image = new Image();
                            image.src = theMediaFile.target.result;
                            image.onload = () => {
                                console.log('[ getFileInfoForMetadata ] READ MEDIA SIZE - width:' + image.width + ' - height: ' + image.height);
                                metadata.buildData.sourceFiles[sourceFileIndex].width = image.width;
                                metadata.buildData.sourceFiles[sourceFileIndex].height = image.height;
                                if (callback !== null) callback();
                            }

                        }
                        fileReader.readAsDataURL(fileFound);
                    } else {
                        if (callback !== null) callback();
                    }

                };
                fileReader.readAsArrayBuffer(fileFound);*/
            }
        }
    }
    if (callbackNeeded && callback !== null) callback();

}


app.processFoundAsset = (dbIndexToUpdate, metadata, fileFound, sourceFileIndex, callback) => {

    // console.log("[ processFoundAsset ] writing metadata: ", metadata);

    app.db.assets
        .where('[collectionId+index]')
        .equals([app.state.collection.currentId, dbIndexToUpdate])
        .modify({metadata: metadata})
        .then(function () {
            // console.log("[ processFoundAsset ] updated metadata: ", metadata);
            let sourceFileType = app.getFileMediaFormat(fileFound);

            app.addToQueue({
                priority: 3,
                action: "doProcessActionForFile",
                fileFound: fileFound,
                dbIndexToUpdate: dbIndexToUpdate,
                metadata: metadata,
                sourceFileIndex: sourceFileIndex
            });

            app.doNextInQueue();

            // the last item?
            if (sourceFileIndex === metadata.buildData.sourceFiles.length - 1 && callback !== null) callback();

        });

}


// app.generateHashFromFile = async function (fileFound, dbIndexToUpdate, index) {
//     app.userData.assetHash = await app.getHash(app.sourceImageArrayBufferForHash);
// }


app.readFileAsDataURL = function (file) {
    return new Promise((resolve, reject) => {
        let fileredr = new FileReader();
        fileredr.onload = () => resolve(fileredr.result);
        fileredr.onerror = () => reject(fileredr);
        fileredr.readAsDataURL(file);
    });
}

app.loadVideo = (vid, url) => new Promise((resolve, reject) => {
    vid.addEventListener('canplay', () => resolve(vid));
    vid.addEventListener('error', (err) => reject(err));
    vid.src = url;
});


app.encode64 = function (input) {
    var output = '', i = 0, l = input.length, key = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
        chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    while (i < l) {
        chr1 = input.charCodeAt(i++);
        chr2 = input.charCodeAt(i++);
        chr3 = input.charCodeAt(i++);
        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;
        if (isNaN(chr2)) enc3 = enc4 = 64; else if (isNaN(chr3)) enc4 = 64;
        output = output + key.charAt(enc1) + key.charAt(enc2) + key.charAt(enc3) + key.charAt(enc4);
    }
    return output;
}


var startPoint = document.getElementById('startPoint');
var loadingBar = document.getElementById('loadingBar');
app.scaleCanvas = function (_CANVAS, videoObj, vidHeight, vidWidth, scale = 1) {
    _CANVAS['style']['height'] = `${vidHeight}px`;
    _CANVAS['style']['width'] = `${vidWidth}px`;

    let cWidth = vidWidth * scale;
    let cHeight = vidHeight * scale;

    _CANVAS.width = cWidth;
    _CANVAS.height = cHeight;

    _CANVAS.getContext('2d', {willReadFrequently: true}).scale(scale, scale);
}

const byteToKBScale = 0.0009765625;

let continueCallback = true;
let FPS = 0;
// let scale = 1;


app.findAssetFileNameInFileScan = function (fileName) {
    for (let i = 0; i < app.currentFilesScan.length; i++) {
        if (app.currentFilesScan[i].type === "application/json") continue;
        if (fileName === app.getFilenameFromPath(app.currentFilesScan[i].name)) {
            // console.log("MATCH FOUND!");
            // console.log(app.currentFilesScan[i].name);
            return app.currentFilesScan[i];
        }
    }
    return null;
}

// Only called when loading files from disk
// Takes any file from the disk and decides what to do with it.
app.addOrUpdateAssetWithFile = async function (fileScanIndex, callback = null) {

    let file = app.addFilesToDBCatalogFiles[fileScanIndex];

    // console.log("[ addOrUpdateAssetWithFile ]", file);

    let allData = [];
    if (app.loadModalState === "nft") allData.push(app.currentAsset); else allData = await app.db.assets
        .where('[collectionId+filePath]')
        .equals([app.state.collection.currentId, file.name])
        .toArray();


    if (app.loadModalState === "nft" || (allData !== undefined && allData.length !== 0)) {

        // found a record with this same file path
        let hydrated = app.getHydratedDataToStore(file, allData[0]);

        // found a record in the db with the same name
        await app.db.assets.update(allData[0].id, hydrated);

    } else {

        // new file path
        let hydrated = app.getHydratedDataToStore(file);
        // console.log("[ addOrUpdateAssetWithFile ] NEW writing metadata: ", hydrated);

        // new item for catalog
        await app.db.assets.add(hydrated);
    }

    if (callback !== null) callback();

}


app.loadCurrentCollectionFromDb = () => {

    return new Promise((resolve, reject) => {

        // console.log("[ loadCurrentCollectionFromDb ] DISABLED currentId: " + app.state.collection.currentId);
        // resolve();
        // return;

        app.db.open().then(function () {

            return app.db.collections
                .where('id')
                .equals(parseInt(app.state.collection.currentId))
                .toArray()
                .then(async function (allData) {
                    if (allData !== undefined && allData.length !== 0) {

                        // console.log("[ loadCurrentCollectionFromDb ] FROM DB: " + app.state.collection.currentId + ": ", allData[0].userData);
                        if (allData[0].mediaImportOptions && allData[0].mediaImportOptions.length > 0) app.state.collection.mediaImportOptions = allData[0].mediaImportOptions;

                        app.state.collection.userData = allData[0].userData;
                        await app.saveState();
                    }
                    resolve();
                });
        });
    });
}

app.saveUserDataToCollection = (userData = app.userData) => {
    // console.log("[ saveUserDataToCollection ] START");
    app.saveCurrentCollectionToDb(userData);
}

app.saveCurrentCollectionToDb = (userData) => {

    return new Promise(async (resolve, reject) => {

        if (!app.state.collection || !app.state.collection.currentId) {
            resolve();
            return;
        }

        let dataToSave = {userData: userData};
        if (app.state.collection.mediaImportOptions && app.state.collection.mediaImportOptions.length > 0) dataToSave.mediaImportOptions = app.state.collection.mediaImportOptions;
        // console.log("[ saveCurrentCollectionToDb ] currentId: " + app.state.collection.currentId + " - dataToSave: ", dataToSave);
        await app.db.collections.update(parseInt(app.state.collection.currentId), dataToSave);

        resolve();

    });
}


// called by startAutoFillAll
app.saveCurrentCollectionMediaImportOptions = () => {

    return new Promise((resolve, reject) => {

        app.db.collections
            .where('id')
            .equals(parseInt(app.state.collection.currentId))
            .modify({
                mediaImportOptions: app.state.collection.mediaImportOptions
            })
            .then(function () {
                resolve();
            });
    });
}


app.loadCurrentCollectionMediaImportOptions = () => {

    // console.log("[ loadCurrentCollectionMediaImportOptions ] ");
    return new Promise((resolve, reject) => {
        app.db.collections
            .where('id')
            .equals(parseInt(app.state.collection.currentId))
            .toArray()
            .then(async function (allData) {
                if (allData !== undefined && allData.length !== 0) {

                    app.state.collection.mediaImportOptions = allData[0].mediaImportOptions;
                    await app.saveState();
                }
                resolve();
            });
    });
}


// Callback will be called with array of images, or undefined
// if not previously saved.
/*app.load = function (callback = null) {
    app.openDB(function (db) {
        var tx = db.transaction('images', 'readonly');
        var req = tx.objectStore('images').get('key');
        req.onsuccess = function () {
            console.log("app.load:");
            console.log(req.result);
            if (callback !== null) callback(req.result);
        };
    });
}*/

/*app.openDB = function (callback = null) {

    if (app.deleteBeforeCreating === true) Dexie.delete('my_db');

    var open = indexedDB.open('my_db');
    open.onupgradeneeded = function () {
        var db = open.result;
        db.createObjectStore('images');
    };
    open.onsuccess = function () {
        var db = open.result;
        if (callback !== null) callback(db);
    };
    open.onerror = function () {
        console.log(open.error);
    };
}*/

