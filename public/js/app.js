/*

Mintr was developed by NFTr.pro for free use by everyone.

Many thanks to XCHcentral for getting the ball rolling with their repo:
https://github.com/jm-XCHcentral/Mint-An-NFT

Official Chia NFT introduction
https://devs.chia.net/guides/nft-intro#install-and-configure-chia-testnet

Visit NFTr.pro - Mint, Trade, Play!
https://NFTr.pro
Twitter: @nftr_pro
Discord: https://discord.gg/j7PmvGv5ra

Power to the creators!

*/


//
// Init app namespace
//
if (typeof app === `undefined`) app = {};
app.dict = app.dict ? app.dict : {}; // defined in en.js, etc
app.state = app.state || {};
app.userData = app.userData || {};

app.settings = app.settings || {};
app.settings.showToolTips = true;


//
// Language files
//
// TODO: Add menu option in the UI to change this
// TODO: Create function to override the English in the static HTML when then lang !== "en"
app.lang = "en";

//
// Default Metadata
//
app.defaultData = {

    nftName: '',
    nftDescription: '',
    nftIsSensitive: false,
    royaltyPercent: 250, // 2.5,
    walletId: 1,
    royaltyAddress: '',
    nftAddress: '',
    didAddress: '',
    walletFingerprint: "",
    fee: ".000000000001",
    collectionName: "",
    collectionDescription: "",
    collectionIcon: "",
    collectionBanner: "",
    collectionTwitter: "",
    collectionWebsite: "",
    collectionDiscord: "",
    collectionInstagram: "",
    collectionMedium: "",
    collectionEditionNumber: "",
    collectionEditionTotal: "",
    collectionId: "",

    seriesNumber: "",
    seriesTotal: "",

    nftStorageApiToken: "",
    attributes: [],
    urls: [],
    metadataUris: [],
    mintingTool: "Mintr by NFTr",

    sourceImageFileName: "",
    sourceImageFileNameFromPicker: "",
    mainFileUrl: "",
    metadataUrl: ""

};
app.state.defaultData = app.state.defaultData || app.defaultData;

app.currentPage = () => {
    if (window.location.pathname.search("settings") > -1) return "settings";
    if (window.location.pathname.search("collection/") > -1) return "collection";
    if (window.location.pathname.search("nft") > -1) return "nft";
    if (window.location.pathname.search("collections/") > -1) return "collections";
    return "";

}

app.currentEditor = () => {

    // init done?
    if (!app.$collectionEditorPanelId) return "";

    app.$nftEditor = app.$nftEditor || $('#nft-editor');
    app.$collectionEditor = app.$collectionEditor || $('#collection-editor');
    app.$batchProcessorId = app.$batchProcessorId || $('#batchProcessorId');

    app.$collectionEditorPanelId = app.$collectionEditorPanelId || $('#collectionEditorPanelId');
    app.$nftEditorPanelId = app.$nftEditorPanelId || $('#nftEditorPanelId');


    if (app.$batchProcessorId.hasClass("show")) return "batch";

    if (app.tabSelectedByUser) return app.tabSelectedByUser;
    if (app.$nftEditor.hasClass("show")) return "nft";
    if (app.$collectionEditor.hasClass("show")) return "collection";

    // const collectionEditorIsHidden = app.$collectionEditorPanelId.hasClass("mintr-collapse");
    // if (!collectionEditorIsHidden) return "collection";
    //
    // const nftEditorIsHidden = app.$nftEditorPanelId.hasClass("mintr-collapse");
    // if (!nftEditorIsHidden) return "nft";

    return "";
}


//
// Copy dataset to form
//
app.copyDataToForm = (userData = null, whoCalledMe = "") => {


    const currentPage = app.currentPage();
    const currentEditor = app.currentEditor();

    // console.log("[ copyDataToForm ] currentEditor: " + currentEditor + " - whoCalledMe: " + whoCalledMe + " - userData: ", userData);

    // don't update the form when selecting items when the collection editor is active
    if (app.selectionEnabled && currentEditor === "collection") return;

    if (userData === null && currentEditor === "nft" && app.currentAsset) userData = app.currentAsset.metadata;

    if (userData === null) userData = currentPage === "settings" ? app.state.defaultData : app.state.collection.userData || app.userData;

    // console.log("[ copyDataToForm ]!!!!!!!!!! whoCalledMe: " + whoCalledMe + " - userData: ", userData);

    if (currentPage === "collection" && currentEditor === "collection") app.renderCollectionBatchList();


    // nftEditorNameId.innerHTML = userData.nftName || "";

    if ($("#nftNameId").length > 0) {
        nftNameId.value = userData.nftName || "";
        nftDescriptionId.value = userData.nftDescription || "";
        nftIsSensitiveId.checked = userData.nftIsSensitive || false;
        collectionEditorNftIsSensitiveId.checked = userData.nftIsSensitive || false;
        seriesNumberId.value = userData.seriesNumber || "";
        seriesTotalId.value = userData.seriesTotal || "";
    }

    if ($("#collectionEditorNftNameId").length > 0) {
        collectionEditorNftNameId.value = userData.nftName || "";
        collectionEditorNftDescriptionId.value = userData.nftDescription || "";
        collectionEditorNftIsSensitiveId.checked = userData.nftIsSensitive || false;
        collectionEditorSeriesNumberId.value = userData.seriesNumber || "";
        collectionEditorSeriesTotalId.value = userData.seriesTotal || "";
    }

    if ($("#assetHashId").length !== 0) assetHashId.value = userData.assetHash;

    if ($("#metadataHashId").length !== 0) metadataHashId.value = userData.metadataHash;

    if ($("#nftStorageApiTokenId").length > 0) nftStorageApiTokenId.value = userData.nftStorageApiToken || "";

    if ($("#mintBatchRoyaltyPercentId").length > 0) mintBatchRoyaltyPercentId.value = userData.royaltyPercent * .01;

    if ($("#mintBatchRoyaltyAddressId").length > 0) mintBatchRoyaltyAddressId.value = userData.royaltyAddress;

    /*   if ($("#bulkMintCsvFilenameId").length > 0) {
           bulkMintCsvFilenameId.value = userData.metadataFileName;
       }*/


    if ($("#walletIdId").length > 0) {
        walletIdId.value = userData.walletId || "";
        royaltyAddressId.value = userData.royaltyAddress || "";
        nftAddressId.value = userData.nftAddress || "";
        didAddressId.value = userData.didAddress || "";
        royaltyPercentId.value = userData.royaltyPercent ? userData.royaltyPercent * .01 : "";
        walletFingerprintId.value = userData.walletFingerprint || "";
        feeId.value = userData.fee || "";
    }

    if ($("#collectionNameId").length > 0) {
        collectionNameId.value = userData.collectionName || "";
        collectionIdId.value = userData.collectionId || "";

        collectionDescriptionId.value = userData.collectionDescription || "";
        collectionTwitterId.value = userData.collectionTwitter || "";
        collectionIconId.value = userData.collectionIcon || "";
        collectionBannerId.value = userData.collectionBanner || "";
        collectionWebsiteId.value = userData.collectionWebsite || "";
        collectionDiscordId.value = userData.collectionDiscord || "";
        collectionInstagramId.value = userData.collectionInstagram || "";
        collectionMediumId.value = userData.collectionMedium || "";
        collectionEditionNumberId.value = userData.collectionEditionNumber || "";
        collectionEditionTotalId.value = userData.collectionEditionTotal || "";
        licenseHashId.value = userData.licenseHash;


        // licenses
        $("#licensesListId").empty();
        if (userData.licenses) {
            for (let i = 0; i < userData.licenses.length; i++) {
                app.addLicenseToForm(userData.licenses[i].url);
            }
        } else userData.licenses = [];

        // urls
        $("#urlsListId").empty();
        if (userData.urls) for (let i = 0; i < userData.urls.length; i++) {
            app.addUrlToForm(userData.urls[i].url);
        }

        if (currentEditor === "collection") {
            // traits
            $("#subtraitsListId").empty();
            if (userData.attributes) for (let i = 0; i < userData.attributes.length; i++) {
                app.addTraitToForm(userData.attributes[i].trait_type, userData.attributes[i].value, userData.attributes[i].min_value, userData.attributes[i].max_value, true);
            }
        } else {
            $("#traitsListId").empty();
            if (userData.attributes) for (let i = 0; i < userData.attributes.length; i++) {
                app.addTraitToForm(userData.attributes[i].trait_type, userData.attributes[i].value, userData.attributes[i].min_value, userData.attributes[i].max_value);
            }
        }

        // metadata uris
        $("#metadataListId").empty();
        if (userData.metadataUris) {
            for (let i = 0; i < userData.metadataUris.length; i++) {
                app.addMetadataUriToForm(userData.metadataUris[i].url);
            }
        }
    }
}


//
// Copies from the form to the dataset
//
app.copyFormToData = userData => {


    if (userData === undefined) {
        return;
    }

    const currentEditor = app.currentEditor();

    if ($("#nftNameId").length > 0) {
        // console.log("[ copyFormToData ] found nftNameId");
        if (currentEditor === "collection") {
            userData.nftName = collectionEditorNftNameId.value;
            userData.nftDescription = collectionEditorNftDescriptionId.value;
            userData.seriesNumber = collectionEditorSeriesNumberId.value;
            userData.seriesTotal = collectionEditorSeriesTotalId.value;
            userData.nftIsSensitive = collectionEditorNftIsSensitiveId.checked;
        } else {
            userData.nftName = nftNameId.value;
            userData.nftDescription = nftDescriptionId.value;
            userData.seriesNumber = seriesNumberId.value;
            userData.seriesTotal = seriesTotalId.value;
            userData.nftIsSensitive = nftIsSensitiveId.checked;
        }
    }
    if ($("#collectionIdId").length > 0) {
        // console.log("[ copyFormToData ] found collectionIdId");
        userData.collectionId = collectionIdId.value;

        userData.collectionName = collectionNameId.value;
        userData.collectionDescription = collectionDescriptionId.value;
        userData.collectionIcon = collectionIconId.value;
        userData.collectionBanner = collectionBannerId.value;
        userData.collectionTwitter = collectionTwitterId.value;
        if (collectionWebsiteId) userData.collectionWebsite = collectionWebsiteId.value;
        userData.collectionDiscord = collectionDiscordId.value;
        userData.collectionInstagram = collectionInstagramId.value;
        userData.collectionMedium = collectionMediumId.value;
        userData.collectionEditionNumber = collectionEditionNumberId.value;
        userData.collectionEditionTotal = collectionEditionTotalId.value;
    }

    /*if ($("#newCollectionNameId").length > 0) {
        console.log("[ copyFormToData ] found newCollectionNameId");
        userData.collectionName = newCollectionNameId.value;
        userData.collectionDescription = newCollectionDescriptionId.value;
    }*/
    if ($("#metadataHash").length > 0) userData.metadataHash = metadataHashId.value;

    if ($("#assetHashId").length > 0) userData.assetHash = assetHashId.value;

    if ($("#licenseHashId").length > 0) {

        userData.licenseHash = licenseHashId.value;
        // userData.licenseImageUrl
        // licenses
        userData.licenses = [];
        $('#licensesListId').children('div').each(function () {
            userData.licenses.push({
                url: $(this).find("input")[0].value
            })
        });

    }

    if ($("#mintingToolId").length > 0) userData.mintingTool = mintingToolId.value;

    if ($("#walletIdId").length > 0) userData.walletId = walletIdId.value;

    if ($("#feeId").length > 0) userData.fee = feeId.value;

    if ($("#walletFingerprintId").length > 0) userData.walletFingerprint = walletFingerprintId.value;


    if ($("#royaltyPercentId").length > 0) {

        userData.royaltyPercent = royaltyPercentId.value * 100;
        userData.royaltyAddress = royaltyAddressId.value;
        userData.nftAddress = nftAddressId.value;
        userData.didAddress = didAddressId.value;
        userData.nftStorageApiToken = nftStorageApiTokenId.value;

        // urls
        userData.urls = [];
        $('#urlsListId').children('div').each(function () {
            userData.urls.push({
                url: $(this).find("input")[0].value
            })
        });

        if (userData.urls.length > 0) userData.mainFileUrl = userData.urls[0].url;

        // attributes/traits
        userData.attributes = [];
        let numberOfTraits = 0;
        let traitListName = "traitsListId";

        if (currentEditor === "collection")
            traitListName = "subtraitsListId";


        // if (currentEditor === "collection")
        //     numberOfTraits = $("#subtraitsListId > div").length;
        // else
        //     numberOfTraits = $("#traitsListId > div").length;
        let traitDivs = $("#" + traitListName + " > div");
        numberOfTraits = traitDivs.length;


        const groupPrefix = currentEditor === "collection" ? "_nftDefaults" : "";
        let valueInput = groupPrefix + "_valueInputId";
        let minInput = groupPrefix + "_minInputId";
        let maxInput = groupPrefix + "_maxInputId";
        let labelInput = groupPrefix + "_labelInputId";

        if (traitDivs.length > 0)
            $(traitDivs).each(function () {

                if ($(this).find(".value").length > 0) {

                    let val = $(this).find(".value")[0].value;
                    let minValRaw = $(this).find(".minValue")[0].value;
                    let maxValRaw = $(this).find(".maxValue")[0].value;

                    userData.attributes.push({
                        trait_type: $(this).find(".label")[0].value,
                        value: !val || isNaN(val) ? val : parseFloat(val),
                        min_value: !minValRaw || isNaN(minValRaw) ? minValRaw : parseFloat(minValRaw),
                        max_value: !maxValRaw || isNaN(maxValRaw) ? maxValRaw : parseFloat(maxValRaw), // rarity: "here?"
                    })
                }


            });

        /* for (let i = 0; i < numberOfTraits; i++) {
             const trait = $("#trait" + i + valueInput);
             if (!trait || trait.length < 1) continue;
             let val = trait[0].value;
             let minValRaw = $("#trait" + i + minInput)[0].value;
             let maxValRaw = $("#trait" + i + maxInput)[0].value;
             userData.attributes.push({
                 trait_type: $("#trait" + i + labelInput)[0].value,
                 value: !val || isNaN(val) ? val : parseFloat(val),
                 min_value: !minValRaw || isNaN(minValRaw) ? minValRaw : parseFloat(minValRaw),
                 max_value: !maxValRaw || isNaN(maxValRaw) ? maxValRaw : parseFloat(maxValRaw), // rarity: "here?"
             })
         }*/

        console.log("[ copyFormToData ] read traits: " + numberOfTraits + " attributes: ", userData.attributes);

        // metadata uris
        userData.metadataUris = [];
        $('#metadataListId').children('div').each(function () {
            userData.metadataUris.push({
                url: $(this).find("input")[0].value
            })
        });

    }
}


app.getHash = async function (message) {
    const hash = await crypto.subtle.digest('SHA-256', message);
    const byteArrayOfHash = Array.from(new Uint8Array(hash));
    return byteArrayOfHash.map(b => b.toString(16).padStart(2, '0')).join('');
}

// called by the file picker
app.openLicenseFile = function (file) {
    let input = file.target;
    // this is used to tell if a file is selected for upload
    app.userData.sourceLicenseFileName = input.files[0].name;


    console.log("[ openLicenseFile ] app.openLicenseFile: ", app.userData.sourceLicenseFileName);


    app.state.collection.userData.licenseImageUrl = "";
    app.state.collection.userData.licenseHash = "";
    app.userData.metadataHash = "";

    // app.updateAppWithNewUserData()


    let reader = new FileReader();
    // load the file
    reader.onload = function () {
        app.licenseFileForUploading = input.files[0];

        console.log("app.openLicenseFile - onload: ", app.licenseFileForUploading);
        // app.updateAppWithNewUserData()
    };
    // load the raw data for the file hash
    reader.readAsDataURL(input.files[0]);


    let fileReader = new FileReader();
    fileReader.onload = async function (event) {
        app.sourceLicenseArrayBufferForHash = event.target.result;
        app.state.collection.userData.licenseHash = await app.getHash(app.sourceLicenseArrayBufferForHash);
        // licenseHashId.value = app.state.collection.userData.licenseHashForUpload || "";

        // app.userData.sourceAssetHash = assetHashId.value;

        // console.log("app.userData.sourceLicenseFileName ONLOAD 2");
        // console.log("sourceLicenseArrayBufferForHash: " + app.sourceLicenseArrayBufferForHash);
        // console.log("userData.licenseHash: " + app.state.collection.userData.licenseHash);
        // app.copyDataToForm(app.state.collection.userData,"openLicenseFile");
        // app.updateAppWithNewUserData();
        // await app.saveCurrentCollectionToDb(app.state.collection.userData);

    };
    console.log("app.openLicenseFile - READ START: ", input.files[0]);
    fileReader.readAsArrayBuffer(input.files[0]);
};

// called by the file picker
app.openFile = function (file) {
    let input = file.target;

    if (app.userData === undefined) {
        // console.log("[ openFile ] data is undefined");
        return;
    }

    // this is used to remember what image was last chosen
    app.userData.sourceImageFileName = input.files[0].name;

    // this is used to tell if a file is selected for upload
    app.sourceImageFileNameFromPicker = input.files[0].name;

    let reader = new FileReader();

    // load the image
    reader.onload = function () {
        const dataURL = reader.result;
        const imagePreviewEl = document.getElementById('mainImagePreviewId');
        const imagePreviewEl2 = document.getElementById('nftEditorImageId');

        imagePreviewEl.src = dataURL;
        imagePreviewEl2.src = dataURL;
        app.imageFileForUploading = input.files[0];

        app.userData.mainFileUrl = "";
        app.userData.assetHash = "";

        app.updateAppWithNewUserData()
    };

    // load the raw data for the file hash
    reader.readAsDataURL(input.files[0]);


    let fileReader = new FileReader();
    fileReader.onload = function (event) {
        app.sourceImageArrayBufferForHash = event.target.result;
    };
    fileReader.readAsArrayBuffer(input.files[0]);
};


app.uploadLicenseToIpfs = function () {

    const alertTextEl = document.getElementById('licenseAlertId');

    if (app.state.collection.userData.nftStorageApiToken === "") {
        alertTextEl.innerHTML = app.dict[app.lang].missingNftStorageApiToken;
        return;
    }

    if (app.userData.sourceLicenseFileName === undefined || app.userData.sourceLicenseFileName === "") {
        alertTextEl.innerHTML = app.dict[app.lang].selectAFileFirst;
        return;
    }

    alertTextEl.innerHTML = `<div class="spinner-border text-success" role="status"></div> ${app.dict[app.lang].uploadingToNftStorage}`;

    // used for the UI queue display
    app.currentlyUploadingFileName = "License";

    $.ajax({
        type: "POST",
        url: "https://api.nft.storage/upload",
        data: app.licenseFileForUploading,
        xhr: () => {
            var myXhr = $.ajaxSettings.xhr();
            if (myXhr.upload) {
                myXhr.upload.addEventListener('progress', app.uploadProgress, false);
            }
            return myXhr;
        }, contentType: false, processData: false, headers: {
            "Authorization": "Bearer " + app.state.collection.userData.nftStorageApiToken,
            "Content-Type": app.licenseFileForUploading.type
        }, success: async function (result) {

            app.state.collection.userData.licenseImageUrl = 'https://' + result.value.cid + ".ipfs.nftstorage.link"

            alertTextEl.innerHTML = `${app.dict[app.lang].licenseUploadedToNftStorage} <a href="${app.state.collection.userData.licenseImageUrl}" target="_blank">View</a>`;

            if (app.state.collection.userData.licenses.length > 0) {
                app.state.collection.userData.licenses[0].url = app.state.collection.userData.licenseImageUrl;
            } else {
                app.state.collection.userData.licenses.push({url: app.state.collection.userData.licenseImageUrl});
            }

            app.copyDataToForm(app.state.collection.userData, "uploadLicenseToIpfs");
            // app.updateAppWithNewUserData();


        }, error: function (error) {
            console.log("error")
            console.log(error);
            alertTextEl.innerHTML = app.dict[app.lang].anErrorOccurredUsingNftStorageKey + app.state.collection.userData.nftStorageApiToken + "<br><br>" + error.responseText;
        }
    });

};


app.uploadImageToIpfs = function () {

    const alertTextEl = document.getElementById('imageAlertId');

    if (app.state.collection.userData.nftStorageApiToken === "") {
        alertTextEl.innerHTML = app.dict[app.lang].missingNftStorageApiToken;
        return;
    }

    if (app.sourceImageFileNameFromPicker === undefined || app.sourceImageFileNameFromPicker === "") {
        alertTextEl.innerHTML = app.dict[app.lang].selectAFileFirst;
        return;
    }

    alertTextEl.innerHTML = `<div class="spinner-border text-success" role="status"></div> ${app.dict[app.lang].uploadingToNftStorage}`;

    // used for the UI queue display
    app.currentlyUploadingFileName = "Image";

    $.ajax({
        type: "POST", url: "https://api.nft.storage/upload", data: app.imageFileForUploading, xhr: function () {
            var myXhr = $.ajaxSettings.xhr();
            if (myXhr.upload) {
                myXhr.upload.addEventListener('progress', app.uploadProgress, false);
            }
            return myXhr;
        }, contentType: false, processData: false, headers: {
            "Authorization": "Bearer " + app.state.collection.userData.nftStorageApiToken,
            "Content-Type": app.imageFileForUploading.type
        }, success: async function (result) {

            app.userData.mainFileUrl = 'https://' + result.value.cid + ".ipfs.nftstorage.link"

            alertTextEl.innerHTML = "Image uploaded to nft.storage. <a href='" + app.userData.mainFileUrl + "' target='_blank'>View</a>"
            app.userData.assetHash = await app.getHash(app.sourceImageArrayBufferForHash);

            if (app.userData.urls.length > 0) app.userData.urls[0].url = app.userData.mainFileUrl; else app.userData.urls.push({url: app.userData.mainFileUrl});

            app.updateAppWithNewUserData();

        }, error: function (error) {
            console.log("error")
            console.log(error);
            alertTextEl.innerHTML = app.dict[app.lang].anErrorOccurredUsingNftStorageKey + app.state.collection.userData.nftStorageApiToken + "<br><br>" + error.responseText;
        }
    });

};

app.updateFinalJsonMetadataWithEditableJson = function () {

    if ($("#uploadMetadataJsonId").length < 1) return;

    // Clear formatted field text of <br>'s and escaped quotes: \"
    const escapedJson = uploadMetadataJsonId.innerHTML;
    let cleanJson = escapedJson.replace(/<br>/g, "");
    cleanJson = cleanJson.replace(/\\"/g, "");

    // parse it into an object to make sure the data is good
    const jsonObject = JSON.parse(cleanJson);

    app.finalJsonMetadata = JSON.stringify(jsonObject);
}

app.uploadMetadataToIpfs = function () {

    const alertTextEl = document.getElementById('metadataAlertId');

    if (app.state.collection.userData.nftStorageApiToken === "") {
        alertTextEl.innerHTML = app.dict[app.lang].missingIpfsApiToken;
        return;
    }

    if (uploadMetadataJsonId.value === "") {
        alertTextEl.innerHTML = app.dict[app.lang].jsonTextIsBlank;
        return;
    }

    app.updateFinalJsonMetadataWithEditableJson();


    alertTextEl.innerHTML = `<div class="spinner-border text-success" role="status"></div> ${app.dict[app.lang].uploadingMetadataToNftStorage}`;


    // used for the UI queue display
    app.currentlyUploadingFileName = "Metadata";

    $.ajax({
        type: "POST", url: "https://api.nft.storage/upload", data: app.finalJsonMetadata, xhr: function () {
            var myXhr = $.ajaxSettings.xhr();
            if (myXhr.upload) {
                myXhr.upload.addEventListener('progress', app.uploadProgress, false);
            }
            return myXhr;
        }, contentType: false, processData: false, headers: {
            "Authorization": "Bearer " + app.state.collection.userData.nftStorageApiToken,
            "Content-Type": app.imageFileForUploading.type
        }, success: async function (result) {
            metadataCID = result.value.cid;
            app.userData.metadataUrl = 'https://' + metadataCID + ".ipfs.nftstorage.link";

            alertTextEl.innerHTML = `${app.dict[app.lang].metadataUploadedToNftStorage} <a href="${app.userData.metadataUrl}" target="_blank">View</a>`;

            const metadataUint8 = new TextEncoder().encode(app.finalJsonMetadata);
            app.userData.metadataHash = await app.getHash(metadataUint8);


            if (app.userData.metadataUris.length > 0) app.userData.metadataUris[0].url = app.userData.metadataUrl; else app.userData.metadataUris = [{url: app.userData.metadataUrl}];


            app.updateAppWithNewUserData();

        }, error: function (error) {
            console.log("error")
            console.log(error)
        }
    });

}


app.generateJson = function (userData, whoCalled = "") {

    if (userData === undefined) {
        // console.log("[ generateJson ] data was undefined");
        return;
    }

    // console.log("[ generateJson ] " + whoCalled, userData);

    let metadata = {};

    metadata.name = userData.nftName; // Name of the NFT
    metadata.description = userData.nftDescription; // Description of the NFT
    metadata.sensitive_content = !!userData.nftIsSensitive; // Boolean for sensitive content within the NFT

    if (userData.seriesNumber) metadata.series_number = isNaN(userData.seriesNumber) ? userData.seriesNumber : parseFloat(userData.seriesNumber);

    if (userData.seriesTotal) metadata.series_total = isNaN(userData.seriesTotal) ? userData.seriesTotal : parseFloat(userData.seriesTotal);

    metadata.format = "CHIP-0007";

    //add attributes for the NFT (not collection), looking at the values and omitting bad input
    metadata.attributes = [];
    if (userData.attributes) {
        for (let i = 0; i < userData.attributes.length; i++) {
            if (userData.attributes[i].trait_type && userData.attributes[i].value) {
                let oneItem = {
                    trait_type: userData.attributes[i].trait_type, value: userData.attributes[i].value,
                };
                if (userData.attributes[i].min_value) oneItem.min_value = userData.attributes[i].min_value;
                if (userData.attributes[i].max_value) oneItem.max_value = userData.attributes[i].max_value;
                metadata.attributes.push(oneItem);
            }
        }
    }

    metadata.collection = {};
    metadata.collection.name = userData.collectionName;
    metadata.collection.id = userData.collectionId;


    metadata.collection.attributes = [];

    if (userData.collectionDescription) metadata.collection.attributes.push({
        type: "description", value: userData.collectionDescription
    });

    if (userData.collectionIcon) metadata.collection.attributes.push({
        type: "icon", value: userData.collectionIcon
    });


    if (userData.collectionBanner) metadata.collection.attributes.push({
        type: "banner", value: userData.collectionBanner
    });

    if (userData.collectionTwitter) metadata.collection.attributes.push({
        type: "twitter", value: userData.collectionTwitter
    });

    if (userData.collectionWebsite) metadata.collection.attributes.push({
        type: "website", value: userData.collectionWebsite
    });

    if (userData.collectionDiscord) metadata.collection.attributes.push({
        type: "discord", value: userData.collectionDiscord
    });

    if (userData.collectionInstagram) metadata.collection.attributes.push({
        type: "instagram", value: userData.collectionInstagram
    });

    if (userData.collectionMedium) metadata.collection.attributes.push({
        type: "medium", value: userData.collectionMedium
    });


    if (userData.mintingTool) metadata.minting_tool = userData.mintingTool; // Name or short tag of the minting tool used to create this NFT

    if (userData.data) metadata.data = userData.data;

    if (userData.buildData && userData.buildData.sourceFiles) {
        for (let i = 0; i < userData.buildData.sourceFiles.length; i++) {
            let rules = app.getMediaImportRulesFromFileName(userData.buildData.sourceFiles[i].filePath);

            if (rules && rules.isLink === true) {
                // console.log("[ userData.buildData.sourceFiles ] rules.isLink!! ", userData.buildData.sourceFiles);
                // The issue is that attributes are being added to the metadata for file refs. this should only be done when writing the metadata to preview or the final file
                let found = false;
                let trait_type = "Link (" + userData.buildData.sourceFiles[i].type + ")";
                // console.log("[ generateJson ] ADD ASSET: " + trait_type);
                let value = userData.buildData.sourceFiles[i].ipfs;
                metadata.attributes.push({
                    trait_type: trait_type, value: value,
                });
            }
        }
    }


    let jsonForPreview = JSON.stringify(metadata, null, "  ");
    if ($("#previewNameId").length !== 0) previewJsonId.innerText = jsonForPreview;
    if ($("#uploadMetadataJsonId").length !== 0) uploadMetadataJsonId.innerText = jsonForPreview;
};


app.generateJsonNew = function (metadata) {

    let jsonForPreview = JSON.stringify(app.generateJsonFromMetadata(metadata), null, "  ");
    // let jsonForPreview = JSON.stringify(app.generateJsonFromMetadata(metadata));

    if ($("#previewNameId").length !== 0) previewJsonId.innerText = jsonForPreview;
    if ($("#uploadMetadataJsonId").length !== 0) uploadMetadataJsonId.innerText = jsonForPreview;
}

app.generateJsonFromMetadata = function (metadata) {

    if (metadata === undefined) {
        // console.log("[ generateJson ] data was undefined");
        return;
    }

    let newJsonData = {};

    newJsonData.name = metadata.nftName; // Name of the NFT
    newJsonData.description = metadata.nftDescription; // Description of the NFT
    newJsonData.sensitive_content = !!metadata.nftIsSensitive; // Boolean for sensitive content within the NFT

    if (metadata.seriesNumber) newJsonData.series_number = isNaN(metadata.seriesNumber) ? metadata.seriesNumber : parseFloat(metadata.seriesNumber);

    if (metadata.seriesTotal) newJsonData.series_total = isNaN(metadata.seriesTotal) ? metadata.seriesTotal : parseFloat(metadata.seriesTotal);

    newJsonData.format = "CHIP-0007";

    //add attributes for the NFT (not collection), looking at the values and omitting bad input
    newJsonData.attributes = [];
    if (metadata.attributes) for (let i = 0; i < metadata.attributes.length; i++) {
        if (metadata.attributes[i].trait_type && metadata.attributes[i].value) {
            let oneItem = {
                trait_type: metadata.attributes[i].trait_type, value: metadata.attributes[i].value,
            };
            if (metadata.attributes[i].min_value) oneItem.min_value = metadata.attributes[i].min_value;
            if (metadata.attributes[i].max_value) oneItem.max_value = metadata.attributes[i].max_value;
            newJsonData.attributes.push(oneItem);
        }
    }

    newJsonData.collection = {};
    newJsonData.collection.name = metadata.collectionName;
    newJsonData.collection.id = metadata.collectionId;


    newJsonData.collection.attributes = [];

    if (metadata.collectionDescription) newJsonData.collection.attributes.push({
        type: "description", value: metadata.collectionDescription
    });

    if (metadata.collectionIcon) newJsonData.collection.attributes.push({
        type: "icon", value: metadata.collectionIcon
    });


    if (metadata.collectionBanner) newJsonData.collection.attributes.push({
        type: "banner", value: metadata.collectionBanner
    });

    if (metadata.collectionTwitter) newJsonData.collection.attributes.push({
        type: "twitter", value: metadata.collectionTwitter
    });

    if (metadata.collectionWebsite) newJsonData.collection.attributes.push({
        type: "website", value: metadata.collectionWebsite
    });

    if (metadata.collectionDiscord) newJsonData.collection.attributes.push({
        type: "discord", value: metadata.collectionDiscord
    });

    if (metadata.collectionInstagram) newJsonData.collection.attributes.push({
        type: "instagram", value: metadata.collectionInstagram
    });

    if (metadata.collectionMedium) newJsonData.collection.attributes.push({
        type: "medium", value: metadata.collectionMedium
    });

    if (metadata.thumbnail) newJsonData.thumbnail = metadata.thumbnail;


    if (metadata.mintingTool) newJsonData.minting_tool = metadata.mintingTool || "Mintr by NFTr.pro"; // Name or short tag of the minting tool used to create this NFT

    // if (metadata.data) newJsonData.data = metadata.data;
    if (metadata.data) newJsonData.data = JSON.parse(JSON.stringify(metadata.data));

    // console.log("?????????????????????????????????????????");
    // console.log(metadata);
    if (metadata.buildData.sourceFiles) {
        for (let i = 0; i < metadata.buildData.sourceFiles.length; i++) {
            let rules = app.getMediaImportRulesFromFileName(metadata.buildData.sourceFiles[i].filePath);

            if (rules && rules.isLink === true) {
                // console.log("[ metadata.buildData.sourceFiles ] rules.isLink!! ", metadata.buildData.sourceFiles);
                // The issue is that attributes are being added to the metadata for file refs. this should only be done when writing the metadata to preview or the final file
                let found = false;
                let trait_type = "Link (" + metadata.buildData.sourceFiles[i].type + ")";
                // console.log("[ generateJson ] ADD ASSET: " + trait_type);
                let value = metadata.buildData.sourceFiles[i].ipfs;
                newJsonData.attributes.push({
                    trait_type: trait_type, value: value,
                });
            }
        }
    }


    return JSON.stringify(newJsonData, null, "  ");
    // return JSON.stringify(newJsonData);
};


app.updateCliCommand = function (userData) {

    if (userData === undefined) {
        // console.log("[ updateCliCommand ] data is undefined");
        return;
    }

    // See Mint an NFT (With DID)
    // https://devs.chia.net/guides/nft-cli#mint-an-nft-with-did

    if ($("#commandCliId").length === 0) return;

    let assetUris = "";
    let licenseUris = "";
    let metadataUris = "";

    if (userData.urls) for (let i = 0; i < userData.urls.length; i++) {
        assetUris += assetUris !== "" ? "," : "" + userData.urls[i].url;
    }

    if (userData.licenses) for (let i = 0; i < userData.licenses.length; i++) {
        licenseUris += licenseUris !== "" ? "," : "" + userData.licenses[i].url;
    }

    if (userData.metadataUris) for (let i = 0; i < userData.metadataUris.length; i++) {
        metadataUris += metadataUris !== "" ? "," : "" + userData.metadataUris[i].url;
    }

    app.cliCommand = `chia wallet nft mint`;
    app.cliCommand += ` -i ${userData.walletId}`;  //The id of your NFT wallet.
    app.cliCommand += ` -u ${assetUris}`; // A comma-separated list of URIs where this asset may be found.
    app.cliCommand += ` -nh ${userData.assetHash}`; //The NFT's data hash. Must match to be viewable in the wallet.
    app.cliCommand += ` -f ${userData.walletFingerprint}`; //The fingerprint of the wallet.
    app.cliCommand += ` -ra ${userData.royaltyAddress}`; // The wallet or smart coin address that will receive royalties.
    app.cliCommand += ` -ta ${userData.nftAddress}`; // The wallet or smart coin address where the NFT will be sent.
    app.cliCommand += ` -mu ${metadataUris}`; // A comma-separated list of URIs where the image's metadata may be found.
    app.cliCommand += ` -lu ${licenseUris}`; // A comma-separated list of URIs where the image's license may be found.
    app.cliCommand += ` -lh ${userData.licenseHash}`; // The hash of the NFT's license.
    app.cliCommand += ` -en ${userData.collectionEditionNumber}`; // The hash of the NFT's license.
    app.cliCommand += ` -ec ${userData.collectionEditionTotal}`; // The hash of the NFT's license.
    app.cliCommand += ` -rp ${userData.royaltyPercent}`; //The royalty percentage expressed as tens of thousandths of a percent.
    app.cliCommand += ` -mh ${userData.metadataHash}`; //The hash of the NFT's metadata.
    app.cliCommand += ` -m ${userData.fee}`; // The fee for this transaction in XCH.

    // app.cliCommand += ` -ta ${userData.didAddress}`; // The did ??

    commandCliId.innerText = app.cliCommand;
}


app.updateRpcCommand = function (userData) {

    if (userData === undefined || $("#commandRpcId").length === 0) return;

    commandRpcId.value = app.getRpcCommand(userData);
}


app.getRpcCommand = function (userData) {

    if (userData === undefined) {
        return "";
    }

    let rpcCommand = "chia rpc wallet nft_mint_nft ";

    let assetUris = [];
    let licenseUris = [];
    let metadataUris = [];

    if (userData.urls) for (let i = 0; i < userData.urls.length; i++) {
        assetUris.push(userData.urls[i].url);
    }
    if (userData.licenses) for (let i = 0; i < userData.licenses.length; i++) {
        licenseUris.push(userData.licenses[i].url);
    }
    if (userData.metadataUris) for (let i = 0; i < userData.metadataUris.length; i++) {
        metadataUris.push(userData.metadataUris[i].url);
    }

    let rpcParts = {
        "wallet_id": userData.walletId,
        "uris": assetUris,
        "hash": userData.assetHash,
        "meta_uris": metadataUris,
        "meta_hash": userData.metadataHash,
        "license_uris": licenseUris,
        "license_hash": userData.licenseHash,
        "royalty_address": userData.royaltyAddress,
        "royalty_percentage": userData.royaltyPercent,
        "target_address": userData.nftAddress,
        "edition_number": !userData.collectionEditionNumber || isNaN(userData.collectionEditionNumber) ? userData.collectionEditionNumber : parseFloat(userData.collectionEditionNumber),
        "edition_count": !userData.collectionEditionTotal || isNaN(userData.collectionEditionTotal) ? userData.collectionEditionTotal : parseFloat(userData.collectionEditionTotal),
        "fee": app.convertXchToMojoString(userData.fee)
    };

    if (userData.didAddress) rpcParts.did_id = userData.didAddress;

    rpcCommand += `'${JSON.stringify(rpcParts)}'`;

    console.log("rpcCommand: ", rpcCommand);

    return rpcCommand;
}

app.handleReloadEdgeCases = function () {
    if (app.userData === undefined) return;

    // if the image was picked, but not uploaded, then we don't want to remember the image
    if (!app.userData.mainFileUrl) {
        app.userData.sourceImageFileName = "";
        app.sourceImageFileNameFromPicker = "";
        app.userData.assetHash = "";
    } else {
        if ($("#mainImagePreviewId").length > 0) mainImagePreviewId.src = app.userData.mainFileUrl || "/img/placeholder_image.svg";
        if ($("#nftEditorImageId").length > 0) nftEditorImageId.src = app.userData.mainFileUrl || "/img/placeholder_image.svg";
    }
}


app.resetuserDataToDefaults = function () {

    // Alert to check before resetting
    if (!confirm(app.dict[app.lang].resetAllData)) return;

    app.userData = app.state.defaultData;
    app.clearListDivsFromForm();

    app.writeuserDataToIndexedDB(app.userData);
    app.updateAppWithNewUserData();
    mainImagePreviewId.src = "";
    nftEditorImageId.src = "";
    nftFileId.value = "";
}

app.doResetNftDataToDefaults = function () {

    // Alert to check before resetting
    if (!confirm(app.dict[app.lang].clearNftData)) return;
}

app.resetNftDataToDefaults = function () {

    if (app.userData === undefined) {
        console.log("[ doResetNftDataToDefaults ] data is undefined");
        app.userData = {};
    }

    app.userData.urls = [];
    app.state.collection.userData.licenseUris = [];
    app.userData.attributes = [];
    app.userData.sourceImageFileName = "";
    app.sourceImageFileNameFromPicker = "";
    app.userData.mainFileUrl = "";
    app.userData.assetHash = "";
    app.userData.metadataUrl = "";
    app.userData.metadataHash = "";
    app.userData.nftName = "";
    app.userData.nftDescription = "";

    app.clearListDivsFromForm();
    app.copyDataToPreview(app.userData, "resetNftDataToDefaults");
    app.writeuserDataToIndexedDB(app.userData);
    app.updateAppWithNewUserData();
    mainImagePreviewId.src = "";
    nftEditorImageId.src = "";
    nftFileId.value = "";
}

// populate the page with userData
app.updateAppWithNewUserData = async function () {
    // console.log("[ updateAppWithNewUserData ] START");

    await app.loadState();

    app.clearListDivsFromForm();
    app.copyDataToForm(null, "updateAppWithNewUserData");
    app.copyDataToPreview(app.userData, "updateAppWithNewUserData");
    app.generateJson(app.userData, "updateAppWithNewUserData");
    app.updateCliCommand(app.userData);
    app.updateRpcCommand(app.userData);
    app.overridesToDefaultSettingsForm();
}


app.saveFormInputState = async (whoCalledMe = "") => {
    if (!app.saveFormStateIsRunning)
        app.saveFormStateIsRunning = true;
    else return;

    await app.saveFormState(whoCalledMe);
}

// store changes in the form and update the previews
app.saveFormState = async (whoCalledMe = "") => {


    const currentPage = app.currentPage();
    const currentEditor = app.currentEditor();

    // console.log("[ saveFormState ] NFT page - called by " + whoCalledMe + " - currentPage: " + currentPage + " - currentEditor: " + currentEditor);

    // Default Settings page - settings page removed
    /* if (currentPage === "settings") {
         app.copyFormToData(app.state.defaultData);
         app.saveFormOverrides();
         await app.saveState();
         console.log("[ saveFormState ] Settings page - called by " + whoCalledMe + " - userData: ", app.state.defaultData);
     } else */

    // Single NFT page
    if (currentPage === "nft") {

        if (app.userData === undefined) {
            // console.log("[ saveFormState ] data was undefined, resetting data");
            app.doResetNftDataToDefaults();
            app.generateJson(app.userData, "saveFormState");
            app.updateCliCommand(app.userData);// for individual NFT page
            app.updateRpcCommand(app.userData);// for individual NFT page
            if (app.drawMintBatchOptions) app.drawMintBatchOptions("app.saveFormState - current NFT");

        }
        app.writeuserDataToIndexedDB(app.userData);// for individual NFT page
        // console.log("[ saveFormState ] NFT page - called by " + whoCalledMe + " - userData: ", app.userData);
    }

    // Collection page
    else if (currentPage === "collection") {

        // Collection Editor Panel
        if (currentEditor === "collection") {

            app.copyFormToData(app.state.collection.userData);
            app.saveFormOverrides();
            // await app.saveState();
            // console.log("[ saveFormState ] collection page, collection editor - called by " + whoCalledMe + " - userData: ", app.state.collection.userData);
            await app.saveCurrentCollectionToDb(app.state.collection.userData);

        }

        // NFT Editor Panel
        else if (currentEditor === "nft") {

            app.copyFormToData(app.userData);
            app.generateJson(app.userData, "saveFormState"); // updates the JSON in the preview tab of the NFT editor
            // console.log("[ saveFormState ] collection page, NFT editor - called by " + whoCalledMe + " - userData: ", app.userData);
            await app.saveCurrentEditorSearchTerms(app.userData);
            app.redrawAssetGridItem(app.currentAsset);
            // app.drawPanel();


        }
    }

    app.saveFormStateIsRunning = false;
    // });
}

app.resetDefaultOverrideCheckboxValues = () => {
    app.state.collection.userData.overrides = JSON.parse(JSON.stringify(app.defaultOverrideCheckboxValues));
    return app.state.collection.userData.overrides;
}

app.defaultOverrideCheckboxValues = {

    nftNameCheckboxId: false,
    nftDescriptionCheckboxId: true,
    nftIsSensitiveCheckboxId: true,
    seriesNumberCheckboxId: false,
    seriesTotalCheckboxId: false,

    collectionIdCheckboxId: true,
    collectionNameCheckboxId: true,
    collectionDescriptionCheckboxId: true,
    iconCheckboxId: true,
    bannerCheckboxId: true,
    twitterCheckboxId: true,
    websiteCheckboxId: true,
    discordCheckboxId: true,
    instagramCheckboxId: true,
    mediumCheckboxId: true,
    editionNumberCheckboxId: true,
    editionCountCheckboxId: true,

    didAddressCheckboxId: true,
    mintFeeCheckboxId: true,
    mintingToolCheckboxId: true,
    nftStorageApiTokenCheckboxId: true,
    royaltyAddressCheckboxId: true,
    royaltyPercentCheckboxId: true,
    targetAddressCheckboxId: true,
    walletFingerprintCheckboxId: true,
    walletIndexCheckboxId: true
}


app.getDefaultOverrideCheckboxValues = () => {
    if (!app.state.collection.userData.overrides) app.resetDefaultOverrideCheckboxValues();
    return app.state.collection.userData.overrides;
}

app.saveFormOverrides = () => {
    app.state.collection.userData.overrides = {};
    $(".overrideCheckbox").each(function (index) {
        const $this = $(this)[0];
        app.state.collection.userData.overrides[$this.id] = $($this).prop('checked');
    });
}

app.overridesToDefaultSettingsForm = () => {

    if (!app.state || !app.state.collection.userData.overrides) return;

    for (const key in app.state.collection.userData.overrides) {
        // console.log(`[ saveFormOverrides key: ${key} - ${app.state.collection.userData.overrides[key]}`);
        $("#" + key).prop('checked', app.state.collection.userData.overrides[key]);
    }
}

// add url element to form html
app.addLicenseToForm = function (url = '') {

    let $divEl = $("#licensesListId");
    let divCount = $("#licensesListId > div").length;

    // replace placeholder text with required values
    let template = app.licenseTemplate.replace(/ROWID/g, "license" + divCount);
    template = template.replace(/URL_VALUE/g, url);
    $divEl.append(template);
}


// add url element to form html
app.addUrlToForm = function (url = '') {

    let $divEl = $("#urlsListId");
    let divCount = $("#urlsListId > div").length;

    // replace placeholder text with required values
    let template = app.urlTemplate.replace(/ROWID/g, "url" + divCount);
    template = template.replace(/URL_VALUE/g, url);
    $divEl.append(template);
}


// add trait element to form html
app.addTraitToForm = function (label = '', value = '', min = '', max = '', addToCollectionNftDefaults = false) {


    let template = app.traitTemplate;
    let traitsList = [];
    let rowIdTrait = "trait";
    let divCount = 0;

    if (addToCollectionNftDefaults === true) {
        template = app.traitWithCheckboxTemplate;
        traitsList = $("#subtraitsListId"); // don't memoize
        divCount = $("#subtraitsListId > div").length;
    } else {
        template = app.traitTemplate;
        traitsList = $("#traitsListId"); // don't memoize
        divCount = $("#traitsListId > div").length;
    }

    template = template.replace(/ROWID/g, rowIdTrait + divCount);
    template = template.replace(/LABEL_HEADER/g, app.dict[app.lang].label);
    template = template.replace(/VALUE_HEADER/g, app.dict[app.lang].value);
    template = template.replace(/MIN_HEADER/g, app.dict[app.lang].min);
    template = template.replace(/MAX_HEADER/g, app.dict[app.lang].max);
    template = template.replace(/LABEL_VALUE/g, label);
    template = template.replace(/VALUE_VALUE/g, value);
    template = template.replace(/MIN_VALUE/g, min);
    template = template.replace(/MAX_VALUE/g, max);

    traitsList.append(template);

    $('main input').change(function () {
        app.saveFormInputState("main input");
    });

}

// add metadata url element to form html
app.addMetadataUriToForm = function (url = '') {

    let $divEl = $("#metadataListId");
    let divCount = $("#metadataListId > div").length;

    // replace placeholder text with required values
    let template = app.metadataTemplate.replace(/ROWID/g, "metadata" + divCount);
    template = template.replace(/URL_VALUE/g, url);
    $divEl.append(template);
}

app.clearListDivsFromForm = function () {
    $("#urlsListId > div").remove();
    $("#traitsListId > div").remove();
    $("#metadataListId > div").remove();
}


// remove url element from html
app.removeLicense = function (el) {
    if ($("#licensesListId > div").length <= 1) return; // first URI required
    const id = $(el).data("id");
    $(el).parent().parent().parent().remove();
    // $("#" + id + "_row").remove();
    app.saveFormState("removeLicense");
    app.updateAppWithNewUserData();
}

// remove url element from html
app.removeUrl = function (el) {
    if ($("#urlsListId > div").length <= 1) return; // first URI required
    const id = $(el).data("id");
    $(el).parent().parent().parent().remove();
    // $("#" + id + "_row").remove();
    app.saveFormState("removeUrl");
    app.updateAppWithNewUserData();
}


// remove trait element from html
app.removeTrait = async function (el, isCollectionEditor = false) {
    // if (app.traitDeleteLocked) return;
    // app.traitDeleteLocked = true;

    const id = $(el).data("id");
    console.log("[ remove trait id: ]", id);

    $(el).parent().parent().parent().remove();

    app.saveFormState("removeTrait");

    if (!isCollectionEditor) {
        // app.copyFormToData(app.userData);
        app.updateAppWithNewUserData();
// +++
        // app.updateAppWithNewUserData();
        // app.saveCurrentEditorSearchTerms(app.userData);
        // app.writeuserDataToIndexedDB(app.userData);// for individual NFT page
        // await app.saveCurrentEditorSearchTerms(app.userData)
        // app.drawPanel();
    } else {

        await app.saveCurrentCollectionToDb(app.state.collection.userData);
    }

}


// remove url element from html
app.removeMetadataUri = function (el) {
    if ($("#metadataListId > div").length <= 1) return; // first URI required
    const id = $(el).data("id");
    $(el).parent().parent().parent().remove();
    // $("#" + id + "_row").remove();
    app.saveFormState("removeMetadataUri");
    // app.updateAppWithNewUserData();
}

app.copyRpcToClipboard = function () {
    app.copyToClipboard(app.rpcCommand);
}

app.copyCliToClipboard = function () {
    app.copyToClipboard(app.cliCommand);
}

app.copyToClipboard = function (textToCopy) {
    navigator.clipboard.writeText(textToCopy);
}

app.convertXchToMojoString = function (xchAmount) {
    return parseInt(xchAmount * 1000000000000);
}
app.convertXchToMojos = function (xchAmount) {
    return BigInt(app.convertXchToMojoString(xchAmount));
}

// init the app
app.init = function () {
    app.initIndexedDb();
    app.loaduserDataFromIndexedDbOrDefaults();


    // Todo - enable tool tips after refactoring views
    // enable tool tips globally
    /*  if (app.settings.showToolTips) {
          let tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
          tooltipTriggerList.map(function (tooltipTriggerEl) {
              return new bootstrap.Tooltip(tooltipTriggerEl)
          })
      }*/

    // app.translate();
}

app.translate = function () {

    if (app.dict[app.lang].htmlElementIdValuePairs === undefined) return;

    for (let i = 0; i < app.dict[app.lang].htmlElementIdValuePairs.length; i++) {
        $thisEl = $("#" + app.dict[app.lang].htmlElementIdValuePairs[i].id)
            .text(app.dict[app.lang].htmlElementIdValuePairs[i].value);
    }
}


// listen for input changes and update the userData
$('main input').change(function () {
    app.saveFormInputState("main input");
});


// listen for input changes and update the userData
$('#addTraitButtonId').click(function () {
    app.addTraitToForm();
});

// listen for input changes and update the userData
$('#subaddTraitButtonId').click(function () {
    app.addTraitToForm("", "", "", "", true); //addToCollectionNftDefaults=true
});

// listen for input changes and update the userData
$('#addUrlButtonId').click(function () {
    app.addUrlToForm();
});
// listen for input changes and update the userData
$('#addMetadataButtonId').click(function () {
    app.addMetadataUriToForm();
});

// listen for input changes and update the userData
$('#addLicenseButtonId').click(function () {
    app.addLicenseToForm();
});

$('#loadSnapshotMenuItemId').click(function () {
    $('#loadSnapshotFileInputId').click();
});

$('#loadDefaultsMenuItemId').click(function () {
    $('#loadDefaultSettingsFileInputId').click();
});


$('#loadNftMetadataMenuItemId').click(function () {
    $('#loadNftFileInputId').click();
});

app.resetCollectionToDefault = async () => {
    app.state.defaultData = JSON.parse(JSON.stringify(app.defaultData));
    app.copyDataToForm(app.defaultData, "resetCollectionToDefault");
    app.resetDefaultOverrideCheckboxValues();
    app.overridesToDefaultSettingsForm();
    app.saveFormState("resetDefaultsMenuItemId");
    await app.saveCurrentCollectionToDb();
}

// When the File menu is selected, we create JSON files as downloadable links
// $('#navbarDropdown').click(function () {
$('#nav-manage-tab').click(function () {
    const snapshotData = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(app.state.collection.userData));
    // const defaultData = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(app.state.defaultData));
    let customFileNamePrefix = app.state.collection.userData.collectionName ? app.state.collection.userData.collectionName : "collection"
    $("#saveSnapshotMenuItemId").html(`<a href="data:${snapshotData}" download="${customFileNamePrefix}_mintr-settings.json">${app.dict[app.lang].saveSettings}</a>`);
    // $("#saveDefaultsMenuItemId").html(`<a href="data:${defaultData}" download="mintr-default-settings.json">${app.dict[app.lang].saveDefaults}</a>`);

    $("#resetDefaultsMenuItemId").click(async () => {
        await app.resetCollectionToDefault();
    });

    app.updateFinalJsonMetadataWithEditableJson();

    // write the json metadata file
    if (app.finalJsonMetadata) {
        const nftData = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(JSON.parse(app.finalJsonMetadata)));
        const filename = `mintr-nft_${app.userData.nftName}_${app.userData.collectionName}.json`;

        $("#saveNftMetadataMenuItemId").html(`<a href="data:${nftData}" download="${filename}">${app.dict[app.lang].saveNftMetadata}</a>`);
    }

});


// listen for page closing and update the userData
$(window).on("beforeunload", function () {
    app.saveFormState("beforeunload");
});

$("#loadSnapshotFileInputId").change(function (e) {
    // console.log(e.target.files[0]);
    app.loadSnapshotFile(e.target.files[0]);
});

$("#loadDefaultSettingsFileInputId").change(function (e) {
    app.loadDefaultFile(e.target.files[0]);
});


$("#loadNftFileInputId").change(function (e) {
    console.log("loadNftFileInputId");
    console.log(e.target.files[0]);
    app.loadNftFile(e.target.files[0]);
});

(() => {
    'use strict'
    const tooltipTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    tooltipTriggerList.forEach(tooltipTriggerEl => {
        new bootstrap.Tooltip(tooltipTriggerEl)
    })
})()


// start the app
app.init();

