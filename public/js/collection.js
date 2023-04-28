// namespace
if (typeof app === `undefined`) app = {};
if (typeof app.state === `undefined`) app.state = {};
if (typeof app.state.collection === `undefined`) app.state.collection = {};
if (typeof app.state.transcoding === `undefined`) app.state.transcoding = {};

app.maxItemsToRead = 0;
app.maxItemsToDisplay = 20;
app.paginationMaxPagesToDisplay = 5;
app.defaultItemsToDisplay = 20;


app.defaultImageProcessingOptions = {
    resizeImages: true, ignoreImages: false, imagesDoImport: true, convertImages: false, fileType: "webp", quality: 100, // 1-100 (int)
    resizeDimension: "width", resizeImagesAmount: 1000, groupMode: "fileType"
};


app.initCollectionView = async () => {

    let oldXPos = 0;
    let isDragging = false;

    app.$panelContainerId = app.$panelContainerId || $('#panelContainerId');
    app.$collectionEditorPanelId = app.$collectionEditorPanelId || $('#collectionEditorPanelId');
    app.$batchProcessorId = app.$batchProcessorId || $('#batchProcessorId');

    app.$resizeDividerId = $('#resizeDividerId');
    app.$resizeDividerId.mousedown(function () {
        isDragging = true;
    })
    $(document).mouseup(() => {
        isDragging = false;
    })

    $(document).mousemove(event => {
        if (isDragging) {
            const difference = event.pageX - oldXPos;
            const newWidth = app.$panelContainerId.width() - difference;

            // this is the new parent to the panels above
            app.$panelContainerId.width(newWidth);
        }
        oldXPos = event.pageX;
    });

    app.$gridItemsId = $("#gridItemsId");
    app.$gridPaginationContainerId = $("#gridPaginationContainerId");
    app.$itemsPerPageContainerId = $("#itemsPerPageContainerId");
    app.$itemCountId = $("#itemCountId");
    app.$filtersId = $("#filtersId");
    app.$mainActionButtonId = $("#actionButtonId");
    app.$collectionEditorPanelId = $("#collectionEditorPanelId");
    app.$collectionEditorEditButtonId = $("#collectionEditorEditButtonId");
    app.$collectionEditorContainerId = $("#collectionEditorContainerId");
    app.$nftEditorContainerId = $("#nftEditorContainerId");
    app.$nftEditorPanelId = $("#nftEditorPanelId");
    app.$processingModalId = $("#processingModalId");
    app.$fileScanResultTableId = $("#fileScanResultTableId");
    app.$scanDirectoryListId = $("#scanDirectoryListId");
    app.$resizeVideoControls = $("#resizeVideoControls");
    app.$resizeControls = $("#resizeControls");
    // app.$convertImagesId = $("#convertImagesId");
    app.$useImagesForThumbnailId = $("#useImagesForThumbnailId");
    app.$ignoreImagesId = $("#ignoreImagesId");
    app.$importOriginalsId = $("#importOriginalsId");
    app.$fileTypeId = $("#fileTypeId");
    app.$restrictDimensionId = $("#restrictDimensionId");
    app.$resizeCheckId = $("#resizeCheckId");
    app.$convertImagesPixelsId = $("#convertImagesPixelsId");
    app.$convertImagesQualityId = $("#convertImagesQualityId");
    app.$catalogingScanButtonId = $("#catalogingScanButtonId");
    app.$filesRowId = $("#filesRowId");
    app.$toggleAssetDetailsId = $("#toggleAssetDetailsId");

    app.$videosIgnoreId = $("#videosIgnoreId");
    app.$importOriginalVideosId = $("#importOriginalVideosId");
    // app.$convertVideosId = $("#convertVideosId");
    app.$useVideosForThumbnailId = $("#useVideosForThumbnailId");
    app.$groupFilesOptionId = $("#groupFilesOptionId");
    app.$videoResizeCheckId = $("#videoResizeCheckId");
    app.$videoConvertImagesQualityId = $("#videoConvertImagesQualityId");
    app.$videoFpsId = $("#videoFpsId");
    app.$videoAmountInPixelsId = $("#videoAmountInPixelsId");
    app.$searchFieldInputId = $("#searchFieldInputId");
    app.$doRefreshRarityId = $("#doRefreshRarityId");

    app.$searchFieldInputId.bind("enterKey", e => {
        // console.log("SEARCH!!! " + app.$searchFieldInputId.val());
        app.doFilter(app.$searchFieldInputId.val());
    });

    app.$searchFieldInputId.keyup(function (e) {
        if (e.keyCode === 13) $(this).trigger("enterKey");
    });
    app.$toggleAssetDetailsId.click(() => {
        if (app.$filesRowId.hasClass("hidden")) {
            app.$filesRowId.removeClass("hidden");
        } else {
            app.$filesRowId.addClass("hidden");
        }
    });
    app.$catalogingScanButtonId.click(() => {
        app.$processingModalId.addClass("mintr-collapse");
        app.doCatalogingImport();
    });
    app.$doRefreshRarityId.click(() => {
        app.doUpdateCollectionReport(app.state.collection.currentId);
    });
    app.$useImagesForThumbnailId.change(() => {
        app.updateCatalogingUploadOption();
    });
    app.$ignoreImagesId.change(() => {
        app.updateCatalogingUploadOption();
    });
    app.$importOriginalsId.change(() => {
        app.updateCatalogingUploadOption();
    });
    app.$videosIgnoreId.change(() => {
        app.updateCatalogingUploadOption();
    });
    app.$importOriginalVideosId.change(() => {
        app.updateCatalogingUploadOption();
    });
    app.$useVideosForThumbnailId.change(() => {
        app.updateCatalogingUploadOption();
    });
    $("#catalogingOptionsCloseButtonId").click(() => {
        app.catalogingDoCancel();
    });
    $("#catalogingCancelButtonId").click(() => {
        app.catalogingDoCancel();
    });
    app.$collectionEditorEditButtonId.click(() => {
        app.doToggleEditorPanel();
    });
    $("#collectionEditorAddNftButtonId").click(async () => {
        await app.addBlankNft();
        // redraw
        app.loadCurrentCollection("addBlankNft");
    });
    $(".collectionEditorPanelCloseButton").click(() => {
        app.doToggleEditorPanel(false, null, true);
    });
    $("#batchProcessorStartButtonId").click(() => {
        app.doStartButtonMainAction();
    });
    $("#nftAutoFillButtonId").click(() => {
        app.doAutoFillOfSelectedNft();
    });
    $("#nftUploadButtonId").click(() => {
        app.doUploadOfSelectedNft();
    });
    $("#deleteCollectionId").click(() => {
        app.doDeleteCurrentCollection();
    });
    $("#deleteNftId").click(() => {
        app.doDeleteCurrentNft();
    });
    $("#resetCollectionId").click(async () => {
        await app.resetCollectionToDefault();
    });
    loadModal.addEventListener('show.bs.modal', event => {
        app.doStartLoadAction();
    })
    batchProcessorId.addEventListener('show.bs.modal', event => {
        app.doStartMainAction(app.state.collection.batchMode);
    })

    app.updateSpaceAvailable();
    app.initImageQueue();
    app.initIndexedDb();
    app.setupToolTips();
    app.updateSelectMode();
    await app.loadState();
    app.loadCurrentCollection("init");
    app.clearQueue();

    $("#saveChangesLoadModalButtonId").click(() => {
        app.doScanCollectionFolder();

    });

    $("#collectionEditorScanAndImportButtonId").click(function () {
        if (!app.loadModal) app.loadModal = new bootstrap.Modal('#loadModal');
        $("#filepicker").attr("webkitdirectory", true);
        app.prepareFilePickerListeners();
        app.loadModalState = "collection";
        app.loadModal.show();
    });

    $("#nftEditorAddFilesButtonId").click(() => {
        if (!app.loadModal) app.loadModal = new bootstrap.Modal('#loadModal');
        $("#filepicker").attr("webkitdirectory", null);
        app.prepareFilePickerListeners();
        app.loadModalState = "nft";
        app.loadModal.show();
    });

    $("#collectionEditorNewNftButtonId").click(async () => {
        await app.addBlankNft();
        // redraw
        app.loadCurrentCollection("addBlankNft");
    });

    $("#collectionEditorAutoFillButtonId").click(() => {
        if (!app.batchModal) app.batchModal = new bootstrap.Modal('#batchProcessorId');
        app.state.collection.batchMode = "todo"; //auto–fill now Update Metadata
        app.drawBatchModalUi();
        app.batchModalState = "autoFillToDo";
        app.batchModal.show();
    });

    $("#collectionEditorUploadButtonId").click(() => {
        if (!app.batchModal) app.batchModal = new bootstrap.Modal('#batchProcessorId');
        app.state.collection.batchMode = "ready"; //upload
        app.drawBatchModalUi();
        app.batchModalState = "uploadReady";
        app.batchModal.show();

    });

    $("#uploadBatchButtonId").click(async () => {
        if (!app.batchModal) app.batchModal = new bootstrap.Modal('#batchProcessorId');
        app.batchModal.hide();
        await app.delay(500);
        app.state.collection.batchMode = "ready"; //upload
        app.drawBatchModalUi();
        app.batchModalState = "uploadBatch";
        app.batchModal.show();
    });

    $(".nav-link").bind("shown.bs.tab", async event => {
            //console.log("tab event: ", event.currentTarget.id);

            if (event.currentTarget.id === "nft-editor-tab") {
                app.tabSelectedByUser = "nft";
                await app.doToggleEditorPanel(true, "nft", false);
            }
            if (event.currentTarget.id === "collection-editor-tab") {
                app.tabSelectedByUser = "collection";
                await app.doToggleEditorPanel(true, "collection", false);
            }

            await app.waitSeconds(100);
            app.drawPanel();
        }
    );

    $("#collectionEditorMintButtonId").click(() => {
        app.doAddToBatchButtonAction();
    });
    $("#addSelectionToBatchButtonId").click(() => {
        app.doAddToBatchButtonAction();
    });
    app.doAddToBatchButtonAction = () => {
        if (!app.batchModal) app.batchModal = new bootstrap.Modal('#batchProcessorId');
        app.state.collection.batchMode = "uploaded"; //mint
        app.drawBatchModalUi();
        app.batchModalState = "mintUploaded";
        app.batchModal.show();
    }

    app.$mainActionButtonId.click(() => {
        if (!app.batchModal) app.batchModal = new bootstrap.Modal('#batchProcessorId');
        app.state.collection.batchMode = app.state.collection.filter;
        app.drawBatchModalUi();
        app.batchModalState = "mintUploaded";
        app.batchModal.show();
    });

    app.prepareFilePickerListeners();
    app.doToggleEditorPanel(true, "collection");

    // manual control of tabs, to monitor events (which tab is clicked)
    app.editorTabs = {};
    const triggerTabList = document.querySelectorAll('#editor-tab button')
    triggerTabList.forEach(triggerEl => {
        const tabTrigger = new bootstrap.Tab(triggerEl)
        app.editorTabs[triggerEl.id] = {tabTrigger: tabTrigger};
        triggerEl.addEventListener('click', event => {
            event.preventDefault();
            tabTrigger.show();

        })
    })

    // manual control of tabs, to monitor events (which tab is clicked)
    app.collectionEditorTabs = {};
    const triggerNavTabList = document.querySelectorAll('#nav-tab button')
    triggerNavTabList.forEach(triggerEl => {
        const tabTrigger = new bootstrap.Tab(triggerEl)
        app.collectionEditorTabs[triggerEl.id] = {tabTrigger: tabTrigger};
        triggerEl.addEventListener('click', event => {
            event.preventDefault()
            tabTrigger.show()
            if (triggerEl.innerText === "Preview") {
                app.doUpdateCollectionReport(app.state.collection.currentId);
            }
        })
    })


}

app.delay = (time) => {
    return new Promise(resolve => setTimeout(resolve, time));
}

app.handleFilePicker = event => {
    app.loadModal.hide();
    app.currentFilesScan = event.target.files;
    app.doScanCollectionFolder();
}

app.handleUploadFilePicker = event => {
    app.uploadModal.hide();
    app.uploadFilepickerData = event.target.files;
    if (app.uploadModalDoneAction) app.uploadModalDoneAction(); else app.doNextInQueue();
}

app.filePickerListenersAttached = false;
app.prepareFilePickerListeners = () => {

    $('#filepicker').val(null);
    $('#uploadFilepicker').val(null);

    if (app.filePickerListenersAttached) return;
    app.filePickerListenersAttached = true;

    document.getElementById("filepicker")
        .addEventListener("change", app.handleFilePicker, false);

    document.getElementById("uploadFilepicker")
        .addEventListener("change", app.handleUploadFilePicker, false);
}


app.drawBatchModalUi = async () => {

    batchProcessorCancelButtonId.classList.remove("hidden");
    autoFillJustCurrentNftOptionParentId.classList.add("hidden");
    uploadAutoFillJustCurrentNftOptionParentId.classList.add("hidden");

    app.$autoFillProcessItems2 = app.$autoFillProcessItems2 || $("#autoFillProcessItems2");
    app.$autoFillProcessItems2.prop("checked", true);
    if (app.startButtonText) batchProcessorStartButtonId.innerHTML = app.startButtonText;

    let batches = await app.db.batches
        .where("collectionId")
        .equals(app.state.collection.currentId.toString())
        .toArray();

    app.$addToBatchOptionsId = app.$addToBatchOptionsId || $("#addToBatchOptionsId")
    app.$addToBatchOptionsId.children().remove();
    for (let batch in batches) {
        let newOption = `<option value="${batches[batch].id}">${batches[batch].options.name} (${batches[batch].assetIndexes.length})</option>`;
        app.$addToBatchOptionsId.append(newOption);
    }

}


app.collectionBatchItemTemplate = `
<tr>
    <td>NAME</td><td>TIMESTAMP</td><td>COUNT</td>
    <td>
    <div class="btn-group btn-group-sm align-middle" role="group" aria-label="Actions">
        <button type="button" data-id="ID" class="btn btn-outline-primary batchItemViewButton">Select</button>
        <button type="button" data-id="ID" class="btn btn-outline-primary batchItemMintButton">Actions</button>
        <button type="button" data-id="ID" class="btn btn-outline-primary batchItemDeleteButton"
        data-bs-toggle="modal"
                    data-bs-target="#confirmDeleteBatch">X</button>
    </div>
    </td>
</tr>
`;

app.renderCollectionBatchList = () => {
    app.db.open().then(function () {

        return app.db.batches
            .where("collectionId")
            .equals(app.state.collection.currentId.toString())
            .toArray();

    }).then(function (batches) {

        let newDate = new Date();
        app.$collectionEditorBatchesId = app.$collectionEditorBatchesId || $("#collectionEditorBatchesId");
        app.$batchListBlankMessageId = app.$batchListBlankMessageId || $("#batchListBlankMessageId");
        app.$batchListTableId = app.$batchListTableId || $("#batchListTableId");


        app.$collectionEditorBatchesId.children().remove();

        if (batches.length > 0) {
            app.$batchListBlankMessageId.addClass("hidden");
            app.$batchListTableId.removeClass("hidden");
        } else {
            app.$batchListBlankMessageId.removeClass("hidden");
            app.$batchListTableId.addClass("hidden");
        }

        for (let batch of batches) {
            newDate.setTime(batch.dateCreated);
            let dateString = newDate.toUTCString();
            // console.log(batch);
            let template = app.collectionBatchItemTemplate;
            template = template.replace(/NAME/g, batch.options.name);
            template = template.replace(/TIMESTAMP/g, dateString);
            template = template.replace(/COUNT/g, batch.assetIndexes.length);
            template = template.replace(/ID/g, batch.id);
            app.$collectionEditorBatchesId.append(template);
        }

        // needs a fresh jquery call every time function is called
        $(".batchItemViewButton").click((e) => {

            app.currentBatchId = $(e.target).data("id");

            app.db.open().then(function () {

                return app.db.batches
                    .where("id")
                    .equals(app.currentBatchId)
                    .toArray();

            }).then(async function (batches) {

                if (batches && batches[0]) {
                    // console.log("[ batchItemMintButton ] actions clicked: batchId: " + app.currentBatchId, batches[0].assetIndexes);
                    await app.setSelection(batches[0].assetIndexes);
                    app.enableSelectMode();
                }

            });
        });


        // needs a fresh jquery call every time function is called
        $(".batchItemDeleteButton").click((e) => {
            app.batchIdToDelete = $(e.target).data("id");
            // app.deleteBatch(batchId);
        });


        app.$deleteBatchButtonId = app.$deleteBatchButtonId || $("#deleteBatchButtonId");
        app.$deleteBatchButtonId.click((e) => {
            if (app.batchIdToDelete) app.deleteBatch(app.batchIdToDelete);
            // app.deleteBatch(app.currentBatchId);
            if (app.batchModal) app.batchModal.hide();
        });


        // needs a fresh jquery call every time function is called
        $(".batchItemMintButton").click((e) => {

            app.currentBatchId = $(e.target).data("id");

            // console.log("[ batchItemMintButton ] mint clicked: batchId: " + app.currentBatchId);

            if (!app.batchModal) app.batchModal = new bootstrap.Modal('#batchProcessorId');
            app.state.collection.batchMode = "mintBatch";

            app.drawBatchModalUi();

            // Preserves the translated button name
            if (!app.startButtonText) app.startButtonText = batchProcessorStartButtonId.innerHTML;

            batchProcessorStartButtonId.innerHTML = "OK";
            batchProcessorCancelButtonId.classList.add("hidden");

            app.batchModalState = "mintBatch";
            app.batchModal.show();

        });
    });
}

app.deleteBatch = async batchId => {
    console.log("[ deleteBatch ] " + batchId);
    await app.db.batches
        .where('id')
        .equals(parseInt(batchId))
        .delete();
    app.renderCollectionBatchList();
}

app.deleteFile = async (asset, indexOfFileToDelete) => {
    asset.metadata.buildData.sourceFiles.splice(indexOfFileToDelete, 1);
    await app.saveCurrentEditorSearchTerms(app.userData)
    app.drawPanel();
}

app.startMintBatch = () => {
    // console.log("[ startMintBatch ] ");
    app.renderCollectionBatchList();
}

app.setupToolTips = () => {
    app.tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    app.tooltipList = [...app.tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
}

app.getFileDataJson = (targetFiles, fileType = "all", justUnused = false) => {

    let files = [];
    for (let file of targetFiles) {

        if ((justUnused && app.isFileUsed(file)) || file.name[0] === ".") continue;

        const action = app.getActionForGroupingTypeFromFile(file, "getFileDataJson");
        if (action === "ignore") {
            continue;
        }


        if (fileType === "image") {
            let split = file.type.split("/");
            if (split[0] === "image") {
                files.push(file);
            }
        } else if (fileType === "json") {
            let split = file.type.split("/");
            if (split[1] === "json") {
                // file.used = true;
                app.setFileUsed(file);
                files.push(file);
            }

        } else if (fileType === "text") {
            if (file.type === "text/plain") {
                // file.used = true;
                app.setFileUsed(file);
                files.push(file);
            }
        } else {
            // console.log("[ getFileDataJson ] file.type: " + file.type);
            files.push(file);
        }
    }
    return files;
}

app.insertItemIntoDiv = asset => {
    // console.log("[ insertItemIntoDiv ]");
    let rarityHtml = ``;
    if (asset.rarityRank) rarityHtml = `<span class="badge text-bg-secondary">#${asset.rarityRank}</span>`; else if (asset.rarityScore) rarityHtml = `<span class="badge text-bg-secondary">${asset.rarityScore}</span>`;


    let untitled = app.dict[app.lang].untitled;

    let template = app.gridItemTemplate;
    template = template.replace(/GRID_ITEM_INDEX/g, asset.index);
    template = template.replace(/GRID_ITEM_ID/g, asset.id);
    template = template.replace(/GRID_ITEM_TITLE/g, asset.metadata && asset.metadata.nftName || asset.filePath || untitled);
    template = template.replace(/GRID_ITEM_STATE/g, app.getHumanReadableState(asset.state));
    template = template.replace(/GRID_ITEM_RARITY/g, rarityHtml);
    template = template.replace(/GRID_ITEM_CLASS/g, asset.state);

    let $items = $(template);

    app.$gridItemsId.append($items);
    app.addItemImageToLoadQueue(asset);

}


app.getHumanReadableState = state => {
    if (state === "todo") return "To Do";
    if (state === "ready") return "Ready";
    if (state === "uploaded") return "Uploaded";
    if (state === "minted") return "Minted";
    return "Loading";
}
app.initImageQueue = () => {
    app.imageLoadQueue = [];
}

app.addItemImageToLoadQueue = asset => {
    app.imageLoadQueue.push(asset);
    app.loadNextImageInLoadQueue();
}

app.loadNextImageInLoadQueue = () => {

    if (app.imageLoadQueue.length < 1) return;

    let asset = app.imageLoadQueue.shift();
    // console.log("[ loadNextImageInLoadQueue ] asset: ", asset);

    if (!asset.file && (!asset.metadata || !asset.metadata.buildData || asset.metadata.buildData.thumbIndex === null || asset.metadata.buildData.thumbIndex === undefined) && !asset.thumb && !asset.gif) {
        // console.log("[ loadNextImageInLoadQueue ] no file to load");
        // console.log(asset);
        return;
    }

    // Load from an image blob (generated image thumbnail)
    if (asset.metadata.buildData.sourceFiles[asset.metadata.buildData.thumbIndex] && asset.metadata.buildData.sourceFiles[asset.metadata.buildData.thumbIndex].thumb) {
        // console.log("[ loadNextImageInLoadQueue ] USE THUMB");
        let uri = URL.createObjectURL(asset.metadata.buildData.sourceFiles[asset.metadata.buildData.thumbIndex].thumb);
        $('img[data-index="' + asset.index + '"]').attr('src', uri);
    }

    // Load from a File reference
    else if (asset.file) {
        // console.log("[ loadNextImageInLoadQueue ] USE asset.file");
        let fileReader = new FileReader();
        fileReader.addEventListener("load", function (event) {
            let imageSrc = event.target.result;
            $('img[data-index="' + asset.index + '"]').attr('src', imageSrc);
        });
        fileReader.readAsDataURL(asset.file);
    }

    // Load from an image blob (generated gif thumbnail)
    else if (asset.gif) {
        // console.log("[ loadNextImageInLoadQueue ] USE asset.gif");
        $('img[data-index="' + asset.index + '"]').attr('src', asset.gif);
    }

    // Load from an image blob (generated image thumbnail) DEPRECATED
    else if (asset.thumb) {
        console.log("[ loadNextImageInLoadQueue ] USE asset.thumb");
        let uri = URL.createObjectURL(asset.thumb);
        $('img[data-index="' + asset.index + '"]').attr('src', uri);

    } else {
        // console.log("[ loadNextImageInLoadQueue ] NOTHING LOADED -thumb index: " + asset.metadata.buildData.thumbIndex, asset.metadata.buildData.sourceFiles[asset.metadata.buildData.thumbIndex]);
    }

}


app.doSortGrid = () => {
    app.$gridItemsId.isotope({sortBy: 'itemIndex'});
}

app.returnQueryParsed = queryString => {
    let queries = queryString.split(",");
    let queryParsed = {};
    for (let i = 0; i < queries.length; i++) {
        let queryParts = queries[i].split("=");
        queryParsed[queryParts[0]] = queryParts[1];
    }
    return queryParsed;
}

app.loadCurrentCollection = (whoCalledMe = "") => {

    if (app.loadingCurrentCollection === true) return;
    app.loadingCurrentCollection = true;

    // console.log("[ loadCurrentCollection ] called by " + whoCalledMe);

    app.loadDisplayState();

    app.$gridItemsId.children().remove(); // show something happening, even though this gets called after loading too

    app.loadCollectionAssets(app.state.collection.currentId, app.drawCurrentCollection);

    app.saveStateWithCallback(() => {
        app.loadingCurrentCollection = false;
    }, "loadCurrentCollection");

}

// Draws collection from memory
app.drawCurrentCollection = (whoCalledMe = "") => {

    app.$gridItemsId.children().remove();
    for (let i = 0; i < app.state.collection.assets.length; i++) {
        app.insertItemIntoDiv(app.state.collection.assets[i]);
    }
    app.listenForItemClicks();
    app.getCollectionTotal(app.state.collection.currentId, app.drawPagination);
    app.updateAllGridItemsSelectedState();
}


// updates the state of a single item without redrawing everything
app.redrawAssetGridItem = (asset) => {
    app.$gridItemsId = app.$gridItemsId || $("#gridItemsId");
    if (asset.metadata.buildData.thumbIndex && asset.metadata.buildData.sourceFiles[asset.metadata.buildData.thumbIndex] && asset.metadata.buildData.sourceFiles[asset.metadata.buildData.thumbIndex].thumb) {
        let uri = URL.createObjectURL(asset.metadata.buildData.sourceFiles[asset.metadata.buildData.thumbIndex].thumb);
        $('img[data-index="' + asset.index + '"]').attr('src', uri);
    }
    app.$gridItemsId
        .find(`[data-index='${asset.index}']`)
        .find('.itemTitle')
        .text(app.getTitleForUi(asset));
}

app.doClick = (itemEl) => {
    if (app.$lastSelectedGridItem) app.$lastSelectedGridItem.removeClass("selected");
    app.$lastSelectedGridItem = $(itemEl);
    app.$lastSelectedGridItem.addClass("selected");
    app.toggleGridItemSelection(itemEl);
    app.collectionEditorEditItem($(itemEl).data("id"), app.selectionEnabled);
}

app.listenForItemClicks = () => {
    $('.collection-item').click(function () {
        app.doClick($(this));
    });

    $('.collection-item input').click(function () {
        app.doClick($(this).parent());
    });
}

app.updateSpaceAvailable = () => {
    if (!/(safari)/i.test(navigator.userAgent)) {
        navigator.storage.estimate().then(function (data) {

            app.storageQuota = data.quota;
            app.storageUsage = data.usage;
            app.storagePercOfUsedSpace = app.storageUsage / app.storageQuota;
            app.storageAvailable = app.storageQuota - app.storageUsage;
            app.storageAvailableHuman = app.formatSizeUnits(app.storageAvailable);

            // console.log("Space available: " + app.storageAvailableHuman);

        })
    }
}

//
// called by the UI to open and close the editor panel and to show the specific editor views
//
app.doToggleEditorPanel = async (show = null, view = "collection", force = false) => new Promise(async (resolve, reject) => {
    // console.log(`[ doToggleEditorPanel ] IN show: ${show} - view: ${view} - force: ${force}`);

    app.tabSelectedByUser = view;

    app.$panelContainerId = app.$panelContainerId || $("#panelContainerId");
    app.$collectionEditor = app.$collectionEditor || $("#collection-editor");
    app.$nftEditor = app.$nftEditor || $("#nft-editor");

    if (show === null) show = app.$panelContainerId.hasClass("mintr-collapse");

    if (!force && app.$panelContainerId.hasClass("mintr-collapse") && view === "collection") show = true;


    if (show) {

        app.$collectionEditorEditButtonId.removeClass("btn-outline-primary");
        app.$collectionEditorEditButtonId.addClass("btn-primary");

        app.$panelContainerId.removeClass("mintr-collapse");
        if (view === "collection") {

            app.$collectionEditor.removeClass("hidden");
            app.$nftEditor.addClass("hidden");

            if (app.editorTabs)
                app.editorTabs["collection-editor-tab"].tabTrigger.show();

        } else {

            app.$collectionEditor.addClass("hidden");
            app.$nftEditor.removeClass("hidden");

            if (app.editorTabs)
                app.editorTabs["nft-editor-tab"].tabTrigger.show();
        }

        app.drawPanel();

    } else {
        app.$panelContainerId.addClass("mintr-collapse");
        app.$collectionEditorEditButtonId.addClass("btn-outline-primary");
        app.$collectionEditorEditButtonId.removeClass("btn-primary");
        app.$collectionEditor.addClass("hidden");
        app.$nftEditor.addClass("hidden");
    }


    // console.log(`[ doToggleEditorPanel ] AFTER show: ${show} - view: ${view} - force: ${force}`);
    resolve();
})

app.drawPanel = () => {
    let userData = app.currentPage() === "settings" ? app.state.defaultData : app.currentEditor() === "collection" ? app.state.collection.userData : app.userData;
    app.copyDataToPreview(userData, "drawPanel");

    if (app.currentAsset) {
        $("#nftEditorBlankMessageId").addClass("hidden");
        $("#nftEditorPanelId").removeClass("hidden");
    } else {
        $("#nftEditorBlankMessageId").removeClass("hidden");
        $("#nftEditorPanelId").addClass("hidden");
    }
}

//
// called when an item is selected in the UI
//
app.collectionEditorEditItem = (id, ignorePanelState = false) => {

    app.getItemData(id, function (asset) {

        app.userData = asset.metadata;
        app.currentAsset = asset;
        app.currentAssetId = id;

        if (!ignorePanelState) app.doToggleEditorPanel(true, "nft");

        const mainImagePreviewIdEl = document.getElementById('mainImagePreviewId');
        const nftEditorImageIdEl = document.getElementById('nftEditorImageId');

        if (asset.gif) {
            mainImagePreviewIdEl.src = asset.gif;
            nftEditorImageIdEl.src = asset.gif;
            mainImagePreviewIdEl.classList.remove("hidden");

        } else if (asset.thumb) {
            mainImagePreviewIdEl.src = URL.createObjectURL(asset.thumb);
            nftEditorImageIdEl.src = URL.createObjectURL(asset.thumb);
            mainImagePreviewIdEl.classList.remove("hidden");

        } else if (app.userData && app.userData.buildData && app.userData.buildData.thumbIndex !== undefined && app.userData.buildData.sourceFiles[app.userData.buildData.thumbIndex] && app.userData.buildData.sourceFiles[app.userData.buildData.thumbIndex].thumb) {
            // console.log("[ collectionEditorEditItem ] SHOW Id: " + id + " ", asset);
            mainImagePreviewIdEl.src = URL.createObjectURL(app.userData.buildData.sourceFiles[app.userData.buildData.thumbIndex].thumb);
            nftEditorImageIdEl.src = URL.createObjectURL(app.userData.buildData.sourceFiles[app.userData.buildData.thumbIndex].thumb);
            mainImagePreviewIdEl.classList.remove("hidden");
        } else {
            // console.log("[ collectionEditorEditItem ] HIDE Id: " + id + " ", asset);
            mainImagePreviewIdEl.classList.add("hidden");
            mainImagePreviewIdEl.src = "/img/placeholder_image.svg";
            nftEditorImageIdEl.src = "/img/placeholder_image.svg";
        }

        if (!app.userData) app.userData = {};
        app.generateJson(app.userData, "collectionEditorEditItem");
        app.copyDataToPreview(app.userData, "collectionEditorEditItem");

    });

}


app.catalogingDoCancel = () => {
    app.$processingModalId.addClass("mintr-collapse");
}


app.updateMainActionButton = () => {

    switch (app.state.collection.filter) {
        case "all":
        case "minted":
            app.$mainActionButtonId.hide();
            break;
        case "todo":
            app.$mainActionButtonId.text("Update Metadata (" + app.state.collection.itemsTotal + ")");
            app.$mainActionButtonId.show();
            break;
        case "ready":
            app.$mainActionButtonId.text("Upload (" + app.state.collection.itemsTotal + ")");
            app.$mainActionButtonId.show();
            break;
        case "uploaded":
            app.$mainActionButtonId.text("Mint (" + app.state.collection.itemsTotal + ")");
            app.$mainActionButtonId.show();
            break;
    }
}

app.doStartLoadAction = () => {

    // console.log("[ doStartLoadAction ] loadModalState: " + app.loadModalState);

    loadModalLabel.innerText = app.loadModalState === "nft" ? "Add Files to NFT" : "Scan & Import";
}

app.doStartMainAction = action => {

    // console.log("[ doStartMainAction ] action passed: " + action);
    switch (action) {
        case "todo":
            app.doStartAutoFillAll();
            break;
        case "ready":
            app.doStartUploadAll();
            break;
        case "uploaded":
            app.doAddAllToBatch();
            break;
        case "mintBatch":
            app.doStartMintBatch();
            break;
    }
}

app.doStartButtonMainAction = () => {

    let doJustSelectedNft = $("#autoFillProcessItems1").is(':checked');

    // console.log("[ doStartButtonMainAction ] app.batchModalState: " + app.batchModalState);

    switch (app.batchModalState) {
        case  "autoFillCurrent":
        case  "autoFillToDo":
        case  "autoFillAll":
            app.startAutoFillAll();
            app.batchModal.hide();
            return;
        case  "uploadBatch":
        case  "uploadCurrent":
        case  "uploadReady":
        case  "uploadAll":
            app.startUploadAll();
            app.batchModal.hide();
            return;
        case  "mintCurrent":
        case  "mintUploaded":
        case  "mintAll":
            app.addAllToBatch();
            app.batchModal.hide();
            return;
        case  "mintBatch":
            app.startMintBatch();
            app.batchModal.hide();
            return;
    }

}

app.doStopMainAction = () => {

    console.log("[ doStopMainAction ]");
    switch (app.state.collection.filter) {

        case "todo":

            break;
        case "ready":

            break;
        case "uploaded":

            break;
    }

}


// Called when loading file from disk
app.addFilesToDBCatalog = files => {
    // console.log(`[ addFilesToDBCatalog ]??`);

    app.addFilesToDBCatalogFiles = files;
    app.addFilesToDBCatalogCurrentIndex = 0;

    app.addFilesToDBCatalogNext();
}


app.addFilesToDBCatalogDone = function () {
    // console.log(`[ addFilesToDBCatalogDone ]`);

    app.doNextInQueue();

    // app.updateMediaOrderForCurrentCollection();
    app.loadCurrentCollection("addFilesToDBCatalogDone");
}


// Called when loading file from disk
app.addFilesToDBCatalogNext = () => {

    // console.log(`[ addFilesToDBCatalogNext ]`);

    if ((app.maxItemsToRead > 0 && app.addFilesToDBCatalogCurrentIndex >= app.maxItemsToRead) || app.addFilesToDBCatalogCurrentIndex + 1 > app.addFilesToDBCatalogFiles.length) {
        app.addFilesToDBCatalogDone();
        return;
    }

    app.addOrUpdateAssetWithFile(app.addFilesToDBCatalogCurrentIndex, app.addFilesToDBCatalogNext);

    app.addFilesToDBCatalogCurrentIndex++;
}


app.drawGrid = function () {
    var elems = app.$gridItemsId.isotope('getFilteredItemElements');
    app.$gridItemsId.isotope('layoutItems', true);
}

app.getFileTypeInfo = (fileTypeIn, whoCalledMe = "") => {


    if (!fileTypeIn) fileTypeIn = "generic";

    let fileType = fileTypeIn;
    // console.log("[ getFileTypeInfo ] whoCalledMe: " + whoCalledMe + " - fileType: " + fileType + " - fileTypeIn: ", fileTypeIn);
    const typeParts = fileTypeIn.split("/");
    if (typeParts[1]) {
        const filenameParts = typeParts[1].split(".");
        fileType = filenameParts[1] || typeParts[1];
    }
    /* if (!fileType) {
         // console.log("[ getFileTypeInfo ] fileType: " + fileType + " - fileTypeIn: " + fileTypeIn);
         return null;
     }*/

    fileType = fileType.toLowerCase();

    let icon = "document";
    let isMedia = false;
    let couldImport = false;

    switch (fileType) {
        case "png":
        case "jpg":
        case "jpeg":
        case "webp":
        case "gif":
            icon = "image";
            isMedia = true;
            couldImport = true;
            break;
        case "mp4":
            icon = "video";
            isMedia = true;
            break;
        case "json":
            icon = "build";
            break;
    }

    // console.log("[ getFileTypeInfo ] fileTypeIn: " + fileTypeIn + "  - fileType: " + fileType);

    return {
        fileType: fileType, isMedia: isMedia, icon: icon, couldImport: couldImport
    }
}


app.updateImportFilesGroupingData = (files) => {
    app.state.currentFileScanAllFiles = [];
    app.state.currentFileScanTypes = [];
    app.currentFileScanGroups = [];
    app.state.currentFileScanSubGroups = [];

    app.currentGroupingMode = "import";

    for (let file of files) {

        if (file.name[0] === ".") continue; // hidden file

        // make all files list
        app.state.currentFileScanAllFiles[file.name] = {
            name: file.name,
            type: app.getFileTypeInfo(app.getFileExtension(file.name), "b"),
            count: 1,
            files: [file.name]
        };


        // make file scan types list
        const fileType = app.getFileType(file.name);
        if (!app.state.currentFileScanTypes[fileType]) app.state.currentFileScanTypes[fileType] = {
            name: fileType,
            type: app.getFileTypeInfo(app.getFileExtension(file.name), "c"),
            count: 0,
            files: []
        };
        app.state.currentFileScanTypes[fileType].count++;
        if (!app.state.currentFileScanTypes[fileType].files) app.state.currentFileScanTypes[fileType].files = [];
        app.state.currentFileScanTypes[fileType].files.push(file.name);


        // console.log("[ updateImportFilesGroupingData ] group: ", group);

        // make groups list
        let group = app.getGroupFromFilename(file.name);
        if (!app.currentFileScanGroups[group]) app.currentFileScanGroups[group] = {name: group, count: 0, files: []};
        if (!app.currentFileScanGroups[group].files) app.currentFileScanGroups[group].files = [];
        app.currentFileScanGroups[group].count++;
        app.currentFileScanGroups[group].files.push(file.name);

        // make sub groups list
        let subGroup = app.getSubGroupFromFilename(file.name);
        if (subGroup) {
            const fileTypeInfo = app.getFileTypeInfo(app.getFileExtension(file.name), "d");
            ``
            // const key = subGroup + "_" + fileTypeInfo.fileType;
            const key = subGroup;
            let item = app.state.currentFileScanSubGroups.find(item => item.key === key);
            if (!item) {
                app.state.currentFileScanSubGroups.push({
                    name: subGroup,
                    key: key,
                    type: fileTypeInfo,
                    count: 0,
                    files: []
                });
                item = app.state.currentFileScanSubGroups[app.state.currentFileScanSubGroups.length - 1];
            }

            item.count++;
            item.files.push(file.name);
        }
    }

    app.state.currentFileScanSubGroups.sort(function (a, b) {
        var textA = a.name.toUpperCase();
        var textB = b.name.toUpperCase();
        return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    });


    app.state.currentFileScanTypes.sort(function (a, b) {
        var textA = a.name.toUpperCase();
        var textB = b.name.toUpperCase();
        return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    });


    app.state.currentFileScanAllFiles.sort(function (a, b) {
        var textA = a.name.toUpperCase();
        var textB = b.name.toUpperCase();
        return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    });


    app.currentFileScanGroupReport = "";
    for (const group in app.currentFileScanGroups) {
        app.currentFileScanGroupReport += "<b>" + app.currentFileScanGroups[group].count + "</b> files for: <b>" + group + "</b><br>\n";
    }

    // console.log(app.currentFileScanGroupReport);
    // console.log("app.currentFileScanGroups: ", app.currentFileScanGroups);
    // console.log("app.state.currentFileScanSubGroups: ", app.state.currentFileScanSubGroups);
    cataloginOptionsFilesListId.innerHTML = app.currentFileScanGroupReport;
}


app.getSelectedScanCollectionGroupMode = () => {
    return groupingOptionId.value;

    // let mode = "singleFiles";
    // if (groupByFileTypeModeId && groupByFileTypeModeId.checked)
    //     mode = "fileType";
    // else if (groupBySubGroupsId && groupBySubGroupsId.checked)
    //     mode = "subGroups";
    // return mode;
}

app.doScanCollectionFolder = () => {

    if (app.currentFilesScan === undefined) return;

    scanAndImportHeaderId.innerHTML = app.loadModalState === "nft" ? "Add Files to NFT" : "Scan & Import";

    app.state.lastScanCollectionGroupMode = app.getSelectedScanCollectionGroupMode();

    $(".fileGroupModeInput").change(function () {
        if (app.state.lastScanCollectionGroupMode !== app.getSelectedScanCollectionGroupMode()) {
            app.doScanCollectionFolder();
        }
    });
    $("#groupingOptionId").change(function () {
        if (app.state.lastScanCollectionGroupMode !== app.getSelectedScanCollectionGroupMode()) {
            app.doScanCollectionFolder();
        }
    });

    // console.log("Handler for .change() called. mode: ", app.state.lastScanCollectionGroupMode);

    app.updateImportFilesGroupingData(app.currentFilesScan);

    app.$processingModalId.removeClass("mintr-collapse");
    app.$fileScanResultTableId.children().remove();

    let pathCounts = [];
    let fileCounts = [];

    // count per path, and per type
    for (let file of app.currentFilesScan) {
        // console.log("file.type: " + file.type + " file: ", file);
        if (file.name && file.type && file.type !== "") {
            let pathParts = file.name.split("/");
            pathParts.pop();
            const justPath = pathParts.join("/");
            const path = pathParts.join('/');

            // console.log("path: " + path + "  ==? " + file.name);

            if (path !== file.name) if (!pathCounts[path]) pathCounts[path] = 1; else pathCounts[path] += 1;

            if (!fileCounts[file.type]) fileCounts[file.type] = 1; else fileCounts[file.type] += 1;
        }
    }

    let itemCnt = 0;
    // console.log("[ fileCounts ] ",fileCounts)
    // console.log("[ doScanCollectionFolder ] currentFileScanSubGroups: ", app.state.currentFileScanSubGroups);
    // for (let subGroup = 0; subGroup < app.state.currentFileScanSubGroups.length; subGroup++) {

    // console.log("[ doScanCollectionFolder ] fileCounts: ", fileCounts);
    // console.log("[ doScanCollectionFolder ] currentFileScanSubGroups: ", app.state.currentFileScanSubGroups);

    let groups = [];
    if (app.state.lastScanCollectionGroupMode === "subGroups") {
        groups = app.state.currentFileScanSubGroups;
    } else if (app.state.lastScanCollectionGroupMode === "fileType") {
        groups = app.state.currentFileScanTypes;
    } else if (app.state.lastScanCollectionGroupMode === "singleFiles") {
        groups = app.state.currentFileScanAllFiles;
    }


    groups.sort((a, b) => {
        // console.log("groups - a: ", a);
        let fa = a.name.toLowerCase(), fb = b.name.toLowerCase();

        if (fa < fb) {
            return -1;
        }
        if (fa > fb) {
            return 1;
        }
        return 0;
    });

    // console.log("[ groups ] len: " + groups.length + " ", groups);

    // for (let i = 0; i < groups.length; i++) {
    //     console.log("[ groups ] " + i + ": ", groups[i]);
    // }
    let pickedAnImport = false;
    for (const subGroup in groups) {

        // let orderHtml = !fileTypeInfo.isMedia ? "" : `<input type="number" class="form-control catalogItemOrder" placeholder="${itemCnt}">`;
        let orderHtml = "";
        let icon = groups[subGroup].type ? groups[subGroup].type.icon : "";

        let template = app.fileScanResultItemTemplate; // scan as default for all with import/convert available

        if (groups[subGroup].type && groups[subGroup].type.fileType) {
            if (groups[subGroup].type.fileType === "json" || groups[subGroup].type.fileType === "txt" || groups[subGroup].type.fileType === "csv") {
                template = app.fileScanResultItemNoImportTemplate;
                // template = template.replace(/HIDDEN/g, "hidden");
            }

            // const fileTypeInfo = app.getFileTypeInfo(groups[subGroup].type);
            if (!pickedAnImport && groups[subGroup].type.couldImport === true) {
                template = app.fileScanResultItemImportModeTemplate;
                pickedAnImport = true;
            }
        }

        template = template.replace(/ICON/g, icon);
        template = template.replace(/LABEL/g, groups[subGroup].name);
        // template = template.replace(/LABEL/g, groups[subGroup].type.fileType.toUpperCase());
        template = template.replace(/COUNT/g, groups[subGroup].count);
        template = template.replace(/DATAORDER/g, itemCnt++);
        template = template.replace(/DATAFILETYPE/g, groups[subGroup].name);
        template = template.replace(/ORDER/g, orderHtml);

        app.$fileScanResultTableId.append(template);

    }


    let pathParts = "";
    for (const key in pathCounts) {
        pathParts += key + "<br>";
    }
    app.$scanDirectoryListId.html(pathParts);

    app.updateCatalogingUploadOption();


}

app.copyFormToProcessingOptions = () => {

    app.state.transcoding = app.defaultImageProcessingOptions;
    app.state.transcoding.groupMode = app.state.lastScanCollectionGroupMode || app.getSelectedScanCollectionGroupMode();

    app.state.transcoding.assetTypeActions = {};
    let assetActionMenus = $(".assetActionMenu");
    for (const assetActionMenu of assetActionMenus) {
        app.state.transcoding.assetTypeActions[$(assetActionMenu).data("filetype")] = $(assetActionMenu).val();
    }

    // console.log("assetActionMenus>>>>>>>>>> ", app.state.transcoding.assetTypeActions);

    // IMAGE OPTIONS
    app.state.transcoding.imagesIgnore = app.$ignoreImagesId.prop("checked");
    app.state.transcoding.imagesDoImport = app.$importOriginalsId.prop("checked");
    // app.state.transcoding.imagesDoConvert = app.$convertImagesId.prop("checked");
    app.state.transcoding.imagesDoThumbnails = app.$useImagesForThumbnailId.prop("checked");

    app.state.transcoding.imagesFileType = $("#fileTypeId option:selected").text();
    app.state.transcoding.imagesDoResize = app.$resizeCheckId.prop("checked");
    app.state.transcoding.imagesResizeDimension = $("#restrictDimensionId option:selected").val();
    app.state.transcoding.imagesQuality = parseInt(app.$convertImagesQualityId.val());

    app.state.transcoding.imagesResizeAmount = parseInt(app.$convertImagesPixelsId.val());
    app.$convertImagesPixelsId.val(app.state.transcoding.imagesResizeAmount);


    // VIDEO OPTIONS
    app.state.transcoding.videosIgnore = app.$videosIgnoreId.prop("checked");
    app.state.transcoding.videosDoImport = app.$importOriginalVideosId.prop("checked");
    // app.state.transcoding.videosDoConvert = app.$convertVideosId.prop("checked");
    app.state.transcoding.videosDoThumbnails = app.$useVideosForThumbnailId.prop("checked");

    app.state.transcoding.videosFileType = $("#videoFileTypeId option:selected").text();
    app.state.transcoding.videosDoResize = app.$videoResizeCheckId.prop("checked");
    app.state.transcoding.videosResizeDimension = $("#videoRestrictDimensionId option:selected").val();
    app.state.transcoding.videosQuality = parseInt(app.$videoConvertImagesQualityId.val());
    app.state.transcoding.videosFps = parseInt(app.$videoFpsId.val());

    app.state.transcoding.videosResizeAmount = parseInt(app.$videoAmountInPixelsId.val());
    app.$videoAmountInPixelsId.val(app.state.transcoding.videosResizeAmount);

    app.state.transcoding.groupFilesByFileName = app.$groupFilesOptionId.prop("checked");
}


app.updateCatalogingUploadOption = function () {

    app.copyFormToProcessingOptions();

    // console.log("[ updateCatalogingUploadOption ]");
    // console.log(app.state.transcoding);

    // if (!app.state.transcoding.imagesDoConvert && !app.state.transcoding.imagesDoThumbnails) app.$resizeControls.addClass("mintr-collapse"); else app.$resizeControls.removeClass("mintr-collapse");
    // if (!app.state.transcoding.videosDoConvert && !app.state.transcoding.videosDoThumbnails) app.$resizeVideoControls.addClass("mintr-collapse"); else app.$resizeVideoControls.removeClass("mintr-collapse");

}

//
// doCatalogingImport is called by Import in the Cataloging Options modal
//
app.doCatalogingImport = () => {

    if (app.currentFilesScan === undefined) return;

    // console.log("[ doCatalogingImport ]");

    app.copyFormToProcessingOptions();

    if (app.loadModalState !== "nft" && overwriteModeId && overwriteModeId.checked) {
        app.$gridItemsId.children().remove();
        app.deleteAllCollectionAssets(app.state.collection.currentId, app.addAllFromFileScan);
    } else {
        app.addAllFromFileScan();
    }
}

app.isMediaFile = fileType => {
    return true;
    // app.mediaTypes = ["mp4", "jpg", "jpeg", "png", "webp", "webm", "gif", "pdf", "wav", "aif", "aiff"];
    // return app.mediaTypes.includes(fileType);
}


app.updateDefaultMediaOrder = () => new Promise(async (resolve, reject) => {

    console.log("[ updateDefaultMediaOrder ]");

    let userOrderedOptions = [];
    let defaultOrderedOptions = [];

    if (!app.state) app.state = {};
    app.state.defaultMediaOrder = [];

    let mainCount = 0;
    // read the media settings from the Cataloging Options modal into an array called app.state.collection.mediaImportOptions
    app.state.collection.mediaImportOptions = [];
    $(".autoFillFileItem").each(function (index) {

        app.state.collection.mediaImportOptions.push({
            newOrder: $(this).find(".catalogItemOrder").val(),
            originalOrder: $(this).data("order"),
            type: $(this).data("filetype").toLowerCase(),
            subgroup: $(this).data("subgroup"),
            isThumbnail: $(this).find(".autoFillThumbnailOption").is(':checked'),
            isLink: $(this).find(".autoFillLinkOption").is(':checked'),
            isMain: $(this).find(".autoFillMainAssetOption").is(':checked')
        });
        // console.log("[ updateDefaultMediaOrder ]" +
        //     " autoFillMainAssetOption: " + $("input:radio[name='autoFillMainAssetOption']:checked").val()
        // );

        // console.log("[ updateDefaultMediaOrder ] index: " + index + " - newOrder: " + app.state.collection.mediaImportOptions[index].newOrder + " - originalOrder: " + app.state.collection.mediaImportOptions[index].originalOrder + " - ignore: " + app.state.collection.mediaImportOptions[index].ignore + " - type: " + app.state.collection.mediaImportOptions[index].type);
        // }

    });

    // console.log("[ updateDefaultMediaOrder ] mediaImportOptions: ", app.state.collection.mediaImportOptions);

    for (const mediaOption of app.state.collection.mediaImportOptions) {
        // console.log("[ updateDefaultMediaOrder ] newOrder: " + mediaOption.newOrder + " - originalOrder: " + mediaOption.originalOrder + " - ignore: " + mediaOption.ignore + " - type: " + mediaOption.type);
        if (mediaOption.newOrder > app.state.collection.mediaImportOptions.length) mediaOption.newOrder = app.state.collection.mediaImportOptions.length;
        if (mediaOption.newOrder) userOrderedOptions.push(mediaOption); else defaultOrderedOptions.push(mediaOption);
    }

    userOrderedOptions.sort((a, b) => {
        return a.newOrder - b.newOrder;
    });
    defaultOrderedOptions.sort((a, b) => {
        return a.originalOrder - b.originalOrder;
    });

    let index = 0;
    userOrderedOptions.forEach((e) => {
        // console.log(`userOrderedOptions > ${e.newOrder} - ${e.type}`);
        app.state.defaultMediaOrder[index++] = e;
    });
    defaultOrderedOptions.forEach((e) => {
        // console.log(`defaultOrderedOptions > ${e.originalOrder} - ${e.type}`);
        app.state.defaultMediaOrder[index++] = e;
    });

    await app.saveCurrentCollectionToDb(app.state.collection.userData);

    resolve();
})


// "import" button in "cataloging options" starts this
app.addAllFromFileScan = () => {

    app.refreshCatalogNeeded = true;

    // first, scan for json
    app.state.collection.allJsonFiles = app.getFileDataJson(app.currentFilesScan, "json");

    // console.log("[ addAllFromFileScan ] ", app.state.collection.allJsonFiles);

    function sortByName(a, b) {

        const nameA = a.name.toUpperCase();
        const nameB = b.name.toUpperCase();

        let comparison = 0;
        if (nameA > nameB) {
            comparison = 1;
        } else if (nameA < nameB) {
            comparison = -1;
        }
        return comparison;
    }

    // sort by filename
    app.state.collection.allJsonFiles.sort(sortByName);

    app.addFilesToDBCatalogCurrentIndex = 0;
    app.addFilesToDBCatalogProcessedAll = false;
    app.addFilesToDBCatalogProcessedBuildFilesStarted = true;
    app.addFilesToDBCatalogProcessedBuildFilesDone = false;
    app.addFilesToDBCatalogProcessedGenericFilesStarted = false;
    app.addFilesToDBCatalogProcessedGenericFilesDone = false;

    // app.addFilesToDBCatalogProcessedBuildFilesCount = 0;
    app.addFilesToDBCatalogJsonFilesToProcessCount = app.state.collection.allJsonFiles.length;
    if (app.queue.counts && app.queue.counts.loadJsonBuildData) app.addFilesToDBCatalogJsonFilesToProcessCount += app.queue.counts.loadJsonBuildData.done;


    if (app.state.collection.allJsonFiles.length > 0) {
        // first, add build files to assign related files to the main record for the item in the db
        app.addFilesToDBCatalog(app.state.collection.allJsonFiles);
    } else {
        app.doFinishAddingBuildFiles();
    }
}

app.doAddFilesToDBCatalogUsingGrouping = () => {

    // second, (after adding build files and associated media with addAllFromFileScan() )
    // scan for everything else, omitting assets that match assets found in the build files

    app.state.collection.allNonBuildFilesJson = app.getFileDataJson(app.currentFilesScan, "all", true);

    if (!app.assignToGroupCount) app.assignToGroupCount = 0;
    if (!app.assignToGroupTotal) app.assignToGroupTotal = 0;

    app.assignToGroupTotal += app.state.collection.allNonBuildFilesJson.length;

    for (const file of app.state.collection.allNonBuildFilesJson) {
        const action = app.getActionForGroupingTypeFromFile(file, "doAddFilesToDBCatalogUsingGrouping");
        if (action === "ignore") continue;

        app.addToQueue({priority: 2, action: "assignToGroup", file: file});
    }

    app.doNextInQueue();

}

app.isFileUsed = file => {
    return file.used === true;
}
app.setFileUsed = file => {
    // console.log("[ setFileUsed ] ", file.name);
    file.used = true;
}


app.doAddGenericFilesToDBCatalog = async () => {

    app.state.collection.allUnusedFiles = app.getFileDataJson(app.currentFilesScan, "all", true);


    for (let file of app.state.collection.allUnusedFiles) {

        const action = app.getActionForGroupingTypeFromFile(file, "doAddGenericFilesToDBCatalog");
        if (action === "ignore") {
            console.log("SKIP - set to ignore: ", file);
            continue;
        }

        if (app.isFileUsed(file)) {
            console.log("SKIP doAddGenericFilesToDBCatalog: ", file);
            continue;
        }

        console.log("DO doAddGenericFilesToDBCatalog file.used: " + file.used + " file:", file);

        let asset = {};
        if (app.currentAsset) {
            // assign to be written
            asset = app.currentAsset;
        } else {
            // confirm that type is importable?
            // create new nft
            const newId = await app.addBlankNft();

            // get asset from db
            let assets = await app.db.assets.where('id').equals(newId).toArray();

            // assign to be written
            asset = assets[0];
        }

        app.addToQueue({priority: 2, action: "addGenericFile", file: file, asset: asset});
    }
    app.doNextInQueue();

}


app.drawItemCountHtml = () => {

    itemCountId.innerHTML = "Total: " + app.state.collection.itemsTotal + " • Pages: " + app.state.collection.numberOfPages;

    if (app.state.selection) itemSelectedCountId.innerHTML = "• Selected: " + app.state.selection.arrayOfIndexes.length;

    if (app.state.selection && app.state.selection.arrayOfIndexes.length) {
        addSelectionToBatchButtonId.classList.remove("disabled");
    } else {
        addSelectionToBatchButtonId.classList.add("disabled");
    }

    if (app.state.selection) app.state.selection.allSelected = app.state.selection.arrayOfIndexes.length === app.state.collection.assets.length;

    app.updateSelectButton();
}


app.drawPagination = () => {

    app.$gridPaginationContainerId.children().remove();
    app.$itemsPerPageContainerId.children().remove();

    // get the total number of items, then draw pagination and items per page UI
    app.getCollectionTotal(app.state.collection.currentId, function (total) {

        app.state.collection.page = parseInt(app.state.collection.page);
        app.state.collection.numberOfPages = Math.ceil(app.state.collection.itemsTotal / app.state.collection.items);

        app.drawItemCountHtml();


        // Add page buttons
        let pageButtonHtml = "";
        let startingIndex = 0;

        if (app.state.collection.numberOfPages > app.paginationMaxPagesToDisplay && app.state.collection.page > app.paginationMaxPagesToDisplay / 2) startingIndex = (app.state.collection.page - Math.ceil(app.paginationMaxPagesToDisplay / 2));

        for (let i = startingIndex; i < app.state.collection.numberOfPages; i++) {
            if (i >= startingIndex + app.paginationMaxPagesToDisplay) break;
            let template = app.paginationItemTemplate;
            template = template.replace(/HREF/g, "#page=" + (i + 1));
            template = template.replace(/ACTIVE_CLASS/g, ((i + 1) === app.state.collection.page) ? "active" : "");
            template = template.replace(/PAGE/g, i + 1);
            pageButtonHtml += template
        }

        let paginationHtml = app.paginationTemplate;
        paginationHtml = paginationHtml.replace(/PAGE_BUTTONS/g, pageButtonHtml);

        app.$gridPaginationContainerId.append(paginationHtml);


        // Add items per page popup
        let foundPageCount = false;
        const pageCountOptions = [10, 20, 50, 100, 250, 500, 1000, 2500, 5000];
        for (let i = 0; i < pageCountOptions.length; i++) {
            let template = app.itemsPerPageMenuItemTemplate;
            if (parseInt(app.state.collection.items) === pageCountOptions[i]) {
                foundPageCount = true;
                template = template.replace(/SELECTED/g, " selected");
            } else template = template.replace(/SELECTED/g, "");

            template = template.replace(/AMOUNT/g, pageCountOptions[i]);
            pageButtonHtml += template
        }

        if (!foundPageCount) {
            let template = app.itemsPerPageMenuItemTemplate;
            template = template.replace(/SELECTED/g, " selected");
            template = template.replace(/AMOUNT/g, app.state.collection.items);
            pageButtonHtml = template + pageButtonHtml;
        }

        // let itemsPerPage = app.itemsPerPageMenuTemplate;
        // itemsPerPage = itemsPerPage.replace(/OPTIONS/g, pageButtonHtml);
        // app.$itemsPerPageContainerId.append(itemsPerPage);

        if (!app.$itemsPerPageId) app.$itemsPerPageId = $("#itemsPerPageId");
        app.$itemsPerPageId.children().remove();
        app.$itemsPerPageId.append(pageButtonHtml);


        // add event listeners to newly created UI elements
        $(".page-link").click(function (item) {
            let pageNum = $(this).text();
            if (Number.isInteger(parseInt(pageNum))) {
                app.state.collection.page = pageNum;
                app.saveStateWithCallback(function () {
                    app.loadCurrentCollection("page-link click");
                }, "pagelink click");
            }
        });

        $("#prevPageId").click(function () {
            if (parseInt(app.state.collection.page) > 1) {
                app.state.collection.page = parseInt(app.state.collection.page) - app.paginationMaxPagesToDisplay;
                if (app.state.collection.page < 1) app.state.collection.page = 1;
                app.saveStateWithCallback(function () {

                    window.location.hash = "page=" + app.state.collection.page;
                    app.loadCurrentCollection("prevPageId click");
                }, "prevPageId click");
            }
        });


        $("#nextPageId").click(function () {
            let pageCount = Math.ceil(app.state.collection.itemsTotal / app.state.collection.items);
            if (parseInt(app.state.collection.page) < pageCount) {

                app.state.collection.page = parseInt(app.state.collection.page) + app.paginationMaxPagesToDisplay;

                if (app.state.collection.page > pageCount) app.state.collection.page = pageCount;

                app.saveStateWithCallback(function () {
                    window.location.hash = "page=" + app.state.collection.page;
                    app.loadCurrentCollection("nextPageId click");
                }, "nextPageId click");
            }
        });

        // items per page selection popup
        app.$itemsPerPageId.on('change', function () {
            // alert( this.value );
            const newVal = parseInt(this.value);
            if (newVal === parseInt(app.state.collection.items)) return;
            app.state.collection.page = 1;
            app.state.collection.items = newVal;
            app.saveStateWithCallback(function () {
                window.location.hash = "page=1,items=" + app.state.collection.items;
                app.loadCurrentCollection("$itemsPerPageId click");
            }, "itemsPerPageId on change");
        });

        $("#sortMenuId").on('change', function () {

            app.collectionSortBy = this.value;
            app.saveStateWithCallback(function () {
                window.location.hash = "page=1,items=" + app.state.collection.items + ",sort=" + app.collectionSortBy;
                app.loadCurrentCollection("sortMenuId change");
            }, "itemsPerPageId on change");
        });


        if (!app.$inputGroupShowFilterId) app.$inputGroupShowFilterId = $("#inputGroupShowFilterId");

        app.$inputGroupShowFilterId.on('change', (result) => {

            console.log("inputGroupShowFilterId: CHANGE", app.$inputGroupShowFilterId.val())

            // if (app.state.collection.filterId !== undefined && app.state.collection.filterId === activeId) return false;

            app.state.collection.filterId = app.$inputGroupShowFilterId.val();

            app.updateFilterSearchAndRedraw();


        });


        // items per page selection popup
        $("#filtersId").on('change', function () {
            let activeId = '';
            $('input[type=radio]').each(function () {
                if ($(this).is(':checked')) {

                    activeId = $(this).attr('id');
                    console.log("activeId: ", activeId);

                    if (app.state.collection.filterId !== undefined && app.state.collection.filterId === activeId) return false;

                    app.state.collection.filterId = activeId;

                    app.updateFilterSearchAndRedraw();

                    return false;
                }
            });
        });

        app.updateMainActionButton();

    });

}

app.doFilter = (searchTerm) => {
    // console.log("[ doFilter ] " + searchTerm);
    app.currentSearchTerm = searchTerm.toLowerCase();
    app.updateFilterSearchAndRedraw();
}


app.updateFilterSearchAndRedraw = () => {

    console.log("[ updateFilterSearchAndRedraw ] " + app.currentSearchTerm);

    let filter = ""
    switch (app.state.collection.filterId) {
        case "filterToDoId":
            filter = "todo";
            break;
        case "filterReadyId":
            filter = "ready";
            break;
        case "filterUploadedId":
            filter = "uploaded";
            break;
        case "filterMintedId":
            filter = "minted";
            break;
        default:
            filter = "all";
            break;
    }

    app.state.collection.filter = filter;

    let hash = "page=1,items=" + app.state.collection.items + ",filter=" + app.state.collection.filter;

    if (app.currentSearchTerm && app.currentSearchTerm !== "") hash += ",search=" + app.currentSearchTerm;

    app.$searchFieldInputId.val(app.currentSearchTerm);

    window.location.hash = hash;

    app.loadCurrentCollection("updateFilterSearchAndRedraw");

}

app.savePaginationState = () => {

    app.state.collection.queryParsed = app.returnQueryParsed(queryString);

    // save the state,
    app.saveStateWithCallback(null, "savePaginationState");
}


app.addBlankNft = async () => {
    return new Promise(async (resolve, reject) => {
        // get a blank asset object
        let newAsset = await app.getNewAsset();

        // console.log("[ addBlankNft ] newAsset: ", newAsset);

        // save as a new record
        let newId = await app.db.assets.add(newAsset);

        // redraw
        // app.loadCurrentCollection("addBlankNft");

        resolve(newId);
    })
}


app.getNewAsset = () => {

    return new Promise(async (resolve, reject) => {
        const dbCount = await app.db.assets
            .where('collectionId')
            .equals(app.state.collection.currentId)
            .count();

        // return value
        resolve({
            collectionId: app.state.collection.currentId, // filePath: "",
            group: "", index: dbCount + 1, importedBuildData: false, metadata: {
                buildData: {
                    isMinted: false, sourceFiles: [],
                }
            }, // name: "New NFT",
            searchTerms: "", state: "todo"
        });

    });
}


app.paginationTemplate = `
<ul class="pagination">
    <li class="page-item">
        <a id="prevPageId" class="page-link" href="#" aria-label="Previous"><span aria-hidden="true">&laquo;</span></a>
    </li>
    PAGE_BUTTONS
    <li class="page-item">
        <a id="nextPageId" class="page-link next-page" href="#" aria-label="Next"><span aria-hidden="true">&raquo;</span></a>
    </li>
</ul>`;

app.paginationItemTemplate = `<li class="page-item"><a class="page-link ACTIVE_CLASS" href="HREF">PAGE</a></li>`;

app.itemsPerPageMenuTemplate = `<select class="form-select form-select-sm" id="itemsPerPageId">OPTIONS</select>`;

app.itemsPerPageMenuItemTemplate = `<option value="AMOUNT" SELECTED>AMOUNT</option>`;


app.gridItemTemplate = `
<div data-id="GRID_ITEM_ID" data-index="GRID_ITEM_INDEX" class="collection-item element-item card shadow-sm noselect GRID_ITEM_CLASS">

    <div class="grid-image-container">
        <img data-index="GRID_ITEM_INDEX" src="/img/placeholder_image.svg" crossorigin="anonymous" class="grid-image" alt="" style="width:100%;height:100%" loading="lazy">
    </div>

    <div class="card-body">
        <div class="grid-item-ui pt-1 d-flex justify-content-between align-items-center">
            <div><small class="itemIndex">GRID_ITEM_INDEX</small></div>
            GRID_ITEM_RARITY
            <div><small class="itemState">GRID_ITEM_STATE</small></div>
        </div>
        <p class="card-text itemTitle">GRID_ITEM_TITLE</p>
    </div>
    
    <input class="form-check-input itemCheckbox" type="checkbox">
    
</div>`;


app.fileScanResultItemTemplate = `
<tr class="fileScanResultItem" data-order="DATAORDER" data-filetype="DATAFILETYPE">
    <td>
        <svg class="bi fill-current-color pe-none" width="24" height="24">
            <use xlink:href="#ICON"></use>
        </svg>
        <span class="fileScanResultItemLabel">&nbsp;LABEL</span>
    </td>
    <td>COUNT</td>
    <td>     
         <select class="assetActionMenu form-select form-select-sm HIDDEN" aria-label="Sort" data-filetype="DATAFILETYPE">
            <option value="ignore">Ignore</option>
            <option value="scan" selected>Scan</option>
            <option value="import" >Import</option>
            <option value="convert">Convert</option>
        </select>
    </td>

</tr>`;


app.fileScanResultItemImportModeTemplate = `
<tr class="fileScanResultItem" data-order="DATAORDER" data-filetype="DATAFILETYPE">
    <td>
        <svg class="bi fill-current-color pe-none" width="24" height="24">
            <use xlink:href="#ICON"></use>
        </svg>
        <span class="fileScanResultItemLabel">&nbsp;LABEL</span>
    </td>
    <td>COUNT</td>
    <td>     
         <select class="assetActionMenu form-select form-select-sm HIDDEN" aria-label="Sort" data-filetype="DATAFILETYPE">
            <option value="ignore">Ignore</option>
            <option value="scan" >Scan</option>
            <option value="import" selected>Import</option>
            <option value="convert">Convert</option>
        </select>
    </td>

</tr>`;

app.fileScanResultItemNoImportTemplate = `
<tr class="fileScanResultItem" data-order="DATAORDER" data-filetype="DATAFILETYPE">
    <td>
        <svg class="bi fill-current-color pe-none" width="24" height="24">
            <use xlink:href="#ICON"></use>
        </svg>
        <span class="fileScanResultItemLabel">&nbsp;LABEL</span>
    </td>
    <td>COUNT</td>
    <td>     
         <select class="assetActionMenu form-select form-select-sm HIDDEN" aria-label="Sort" data-filetype="DATAFILETYPE">
            <option value="ignore">Ignore</option>
            <option value="scan" selected>Scan</option>
        </select>
    </td>

</tr>`;

app.autoFillFileItemTemplate = `
<tr class="autoFillFileItem" data-order="DATAORDER" data-filetype="DATAFILETYPE" data-subgroup="DATASUBGROUP">
    <td>
        <svg class="bi buttonSvg" width="24" height="24">
            <use xlink:href="#ICON"></use>
        </svg>
        <span class="fileLabelOffset">LABEL</span>
    </td>
    <td>
        <input class="autoFillMainAssetOption form-check-input" type="radio" name="autoFillMainAssetOption" MAIN_ISCHECKED>
    </td>
    <td>
        <input class="autoFillThumbnailOption form-check-input" type="checkbox" value="" THUMB_ISCHECKED>
    </td>
    <td>
        <input class="autoFillLinkOption form-check-input" type="checkbox" value="" LINK_ISCHECKED>
    </td>
   
</tr>`;

app.nftEditorFileRowTemplate = `
<tr>
    <td>TYPE</td><td class="limitFilenameWidth">FILENAME</td><td>VALID<br>UPLOADED</td><td>USAGE</td>
    <td>
        <button data-index="INDEX" type="button" data-id="6" class="btn btn-outline-primary btn-sm fileItemDeleteButton" data-bs-toggle="modal" data-bs-target="#confirmDeleteFile"
         style="--bs-btn-padding-y: .15rem; --bs-btn-padding-x: .5rem; --bs-btn-font-size: .75rem;">x</button>
    </td>
</tr>`;


app.collectionEditorTraitRowTemplate = `
<tr>
    <td><div onclick="app.doFilter('FILTER')">NAME</div></td><td><h5><span class="badge text-bg-light">COUNT</span></h5></td><td><h5><span class="badge text-bg-secondary">RARITY</span></h5></td>
</tr>`;


app.collectionEditorTraitAccordianItemTemplate = `
<div class="accordion-item">
    <h2 class="accordion-header" id="panelsStayOpen-headingINDEX">
        <button class="accordion-button  ACCORDIAN_HEADER_COLLAPSED_CLASS" type="button" data-bs-toggle="collapse" data-bs-target="#panelsStayOpen-collapseINDEX" aria-expanded="ACCORDIAN_HEADER_EXPANDED" aria-controls="panelsStayOpen-collapseINDEX">
            <span class="traitName" onclick="app.doFilter('FILTER')">NAME</span>
            <span class="badge text-bg-light ms-3">COUNT</span> <span class="badge text-bg-secondary ms-3">RARITY</span>
        </button>
    </h2>
    <div id="panelsStayOpen-collapseINDEX" class="accordion-collapse collapse ACCORDIAN_ITEM_COLLAPSED_CLASS" aria-labelledby="panelsStayOpen-headingINDEX">
        <div class="accordion-body">

            <table class="table table-striped">
                <thead><tr><th>Name</th><th>Count</th><th>Rarity</th></tr></thead>
                <tbody>TRAITROWS</tbody>
            </table>

        </div>
    </div>
</div>`;


/*app.nftEditorFileRowTemplate = `
<tr>
    <td>
        <input type="text" class="form-control nftEditorFileNumber" placeholder="NUMBER">
    </td>
    <td>TYPE</td><td>FILENAME</td><td>READY</td><td>UPLOADED</td>
</tr>`;*/

app.formatSizeUnits = bytes => {
    if ((bytes >> 30) & 0x3FF) bytes = (bytes >>> 30) + '.' + (bytes & (3 * 0x3FF)) + ' GB'; else if ((bytes >> 20) & 0x3FF) bytes = (bytes >>> 20) + '.' + (bytes & (2 * 0x3FF)) + ' MB'; else if ((bytes >> 10) & 0x3FF) bytes = (bytes >>> 10) + '.' + (bytes & (0x3FF)) + ' KB'; else if ((bytes >> 1) & 0x3FF) bytes = (bytes >>> 1) + ' Bytes'; else bytes = bytes + ' Byte';
    return bytes;
}
$(document).ready(() => {
    app.initCollectionView();
});