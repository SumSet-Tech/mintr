// namespace
if (typeof app === `undefined`) app = {};
if (typeof app.state === `undefined`) app.state = {};
if (typeof app.state.mintBatch === `undefined`) app.state.mintBatch = {};
if (typeof app.state.mintBatch.options === `undefined`) app.state.mintBatch.options = {};


// takes an asset and looks for the Main file and updates the source file references
app.updateMainAssetDetails = (assetData) => {
    for (const key in assetData.metadata.buildData.sourceFiles) {
        if (assetData.metadata.buildData.sourceFiles[key].isMain === true) {
            assetData.metadata.mainFileUrl = assetData.metadata.buildData.sourceFiles[key].ipfs;
            assetData.metadata.assetHash = assetData.metadata.buildData.sourceFiles[key].hash;
            assetData.metadata.metadataHash = assetData.metadata.buildData.sourceFiles[key].hash;
        }
    }
}

app.doDownloadBatchMintCsv = () => {

    // console.log("[ doDownloadBatchMintCsv ] batchId: " + app.currentBatchId);

    if (!app.currentBatchId) return;

    let csvText = "hash,uris,meta_hash,meta_uris,license_hash,license_uris,edition_number,edition_total";

    app.db.open().then(function () {

        return app.db.batches
            .where('id')
            .equals(app.currentBatchId)
            .toArray();

    }).then(async assets => {

        const assetIndexes = assets[0].assetIndexes;
        let csvLine = "";
        for (const key in assetIndexes) {


            // console.log("[ doDownloadBatchMintCsv ] : " + assetIndexes[key]);
            let assetData = await app.getAssetDataWithIndex(assetIndexes[key]);

            // app.updateMainAssetDetails(assetData);
            // console.log("[ doDownloadBatchMintCsv ]  name: ", assetData.name, assetData);

            if (!assetData.metadata.licenses || !assetData.metadata.licenses[0]) {
                // console.log("[ updateBatchMintCsv ]  MISSING LICENSE: name: ", assetData.name + " - mainFileUrl: " + assetData.metadata.mainFileUrl);
                continue;
            }

            csvLine = "";
            csvLine += assetData.metadata.assetHash + ",";
            csvLine += assetData.metadata.mainFileUrl + ",";
            csvLine += assetData.metadata.metadataHash + ",";
            csvLine += assetData.metadata.metadataUrl + ",";
            csvLine += assetData.metadata.licenseHash + ",";
            csvLine += assetData.metadata.licenses[0].url + ",";
            csvLine += assetData.metadata.collectionEditionNumber + ",";
            csvLine += assetData.metadata.collectionEditionTotal;

            csvText += '\n' + csvLine;
        }

        // console.log("[ doDownloadBatchMintCsv ] ", csvText);


        const blob = new Blob([csvText], {type: 'text/csv'});
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.setAttribute('href', url)
        a.setAttribute('download', app.state.mintBatch.options.metadataFileName);
        a.click()
        document.body.removeChild(a);

        // console.log("[ doDownloadBatchMintCsv ] csvText: ", csvText);
    }).catch(Dexie.MissingAPIError, function () {
        console.log("Couldn't find indexedDB API");
    });

}

app.doAlert = text => {
    alert(text);
}


app.updateBatchMintCsv = (batchId) => {

    return new Promise((resolve, reject) => {

        console.log("[ updateBatchMintCsv ] batchId: " + batchId);

        if (!batchId) return;

        let csvText = "hash,uris,meta_hash,meta_uris,license_hash,license_uris,edition_number,edition_total\n";

        app.db.open().then(function () {

            return app.db.batches
                .where('id')
                .equals(batchId)
                .toArray();

        }).then(async batches => {
            const assetIndexes = batches[0].assetIndexes;
            console.log("[ updateBatchMintCsv ] assetIndexes: ", assetIndexes);
            let csvLine = "";
            for (const key in assetIndexes) {

                let assetData = await app.getAssetDataWithIndex(assetIndexes[key]);

                if (!assetData) {
                    console.log("[ updateBatchMintCsv ] ABORTED - NO ASSET DATA FOUND FOR: ", assetIndexes[key]);
                    continue;
                }

                // console.log("[ updateBatchMintCsv ]  name: ", assetData.name + " - assetData: ", assetData);

                app.$mintBatchBulkMintingWarningId = app.$mintBatchBulkMintingWarningId || $('#mintBatchBulkMintingWarningId');

                if (!assetData.metadata.licenses || !assetData.metadata.licenses[0]) {
                    // console.log("[ updateBatchMintCsv ]  MISSING LICENSE: name: ", assetData.name + " - mainFileUrl: " + assetData.metadata.mainFileUrl);
                    mintBatchBulkMintingWarningTextId.innerHTML = "A license is needed for Bulk Minting. Make sure you have added a license in the Collection Editor, and then rerun Update Metadata.";
                    app.$mintBatchBulkMintingWarningId.removeClass("hidden");
                    break;
                }

                if (!assetData.metadata.mainFileUrl || !assetData.metadata.metadataHash) {
                    console.log("[ updateBatchMintCsv ] main file: name: ", assetData.name + " - mainFileUrl: " + assetData.metadata.mainFileUrl + " - hash: " + assetData.metadata.metadataHash);
                    mintBatchBulkMintingWarningTextId.innerHTML = "Some assets are not uploaded yet. Make sure you have uploaded the files to IPFS first.";
                    app.$mintBatchBulkMintingWarningId.removeClass("hidden");
                    break;
                }

                app.$mintBatchBulkMintingWarningId.addClass("hidden");


                if (!assetData.metadata.collectionEditionNumber) assetData.metadata.collectionEditionNumber = 1;
                csvLine = "";
                csvLine += assetData.metadata.assetHash + ",";
                csvLine += assetData.metadata.mainFileUrl + ",";
                csvLine += assetData.metadata.metadataHash + ",";
                csvLine += assetData.metadata.metadataUrl + ",";
                csvLine += assetData.metadata.licenseHash + ",";
                csvLine += assetData.metadata.licenses[0].url + ",";
                csvLine += (assetData.metadata.collectionEditionNumber) + ",";
                csvLine += (assetData.metadata.collectionEditionTotal || assetData.metadata.collectionEditionNumber);

                csvText += csvLine + "\n";
            }

            resolve(csvText);

            // console.log("[ updateBatchMintCsv ] csvText: ", csvText);
        }).catch(Dexie.MissingAPIError, function () {
            console.log("Couldn't find indexedDB API");
        });

    });

}


app.updateMintCommand = () => {
    app.drawMintBatchOptions("updateMintCommand");
}


app.drawMintBatchOptions = async (whoCalledMe = "") => {

    if (!app.currentBatchId) return;

    console.log("[ drawMintBatchOptions ] whoCalledMe: " + whoCalledMe + " - app.state.mintBatch.options: ", app.state.mintBatch.options);


    app.db.open().then(function () {

        return app.db.batches
            .where("id")
            .equals(parseInt(app.currentBatchId))
            .toArray();

    }).then(async batches => {
        let batch = batches[0];

        if (!app.state.mintBatch) app.state.mintBatch = {};
        app.state.mintBatch.options = batch.options;
        app.state.mintBatch.options.offerAmountInMojo = app.state.mintBatch.options.offerAmountInMojo || 10000;
        app.state.mintBatch.options.metadataFileName = app.state.mintBatch.options.metadataFileName || "bulkmint_metadata.csv";
        app.state.mintBatch.options.pathToFile = app.state.mintBatch.options.pathToFile || "~/Downloads/";


        // create offers
        app.state.mintBatch.options.offerRoyalty = app.state.mintBatch.options.offerRoyalty || 0;


        let newDate = new Date();
        newDate.setTime(batch.dateCreated);
        let dateString = newDate.toUTCString();


        // listen to form for changes
        $('#batchProcessorMintBatchContentId .listenForChangeOfMode').change(function () {
            app.mintBatchFormToOptions();
        });

        // listen to button clicks
        $('#mintBatchDownloadBulkMintingCsvId').click(function () {
            app.doDownloadBatchMintCsv();
        });
        $('#copyBulkMintCommandButtonId').click(function () {
            app.doCopyBulkMintCommand();
        });
        $('#copyBulkMintSubmitCommandButtonId').click(function () {
            app.doCopyBulkMintSubmitCommand();
        });

        // console.log("[ app.drawMintBatchOptions ] drawMintBatchOptions: " + app.state.mintBatch.options.mode);

        app.formIsDirty = true;
        if (app.state.mintBatch.options.mode === "singles") {

            if (!app.state.mintBatch.createSinglesHtmlWritten || app.formIsDirty) {
                app.state.mintBatch.createSinglesHtmlWritten = true;

                mintBatchBulkMintingId.classList.add("hidden");
                mintBatchOneAtATimeId.classList.remove("hidden");
                createOffersId.classList.add("hidden");
                $("#mintingMode2Id").prop('checked', true);

                await app.updateSinglesScript(app.currentBatchId);

            }

        } else if (app.state.mintBatch.options.mode === "bulk") {

            // show singles mode UI
            mintBatchBulkMintingId.classList.remove("hidden");
            mintBatchOneAtATimeId.classList.add("hidden");
            createOffersId.classList.add("hidden");
            $("#mintingMode1Id").prop('checked', true);

        } else {

            if (!app.state.mintBatch.createOffersScript || app.formIsDirty) {
                // show create offers UI
                createOffersId.classList.remove("hidden");
                mintBatchBulkMintingId.classList.add("hidden");
                mintBatchOneAtATimeId.classList.add("hidden");
                $("#mintingMode3Id").prop('checked', true);

                app.state.mintBatch.createOffersScript = await app.getOffersScript(app.currentBatchId);
            }

            createOffersScriptTextId.innerHTML = app.state.mintBatch.createOffersScript;
        }

        if (app.state.mintBatch.options.mode === "bulk") {
            app.state.mintBatch.bulkMintCsv = await app.updateBatchMintCsv(app.currentBatchId);
            bulkMintCsvTextId.innerHTML = app.state.mintBatch.bulkMintCsv;
        }


        // make .pkl filename from csv filename
        let pklFilename = app.state.mintBatch.options.metadataFileName.replace('csv', 'pkl');

        app.state.mintBatch.bulkMintCommand =
            "chianft create-mint-spend-bundles"
            + " -w " + app.state.collection.userData.walletId
            + " -a " + app.state.mintBatch.options.royaltyAddress
            + " -r " + parseInt(app.state.mintBatch.options.royalty)
            + " -d True " + app.state.mintBatch.options.pathToFile + app.state.mintBatch.options.metadataFileName
            + " " + app.state.mintBatch.options.pathToFile + pklFilename;

        bulkMintCommandId.innerHTML = app.state.mintBatch.bulkMintCommand;

        app.state.mintBatch.bulkMintSubmitCommand = "chianft submit-spend-bundles -m 10 -o " + app.state.mintBatch.options.offerAmountInMojo + " " + app.state.mintBatch.options.pathToFile + pklFilename;
        bulkMintSubmitCommandId.innerHTML = app.state.mintBatch.bulkMintSubmitCommand;

        // console.log("[ app.state.mintBatch.options ] batch: ", batch);

        currentBatchCreatedDateId.innerHTML = dateString;
        offerAmountInMojoId.value = app.state.mintBatch.options.offerAmountInMojo;

        // create offers
        createOffersFingerprintId.value = app.state.mintBatch.options.offerWalletFingerprint || app.state.collection.userData.walletFingerprint || "";
        createOffersTokenPriceId.value = app.state.mintBatch.options.offerTokenPrice || 1;
        createOffersTokenWalletIdId.value = app.state.mintBatch.options.offerTokenWalletId || app.state.collection.userData.walletId || "";
        createOffersRoyaltyId.value = app.state.mintBatch.options.offerRoyalty;


        currentBatchCreatedCountId.innerHTML = batch.assetIndexes.length;

        if ($("#mintBatchNameId").length > 0)
            mintBatchNameId.value = batch.options.name || "untitled";

        if ($("#mintBatchRoyaltyPercentId").length > 0)
            mintBatchRoyaltyPercentId.value = batch.options.royalty * .01;

        if ($("#localFolderId").length > 0)
            localFolderId.value = batch.options.pathToFile;

        if ($("#bulkMintCsvFilenameId").length > 0)
            bulkMintCsvFilenameId.value = batch.options.metadataFileName;

        if ($("#mintBatchRoyaltyAddressId").length > 0)
            mintBatchRoyaltyAddressId.value = batch.options.royaltyAddress;

    });
}


app.singlesItemTemplate =
    `<li class="list-group-item d-flex justify-content-between align-items-start">

        <div class="col">

            <div class="fw-bold">TITLE</div>

            <form class="row g-3">
                <div class="col">
                    <label for="commandRpcINDEXId"
                           class="visually-hidden">RPC Call</label>
                    <input class="form-control"
                           id="commandRpcINDEXId"
                           placeholder="RPC Call">
                </div>
                <div class="col-auto">
                    <button type="button" data-index="INDEX"
                            class="btn btn-primary mb-3"
                            data-bs-toggle="button"
                            onclick="app.doCopySingleScript(INDEX)">Copy
                    </button>
                </div>
            </form>

        </div>

    </li>


`;


app.doCopySingleScript = (index) => {
    console.log("[ doCopySingleScript ] index: " + index);
    navigator.clipboard.writeText(app.singlesScriptItems[index].call);
}

app.updateSinglesScript = (batchId) => {

    return new Promise(async (resolve, reject) => {

        console.log("[ getSinglesScript ] batchId: " + batchId);

        if (!batchId) {
            resolve("");
            return;
        }

        app.singlesScriptItems = [];

        let scriptText = "";
        let batches = await app.db.batches
            .where('id')
            .equals(batchId)
            .toArray();

        const assetIndexes = batches[0].assetIndexes;
        console.log("[ getSinglesScript ] assetIndexes: ", assetIndexes);

        let index = 0;
        for (const key in assetIndexes) {

            let assetData = await app.getAssetDataWithIndex(assetIndexes[key]);
            if (!assetData) {
                console.log("[ getSinglesScript ] ABORTED - NO ASSET DATA FOUND FOR: ", assetIndexes[key]);
                continue;
            }

            if (!assetData.metadata) {
                console.log("[ getSinglesScript ]  MISSING metadat: ", assetData.name);
                resolve(scriptText);
                return;
            }

            let rpcCall = app.getRpcCommand(assetData.metadata);
            app.singlesScriptItems.push({
                index: index,
                call: rpcCall
            });

            console.log(`[ getSinglesScript ] ${index} -  name: `, assetData.name + " - rpcCall: ", rpcCall);

            let template = app.singlesItemTemplate;
            template = template.replace(/TITLE/g, assetData.name);
            template = template.replace(/INDEX/g, index);
            scriptText += template

            index++;
        }


        oneAtATimeScriptsId.innerHTML = scriptText;
        for (let i = 0; i < app.singlesScriptItems.length; i++) {
            $("#commandRpc" + app.singlesScriptItems[i].index + "Id").val(app.singlesScriptItems[i].call);
        }
        resolve();


    });

}


app.getOffersScript = (batchId) => {

    return new Promise(async (resolve, reject) => {

        console.log("[ getOffersScript ] batchId: " + batchId);

        if (!batchId) return;

        let scriptText = "# Paste this into your CLI\n";
        scriptText += "mkdir ~/Desktop/offers\n";

        // app.db.open().then(function () {

        let batches = await app.db.batches
            .where('id')
            .equals(batchId)
            .toArray();

        // }).then(async batches => {
        const assetIndexes = batches[0].assetIndexes;
        console.log("[ getOffersScript ] assetIndexes: ", assetIndexes);
        let offerCount = 1;
        let csvLine = "";
        for (const key in assetIndexes) {

            let assetData = await app.getAssetDataWithIndex(assetIndexes[key]);

            if (!assetData) {
                console.log("[ getOffersScript ] ABORTED - NO ASSET DATA FOUND FOR: ", assetIndexes[key]);
                continue;
            }

            console.log("[ getOffersScript ]  MISSING NFT ID: name: ", assetData.name);
            app.$createOffersWarningId = app.$createOffersWarningId || $("#createOffersWarningId");
            if (!assetData.metadata || !assetData.metadata.nftId) {
                console.log("[ getOffersScript ]  MISSING NFT ID: name: ", assetData.name);
                // app.doAlert("Offers require minted NFTs. There is at least one un-minted item in this batch.");
                createOffersWarningTextId.innerHTML = "Either some items in this batch need to be minted first, or you need to sync your wallet to update the collection."
                app.$createOffersWarningId.removeClass("hidden");
                resolve(scriptText);
                return;
            }
            app.$createOffersWarningId.addClass("hidden");

            console.log(`[ getOffersScript ] ${offerCount} -  name: `, assetData.name + " - assetData: ", assetData);
            if (assetData.metadata.nftId && assetData.metadata.nftId !== "") {
                scriptText += `yes | chia wallet make_offer -f ${app.state.mintBatch.options.offerWalletFingerprint} -o ${assetData.metadata.nftId}:1 -r ${app.state.mintBatch.options.offerTokenWalletId}:${app.state.mintBatch.options.offerTokenPrice} -p ~/Desktop/offers/offer${offerCount++} && sleep 0.5\n`;
            }

            // TODO - MAKE THIS A PROPER OPTION FOR SETTING THE DID OF AN NFT
            /*if (assetData.metadata.coinId && assetData.metadata.coinId !== "") {

                scriptText += `echo Coin ID: ${assetData.metadata.coinId} \n`;
                scriptText += `chia wallet nft set_did -f ${app.state.mintBatch.options.offerWalletFingerprint} -i ${app.state.mintBatch.options.offerTokenWalletId} -di ${gwDid} -ni ${assetData.metadata.coinId} -m 0.000000000001 && sleep 210\n`; // 3.5 mins of sleep!
            }*/
        }

        resolve(scriptText);


        // console.log("[ updateBatchMintCsv ] csvText: ", csvText);
        // }).catch(Dexie.MissingAPIError, function () {
        //     console.log("Couldn't find indexedDB API");
        // });

    });

}


app.doCopyBulkMintCommand = () => {
    navigator.clipboard.writeText(app.state.mintBatch.bulkMintCommand);
}
app.doCopyBulkMintSubmitCommand = () => {
    navigator.clipboard.writeText(app.state.mintBatch.bulkMintSubmitCommand);
}

app.mintBatchFormToOptions = () => {

    if (typeof app.state.mintBatch === `undefined`) app.state.mintBatch = {};
    if (typeof app.state.mintBatch.options === `undefined`) app.state.mintBatch.options = {};


    app.$mintingMode1Id = app.$mintingMode1Id || $("#mintingMode1Id");
    app.$mintingMode3Id = app.$mintingMode3Id || $("#mintingMode3Id");

    if (app.$mintingMode1Id.is(':checked'))
        app.state.mintBatch.options.mode = "bulk";
    else if (app.$mintingMode3Id.is(':checked'))
        app.state.mintBatch.options.mode = "offers";
    else
        app.state.mintBatch.options.mode = "singles";

    // bulk mint vars
    app.state.mintBatch.options.offerAmountInMojo = offerAmountInMojoId.value;
    app.state.mintBatch.options.royalty = parseInt(mintBatchRoyaltyPercentId.value * 100);
    app.state.mintBatch.options.royaltyAddress = mintBatchRoyaltyAddressId.value;
    app.state.mintBatch.options.pathToFile = localFolderId.value;
    app.state.mintBatch.options.metadataFileName = bulkMintCsvFilenameId.value;
    app.state.mintBatch.options.name = mintBatchNameId.value;

    // create offers vars
    app.state.mintBatch.options.offerWalletFingerprint = createOffersFingerprintId.value;
    app.state.mintBatch.options.offerTokenPrice = createOffersTokenPriceId.value;
    app.state.mintBatch.options.offerTokenWalletId = createOffersTokenWalletIdId.value;
    app.state.mintBatch.options.offerRoyalty = createOffersRoyaltyId.value;


    app.saveOptionsToBatch(app.currentBatchId, app.state.mintBatch.options);

    // console.log("[ mintBatchFormToOptions ] options: ", app.state.mintBatch.options);

    app.drawMintBatchOptions("mintBatchFormToOptions");

}


app.saveOptionsToBatch = (batchId, options) => {

    return new Promise((resolve, reject) => {

        if (!app.state.collection || !app.state.collection.currentId) {
            resolve();
            return;
        }
        app.db.open().then(function () {
            app.db.batches
                .where('id')
                .equals(parseInt(batchId))
                .modify({options: options})
                .then(function () {
                    app.state.mintBatch.options = options;
                    resolve();
                });

        });

    });
}