// namespace
if (typeof app === `undefined`) app = {};

app.loadSnapshotFile = function (file) {
    // Check if the file is a json file.
    if (file.type && !file.type.endsWith('json')) {
        // console.log('File is not an json file.', file.type, file);
        return;
    }

    // read the json
    const reader = new FileReader();

    reader.addEventListener("load", () => {
        app.loadedSnapshotJSON = JSON.parse(reader.result);
        app.loadSnapshotData(app.loadedSnapshotJSON);
    });

    if (file) reader.readAsText(file);
}

//
// Loads JSON into the defaults
//
app.loadDefaultFile = function (file) {

    // Check if the file is a json file.
    if (!file || file.type && !file.type.endsWith('json')) {
        // console.log('File is not an json file.', file.type, file);
        return;
    }

    // read the json
    const reader = new FileReader();
    reader.addEventListener("load", async () => {
        // console.log('[ loadDefaultFile ]', reader.result);
        app.state.collection.userData = JSON.parse(reader.result);
        await app.saveCurrentCollectionReportToDb();
        app.copyDataToForm(app.state.collection.userData, "loadDefaultFile");
        // app.copyFormToData(app.state.collection.userData);
        await app.saveState();
    });
    if (file) reader.readAsText(file);
}

app.loadNftFile = function (file) {
    // Check if the file is a json file.
    if (file.type && !file.type.endsWith('json')) {
        // console.log('File is not an json file.', file.type, file);
        return;
    }

    // read the json
    const reader = new FileReader();

    reader.addEventListener("load", () => {
        app.loadedNftJSON = JSON.parse(reader.result);
        // console.log("app.loadNftFile");
        console.log(app.loadedNftJSON);
        app.loadNftData(app.loadedNftJSON);
    });

    if (file) reader.readAsText(file);
}

app.loadSnapshotData = function (data) {

    if (data.nftName === undefined) {
        alert(app.dict[app.lang].snapshotDataNotCompatible);
        return;
    }

    app.userData = data;
    app.updateAppWithNewUserData();
}

app.loadNftData = function (data) {

    // NFT datasets should have a description, at least (name is too common)
    if (data.description === undefined || !data.description) {
        alert(app.dict[app.lang].nftDataNotCompatible);
        return;
    }

    app.copyNftMetadataToUserData(data, app.userData);
    app.updateAppWithNewUserData();
}
