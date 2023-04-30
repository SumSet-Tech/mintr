// namespace
if (typeof app === `undefined`) app = {};
if (typeof app.state === `undefined`) app.state = {};
if (typeof app.state.collection === `undefined`) app.state.collection = {};

if (typeof app.queue === `undefined`) app.queue = {};
if (typeof app.queue.actions === `undefined`) app.queue.actions = [];


app.initQueue = function () {
    app.clearQueue();
}

app.clearQueue = function () {
    // console.log(`[ clearQueue ] len before: ${app.queue.actions.length}`);
    app.queue.actions = [];
    app.queue.actions.length = 0;
    app.queue.counts = {};
}


app.updateQueueBadge = () => {

    if (!app.$queueBadgeId) app.$queueBadgeId = $("#queueBadgeId");
    if (!app.queue.counts.total) {
        app.$queueBadgeId.addClass("hidden");
        return;
    }
    if ((!app.queue.counts && !app.queue.counts.total) || (app.queue.counts.total.added - app.queue.counts.total.done === 0)) {
        app.$queueBadgeId.addClass("hidden");
    } else {
        app.$queueBadgeId.removeClass("hidden");
    }

    let summaryText = "";
    for (const countsKey in app.queue.counts) {
        // console.log(">>>>>>>>>>>>>>>>>>>> ", app.queue.counts[countsKey]);
        summaryText += "<b>" + countsKey + ":</b> " + app.queue.counts[countsKey].done + " / " + app.queue.counts[countsKey].added + '<br>';
    }
    masterQueueDetailsId.innerHTML = summaryText;


    queueBadgeId.innerHTML = app.queue.counts.total.added - app.queue.counts.total.done;

    masterQueueBadgeId.innerHTML = !app.queue.counts.total ? "0 / 0" : app.queue.counts.total.done + " / " + app.queue.counts.total.added;

    buildFileImporterBadgeId.innerHTML = !app.queue.counts.loadJsonBuildData ? "0 / 0" : app.queue.counts.loadJsonBuildData.done + " / " + app.queue.counts.loadJsonBuildData.added;

    fileProcessorBadgeId.innerHTML = !app.queue.counts.doProcessActionForFile ? "0 / 0" : app.queue.counts.doProcessActionForFile.done + " / " + app.queue.counts.doProcessActionForFile.added;

    let uploadDone = 0;
    let uploadAdded = 0;
    if (app.queue.counts.uploadSourceFile) {
        uploadDone += app.queue.counts.uploadSourceFile.done;
        uploadAdded += app.queue.counts.uploadSourceFile.added;
    }
    if (app.queue.counts.uploadMetadata) {
        uploadDone += app.queue.counts.uploadMetadata.done;
        uploadAdded += app.queue.counts.uploadMetadata.added;
    }

    uploaderBadgeId.innerHTML = !uploadAdded ? "0 / 0" : uploadDone + " / " + uploadAdded;

}

app.addToQueue = queueAction => {

    app.addQueueActionToAddedCount(queueAction);

    // console.log(`[ addToQueue ] actions count: ${app.queue.actions.length} action: ${queueAction.action}`,
    //     queueAction, app.queue.counts);

    app.queue.actions.push(queueAction);
}

app.addQueueActionToAddedCount = (queueAction) => {

    if (!app.queue.counts) app.queue.counts = {};
    if (!app.queue.counts.total) app.queue.counts.total = {added: 0, done: 0};

    if (!app.queue.counts[queueAction.action]) app.queue.counts[queueAction.action] = {
        added: 0, done: 0
    };

    app.queue.counts[queueAction.action].added++;
    app.queue.counts.total.added++;

    app.updateQueueBadge();
}

app.addQueueActionToDoneCount = (queueAction) => {

    if (!app.queue.counts) app.queue.counts = {};

    if (!app.queue.counts[queueAction.action]) app.queue.counts[queueAction.action] = {
        added: 0, done: 0
    };

    app.queue.counts.total.done++;
    app.queue.counts[queueAction.action].done++;
    app.updateQueueBadge();
}

app.getIndexOfNextInQueue = () => {

    // find next, at lowest priority
    for (let priority = 1; priority < 100; priority++) {
        for (let actionIndex = 0; actionIndex < app.queue.actions.length; actionIndex++) {
            if (app.queue.actions[actionIndex].priority === priority) return actionIndex;
        }
    }
    return -1;
}

app.doNextInQueue = () => {

    // console.log(`[ doNextInQueue ] CALLED len: ${app.queue.actions.length} action: ${app.queue.currentAction} `);
    if (app.queueActionActive) return;

    if (app.queue.actions.length < 1) {
        app.queueStateIsBusy(false);
        app.doQueueDone();
        app.updateQueueBadge();
        return;
    }

    app.queueStateIsBusy(true);
    app.queueActionActive = true;

    let indexToUse = app.getIndexOfNextInQueue();
    if (indexToUse > -1) { // only splice array when item is found
        let items = app.queue.actions.splice(indexToUse, 1); // 2nd parameter means remove one item only
        app.queue.currentAction = items[0];
    } else {
        app.queue.currentAction = app.queue.actions.shift();
    }


    // console.log(`[ doNextInQueue ] len: ${app.queue.actions.length} - action: ${app.queue.currentAction.action} `, app.queue.currentAction);

    switch (app.queue.currentAction.action) {
        case "loadJsonBuildData":
            app.loadJsonBuildData(app.queue.currentAction.file, app.queue.currentAction.index, app.queue.currentAction.asset, app.queueActionComplete);
            break;
        case "assignToGroup":
            app.assignToGroup(app.queue.currentAction.file, app.queueActionComplete);
            break;
        case "addGenericFile":
            app.addGenericFile(app.queue.currentAction, app.queueActionComplete);
            break;
        case "doProcessActionForFile":
            // app.doProcessActionForFile(app.queue.currentAction.fileFound, app.queue.currentAction.dbIndexToUpdate, app.queue.currentAction.metadata, app.queue.currentAction.sourceFileIndex, app.queueActionComplete);
            app.doProcessActionForFile(app.queue.currentAction, app.queueActionComplete);
            break;
        case "saveRarityToAssetInDb":
            app.saveRarityToAssetInDb(app.queue.currentAction.asset, app.queueActionComplete);
            break;
        case "autofill":
            app.doAutoFill(app.queue.currentAction, app.queueActionComplete);
            break;
        case "uploadAll":
            app.uploadAll(app.queue.currentAction.asset, app.queueActionComplete);
            break;
        case "uploadSourceFile":
            app.uploadSourceFile(app.queue.currentAction.sourceFile, app.queue.currentAction.asset, app.queue.currentAction.options, app.queueActionComplete);
            break;
        case "uploadMetadata":
            app.uploadMetadata(app.queue.currentAction.asset, app.queueActionComplete);
            break;
        case "addToMintBatch":
            app.addToMintBatch(app.queue.currentAction.asset, app.queue.currentAction.options, app.queueActionComplete);
            break;
        case "uploadAllSourceFiles":
            app.uploadAllSourceFiles(app.queue.currentAction.asset, app.queueActionComplete);
            break;
        case "addNftIdList":
            app.addNftIdList(app.queue.currentAction.file, app.queueActionComplete);
            break;
    }
}

app.queueActionComplete = () => {
    // console.log("QUEUE ACTION COMPLETE. CALLING DO NEXT");

    app.addQueueActionToDoneCount(app.queue.currentAction);
    app.queueActionActive = false;

    // console.log("[ queueActionComplete ] app.queue.counts ", app.queue.counts);

    if (app.addFilesToDBCatalogProcessedBuildFilesStarted
        && !app.addFilesToDBCatalogProcessedBuildFilesDone
        && (!app.queue.counts.loadJsonBuildData || (app.addFilesToDBCatalogJsonFilesToProcessCount === app.queue.counts.loadJsonBuildData.done))) {
        // console.log("=============================================================== JSON SCAN DONE!");
        app.doFinishAddingBuildFiles();
    }
    if (app.addFilesToDBCatalogProcessedBuildFilesStarted
        && app.addFilesToDBCatalogProcessedBuildFilesDone
        && (app.assignToGroupTotal === app.assignToGroupCount)
        && !app.addFilesToDBCatalogProcessedGenericFilesStarted
    ) {

        app.addFilesToDBCatalogProcessedGenericFilesStarted = true;
        // console.log("=============================================================== GROUP FILE SCAN DONE!");
        app.doFinishAddingGroupedFiles();
    }
    if (app.addFilesToDBCatalogProcessedGenericFilesStarted
        && app.addFilesToDBCatalogProcessedGenericFilesDone !== true
        && (!app.queue.counts.addGenericFile || (app.queue.counts.addGenericFile.added === app.queue.counts.addGenericFile.done))) {
        // console.log("=============================================================== GENERIC FILE SCAN DONE");
        app.addFilesToDBCatalogProcessedGenericFilesDone = true;

    }

    app.doNextInQueue();
}

app.doFinishAddingBuildFiles = () => {
    app.addFilesToDBCatalogProcessedBuildFilesDone = true;
    app.doAddFilesToDBCatalogUsingGrouping();
}


app.doFinishAddingGroupedFiles = async () => {
    app.doAddNftIdListToDb();
    app.doAddGenericFilesToDBCatalog();
}

app.doAddNftIdListToDb = () => {

    app.state.collection.allTextFiles = app.getFileDataJson(app.currentFilesScan, "text", true);
    // console.log("[ doAddNftIdListToDb ]: ", app.state.collection.allTextFiles);

    for (const file of app.state.collection.allTextFiles) {
        app.addToQueue({
            priority: 2, // before generic files are added
            action: "addNftIdList",
            file: file
        });
    }

    app.doNextInQueue();

}


app.queueStateIsBusy = isBusy => {
    if (!app.$queueEmptyIconId) app.$queueEmptyIconId = $("#queueEmptyIconId");
    if (!app.$queueBusyIconId) app.$queueBusyIconId = $("#queueBusyIconId");
    if (isBusy) {
        if (app.$queueEmptyIconId) app.$queueEmptyIconId.addClass("visually-hidden");
        if (app.$queueBusyIconId) app.$queueBusyIconId.removeClass("visually-hidden");
    } else {
        if (app.$queueEmptyIconId) app.$queueEmptyIconId.removeClass("visually-hidden");
        if (app.$queueBusyIconId) app.$queueBusyIconId.addClass("visually-hidden");
    }
}

app.doQueueStart = () => {
    // console.log("QUEUE START");
}

app.doQueueDone = function () {

    if (app.refreshCatalogNeeded) {
        app.refreshCatalogNeeded = false;
        app.loadCurrentCollection("doQueueDone");
        app.drawPanel();
    }
}

// app.initQueue();
