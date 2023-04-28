// namespace
if (typeof app === `undefined`) app = {};

app.mediaRendered = function (asset) {
    return asset.mediaScan.rendered > 0;
}
app.mediaValid = function (asset) {
    return asset.mediaScan.valid > 0;
}

app.doMediaScan = function (asset) {
    asset.mediaScan = {
        found: 0, rendered: 0, // buildFile data matches found file in same location
        valid: 0, // metadata updated, including hashes of all files to upload
        uploaded: 0, // all files uploaded
    }

    if (asset.metadata && asset.metadata.buildData && asset.metadata.buildData.sourceFiles.length > 0) {
        for (let file of asset.metadata.buildData.sourceFiles) {
            asset.mediaScan.found++;
            if (file['fileStatus']) {
                if (file['fileStatus'].isRendered) asset.mediaScan.rendered++;
                if (file['fileStatus'].isUploaded) asset.mediaScan.uploaded++;
                if (file['fileStatus'].isValid) asset.mediaScan.valid++;
            }
        }

    }

}

app.mediaUploaded = function (asset) {
    return asset.mediaScan.uploaded > 0;
}

app.nftState = function (asset) {
    if (!asset.metadata.buildData) return false;
    return asset.metadata.buildData.isMinted === true;
}

app.getListOfMedia = function (asset) {

}

app.getFileType = function (filename) {
    if (!filename) return filename;
    let parts = filename.split(".");
    return parts[parts.length - 1].toLowerCase();
}

app.getFileName = function (filepath, withExt = true) {
    let parts = filepath.split("/");
    if (withExt) return parts[parts.length - 1];
    let nameParts = parts[parts.length - 1].split(".");
    nameParts.pop();
    return nameParts.join(".");
}

app.sortSourceFiles = function (asset) {
    asset.metadata.buildData.sourceFiles.sort((a, b) => {
        return a.index - b.index;
    });

    asset.metadata.buildData.thumbIndex = 0;

}


app.renderFileHtml = function () {

    // console.log("[ renderFileHtml ] app.currentAsset.metadata.buildData: ", app.currentAsset.metadata.buildData);

    let filesHtml = "";
    let fileCount = 0;
    let index = -1;
    if (app.currentAsset.metadata && app.currentAsset.metadata.buildData) {
        for (const sourceFile of app.currentAsset.metadata.buildData.sourceFiles) {
            index++;
            if (!sourceFile.filePath) continue;

            // console.log("[ renderFileHtml ] sourceFile: ", sourceFile);

            let template = app.nftEditorFileRowTemplate;
            let linkHTML = "";
            if (sourceFile.thumb) {
                const blobUrl = URL.createObjectURL(sourceFile.thumb);
                linkHTML = `<br><a target="_blank" href="${blobUrl}">View</a>`;
            }
            let usageHtml = "";
            if (sourceFile.isMain) usageHtml += `<span class="badge text-bg-primary">Main</span>`;
            if (sourceFile.isLink) usageHtml += `<span class="badge rounded-pill text-bg-secondary">Link</span>`;
            if (sourceFile.isThumbnail) usageHtml += `<span class="badge bg-dark">Thumb</span>`;

            template = template.replace(/INDEX/g, index);

            template = template.replace(/NUMBER/g, sourceFile.index ? sourceFile.index : "-");
            template = template.replace(/TYPE/g, (sourceFile.processedFileType ? (sourceFile.processedFileType + " (" + app.getFileType(sourceFile.filePath).toUpperCase() + ")") : app.getFileType(sourceFile.filePath)).toUpperCase());
            template = template.replace(/FILENAME/g, app.getFileName(sourceFile.filePath, false));
            template = template.replace(/VALID/g, sourceFile.fileStatus.isRendered ? "Found" + (sourceFile.fileStatus.isValid ? linkHTML : "") : "File missing");
            // template = template.replace(/READY/g, sourceFile.fileStatus.isValid ? "Data ready" + linkHTML : "Needs Data");
            template = template.replace(/ISPRIMARY/g, sourceFile.isMain ? "X" : "");
            template = template.replace(/ISTHUMB/g, sourceFile.isThumb ? "X" : "");
            template = template.replace(/UPLOADED/g, sourceFile.fileStatus.isUploaded ? "Uploaded" + (`<br><a target="_blank" href="${sourceFile.ipfs}">Link</a>`) : "Needs uploading");
            template = template.replace(/USAGE/g, usageHtml);

            filesHtml += template;
            fileCount++;

        }
    }

    if (fileCount > 0) {
        nftEditorFilesId.innerHTML = filesHtml;
        $("#fileListBlankMessageId").addClass("hidden");
        $("#fileListId").removeClass("hidden");

        // needs a fresh jquery call every time function is called
        $(".fileItemDeleteButton").click((e) => {
            app.deleteModalRequested = true;
            app.fileIndexToDelete = $(e.target).data("index");
            app.assetToDeleteFileFrom = app.currentAsset;

            // app.deleteFile(batchId);
        });

    } else {
        $("#fileListBlankMessageId").removeClass("hidden");
        $("#fileListId").addClass("hidden");
    }


}


//
// Copy userData to preview area
//
app.copyDataToPreview = function (userData, whoCalled = "") {

    const currentEditor = app.currentEditor();

    if (userData === undefined) {
        // console.log("[ copyDataToPreview ] data is undefined");
        return;
    }

    if (currentEditor === "") return;
    if (currentEditor === "nft" && whoCalled === "doToggleEditorPanel") return;


    // console.log("[ copyDataToPreview ] userData.nftName: " + userData.nftName + " - currentEditor: " + currentEditor + " - whoCalled: " + whoCalled + " - userData: ", userData);


    app.copyDataToForm(userData, "copyDataToPreview");


    if (app.currentAsset && nftEditorFilesId) {

        app.doMediaScan(app.currentAsset);

        // let mediaValid = app.mediaValid(app.currentAsset);
        let mediaRendered = app.mediaRendered(app.currentAsset);
        // let mediaUploaded = app.mediaUploaded(app.currentAsset);

        if (app.currentAsset.state !== "todo" && mediaRendered) nftUploadButtonId.classList.remove("disabled"); else nftUploadButtonId.classList.add("disabled");

        if (nftEditorFilesId) {
            app.renderFileHtml();
        }


        $("#deleteFileButtonId").click((e) => {
            if (!app.deleteModalRequested) return;
            // console.log("[ deleteFileButtonId ] ");
            app.deleteModalRequested = false;
            if (app.batchModal) app.batchModal.hide();
            if (app.fileIndexToDelete !== null) app.deleteFile(app.currentAsset, app.fileIndexToDelete);
        });

    }

    let notSelectedYet = app.dict[app.lang].notSelectedYet;
    let none = app.dict[app.lang].none;
    let required = `<div class="requiredText">${app.dict[app.lang].required}</div>`;
    let notUploadedYet = app.dict[app.lang].notUploadedYet;
    let notMinted = app.dict[app.lang].notMinted;
    let yes = app.dict[app.lang].yes;
    let no = app.dict[app.lang].no;
    let untitled = app.dict[app.lang].untitled;


    if ($("#previewNameId").length === 0) {
        // console.log("Preview panel not available.");
        return;
    }

    if ($("#previewNftId").length !== 0) {
        previewNftId.innerHTML = userData.nftId ?
            `<a href="https://www.spacescan.io/nft/${userData.nftId}" target="_blank">${userData.nftId}</a>` : notMinted;
    }

    nftEditorNameId.innerHTML = userData.nftName || untitled;

    collectionEditorNameId.innerHTML = userData.collectionName || untitled;
    if (userData.collectionIcon) collectionEditorImageId.src = userData.collectionIcon;

    previewNameId.innerHTML = userData.nftName || required;
    previewDescriptionId.innerHTML = userData.nftDescription || none;
    previewRoyaltyId.innerHTML = userData.royaltyPercent ? `${userData.royaltyPercent * .01}% (${userData.royaltyPercent})` : required;
    previewRoyaltyReceiveAddressId.innerHTML = userData.royaltyAddress || required;
    previewIsSensitiveId.innerHTML = userData.nftIsSensitive ? yes : no;

    previewTargetReceiveAddressId.innerHTML = userData.nftAddress || required;
    previewDidAddressId.innerHTML = userData.didAddress || none;

    previewCollectionIdId.innerHTML = userData.collectionId || none;
    previewCollectionNameId.innerHTML = userData.collectionName || none;
    previewCollectionDescriptionId.innerHTML = userData.collectionDescription || none;

    previewSourceImageFileNameId.innerHTML = userData.sourceImageFileName || notSelectedYet;


    previewMainFileUrlId.innerHTML = !userData.mainFileUrl ? notUploadedYet : ` <a href = "${userData.mainFileUrl}" target = "_blank" >${userData.mainFileUrl} </a>`;

    previewassetHashId.innerHTML = userData.assetHash || notSelectedYet;

    previewMetadataUrlId.innerHTML = !userData.metadataUrl ? notUploadedYet : `<a href="${userData.metadataUrl}" target="_blank">${userData.metadataUrl}</a>`;


    // previewLicenseFileNameId.innerHTML = userData.sourceLicenseFileName ? userData.sourceLicenseFileName : notSelectedYet;


    previewMetadataHashId.innerHTML = userData.metadataHash || notUploadedYet;


    previewLicenseUrlId.innerHTML = !userData.licenses || userData.licenses.length === 0 || !userData.licenses[0].url ? notUploadedYet : `<a href="${userData.licenses[0].url}" target="_blank">${userData.licenses[0].url}</a>`;
    previewSourceLicenseHashId.innerHTML = userData.licenseHash || notSelectedYet;


    // extra license URIs
    $('#previewLicenseUrlsId').empty();
    if (userData.licenses.length > 1) {
        for (let i = 1; i < userData.licenses.length; i++) {
            app.addLicenseToPreview(userData.licenses[i].url);
        }
    } else {
        previewLicenseUrlsId.innerHTML = none;
    }


    previewEditionNumberId.innerHTML = userData.collectionEditionNumber || none;
    previewEditionTotalId.innerHTML = userData.collectionEditionTotal || none;

    previewFeeId.innerHTML = !userData.fee ? required : `${userData.fee} XCH (${app.convertXchToMojoString(userData.fee)} mojo)`;

    // previewMintingToolId.innerHTML = userData.mintingTool || "Mintr by NFTr.pro";

    // optional collection attributes
    $('#previewCollectionOptionalId > div').remove();
    app.previewLabelAndValue("Icon", userData.collectionIcon);
    app.previewLabelAndValue("Banner", userData.collectionBanner);
    app.previewLabelAndValue("Twitter", userData.collectionTwitter);
    app.previewLabelAndValue("Website", userData.collectionWebsite);
    app.previewLabelAndValue("Discord", userData.collectionDiscord);
    app.previewLabelAndValue("Instagram", userData.collectionInstagram);
    app.previewLabelAndValue("Medium", userData.collectionMedium);
    app.previewLabelAndValue("Series Number", userData.seriesNumber);
    app.previewLabelAndValue("Series Total", userData.seriesTotal);


    // extra asset URIs
    $('#previewSourceUrlsId').empty();
    if (userData.urls && userData.urls.length > 1) {
        for (let i = 1; i < userData.urls.length; i++) {
            app.addUrlToPreview(userData.urls[i].url);
        }
    } else {
        previewSourceUrlsId.innerHTML = none;
    }


    // attributes (traits)
    if (userData.attributes && userData.attributes.length > 0) {
        $('#previewTraitsTable').removeClass("hidden");
        $('#previewTraitsId tr').remove();
        for (let i = 0; i < userData.attributes.length; i++) {
            app.addTraitToPreview(userData.attributes[i].trait_type, userData.attributes[i].value, userData.attributes[i].min_value, userData.attributes[i].max_value, userData.attributes[i].rarity, userData.attributes[i].percent);
        }
    } else $('#previewTraitsTable').addClass("hidden");


    // extra metadata URIs
    $('#previewMetadataUrlsId').empty();
    if (userData.metadataUris && userData.metadataUris.length > 1) {
        for (let i = 1; i < userData.metadataUris.length; i++) {
            app.addMetadataUriToPreview(userData.metadataUris[i].url);
        }
    } else {
        previewMetadataUrlsId.innerHTML = none;
    }

}

app.previewLabelAndValue = function (label, value) {
    if (!value) return;

    app.$previewCollectionOptionalId = app.$previewCollectionOptionalId ? app.$previewCollectionOptionalId : $('#previewCollectionOptionalId');

    // replace placeholder text with required values
    let template = app.previewOptionalLink.replace(/LABEL_VALUE/g, label);
    template = template.replace(/VALUE_VALUE/g, value);


    template = template.replace(/LABEL_HEADER/g, app.dict[app.lang].label);
    template = template.replace(/VALUE_HEADER/g, app.dict[app.lang].value);

    app.$previewCollectionOptionalId.append(template);
}


// add trait element to preview html
app.addLicenseToPreview = function (url = '') {

    app.$previewLicenseUrlsId = app.$previewLicenseUrlsId ? app.$previewLicenseUrlsId : $("#previewLicenseUrlsId");
    let template = app.previewUrlTemplate;
    template = template.replace(/URL_VALUE/g, `<a href="${url}" target="_blank">${url}</a>`);
    app.$previewLicenseUrlsId.append(template);
}

// add trait element to preview html
app.addUrlToPreview = function (url = '') {

    app.$previewSourceUrlsEl = app.$previewSourceUrlsEl ? app.$previewSourceUrlsEl : $("#previewSourceUrlsId");

    let template = app.previewUrlTemplate;
    template = template.replace(/URL_VALUE/g, `<a href="${url}" target="_blank">${url}</a>`);
    app.$previewSourceUrlsEl.append(template);
}

// add trait element to preview html
app.addMetadataUriToPreview = function (url = '') {

    app.$previewMetadataUrlsEl = app.$previewMetadataUrlsEl ? app.$previewMetadataUrlsEl : $("#previewMetadataUrlsId");

    let template = app.previewUrlTemplate;
    template = template.replace(/URL_VALUE/g, `<a href="${url}" target="_blank">${url}</a>`);
    app.$previewMetadataUrlsEl.append(template);
}

// add trait element to preview html
app.addTraitToPreview = (label = '', value = '', min = '-', max = '-', rarity = '-', percent = "-") => {

    if (!app.$traitsDivEl) app.$traitsDivEl = $("#previewTraitsId");
    // console.log("[ addTraitToPreview ] min: " + min + " max: " + max);
    // hide null values
    if (min === 0 && max === 0) {
        min = "-";
        max = "-";
    }

    // replace placeholder text with required values
    let template = app.previewTraitTemplate;
    template = template.replace(/LABEL_VALUE/g, label);
    template = template.replace(/VALUE_VALUE/g, value);

    /* let perc = 0;
     if (rarity !== "-") {
         perc = ((rarity / app.state.collection.highestTraitRarityScore) * 100).toFixed(2);
     }*/


    template = template.replace(/MIN_VALUE/g, min);
    template = template.replace(/MAX_VALUE/g, max);
    template = template.replace(/RARITY_VALUE/g, rarity !== "-" ? percent + "% (" + rarity + ")" : "-");
    app.$traitsDivEl.append(template);
}

