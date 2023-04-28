// namespace
if (typeof app === `undefined`) app = {};

app.copyNftMetadataToUserData = function (data, userData) {

    if (data.name !== null && data.name) userData.nftName = data.name;

    if (data.description !== null && data.description) userData.nftDescription = data.description;

    if (data.sensitive_content !== null && data.sensitive_content) userData.nftIsSensitive = data.sensitive_content;

    if (data.attributes !== null && data.attributes && data.attributes.length > 0)
        userData.attributes = data.attributes;

}


app.copyMetadataToMetadata = (fromObj, toObj, overwriteAll = false) => {

    // console.log("[ copyMetadataToMetadata ] fromObj: ", fromObj);
    // console.log("[ copyMetadataToMetadata ] toObj: ", toObj);
    if (fromObj === undefined)
        return toObj;

    const overrides = app.state.collection.userData.overrides || app.defaultOverrideCheckboxValues;


    app.copyAttributeValueIfNeeded(fromObj, toObj, overwriteAll, overrides.nftNameCheckboxId, "nftName", "nftName");
    app.copyAttributeValueIfNeeded(fromObj, toObj, overwriteAll, overrides.nftDescriptionCheckboxId, "nftDescription");
    app.copyAttributeValueIfNeeded(fromObj, toObj, overwriteAll, overrides.seriesNumberCheckboxId, "seriesNumber");
    app.copyAttributeValueIfNeeded(fromObj, toObj, overwriteAll, overrides.seriesTotalCheckboxId, "seriesTotal");
    app.copyAttributeValueIfNeeded(fromObj, toObj, overwriteAll, overrides.nftIsSensitiveCheckboxId, "nftIsSensitive");
    app.copyAttributeValueIfNeeded(fromObj, toObj, overwriteAll, overrides.royaltyPercentCheckboxId, "royaltyPercent");
    app.copyAttributeValueIfNeeded(fromObj, toObj, overwriteAll, overrides.royaltyAddressCheckboxId, "royaltyAddress");
    app.copyAttributeValueIfNeeded(fromObj, toObj, overwriteAll, overrides.targetAddressCheckboxId, "nftAddress");
    app.copyAttributeValueIfNeeded(fromObj, toObj, overwriteAll, overrides.didAddressCheckboxId, "didAddress");
    app.copyAttributeValueIfNeeded(fromObj, toObj, overwriteAll, overrides.collectionIdCheckboxId, "collectionId");
    app.copyAttributeValueIfNeeded(fromObj, toObj, overwriteAll, overrides.collectionNameCheckboxId, "collectionName");
    app.copyAttributeValueIfNeeded(fromObj, toObj, overwriteAll, overrides.collectionDescriptionCheckboxId, "collectionDescription");
    app.copyAttributeValueIfNeeded(fromObj, toObj, overwriteAll, overrides.iconCheckboxId, "collectionIcon");
    app.copyAttributeValueIfNeeded(fromObj, toObj, overwriteAll, overrides.bannerCheckboxId, "collectionBanner");
    app.copyAttributeValueIfNeeded(fromObj, toObj, overwriteAll, overrides.twitterCheckboxId, "collectionTwitter");
    app.copyAttributeValueIfNeeded(fromObj, toObj, overwriteAll, overrides.websiteCheckboxId, "collectionWebsite");
    app.copyAttributeValueIfNeeded(fromObj, toObj, overwriteAll, overrides.discordCheckboxId, "collectionDiscord");
    app.copyAttributeValueIfNeeded(fromObj, toObj, overwriteAll, overrides.instagramCheckboxId, "collectionInstagram");
    app.copyAttributeValueIfNeeded(fromObj, toObj, overwriteAll, overrides.mediumCheckboxId, "collectionMedium");
    app.copyAttributeValueIfNeeded(fromObj, toObj, overwriteAll, overrides.editionNumberCheckboxId, "collectionEditionNumber");
    app.copyAttributeValueIfNeeded(fromObj, toObj, overwriteAll, overrides.editionCountCheckboxId, "collectionEditionTotal");
    app.copyAttributeValueIfNeeded(fromObj, toObj, overwriteAll, overrides.walletIndexCheckboxId, "walletId");
    app.copyAttributeValueIfNeeded(fromObj, toObj, overwriteAll, overrides.mintFeeCheckboxId, "fee");
    app.copyAttributeValueIfNeeded(fromObj, toObj, overwriteAll, overrides.walletFingerprintCheckboxId, "walletFingerprint");
    app.copyAttributeValueIfNeeded(fromObj, toObj, overwriteAll, overrides.nftStorageApiTokenCheckboxId, "nftStorageApiToken");
    app.copyAttributeValueIfNeeded(fromObj, toObj, overwriteAll, null, "metadataHash");
    app.copyAttributeValueIfNeeded(fromObj, toObj, overwriteAll, null, "assetHash");
    app.copyAttributeValueIfNeeded(fromObj, toObj, overwriteAll, null, "licenseHash");
    app.copyAttributeValueIfNeeded(fromObj, toObj, overwriteAll, null, "sourceLicenseFileName");
    app.copyAttributeValueIfNeeded(fromObj, toObj, overwriteAll, null, "licenseImageUrl");
    app.copyAttributeValueIfNeeded(fromObj, toObj, overwriteAll, null, "licenses");
    toObj.licenses = fromObj.licenses;

    if (fromObj.attributes && fromObj.attributes.length > 0) {
        if (overwriteAll) {
            toObj.attributes = JSON.parse(JSON.stringify(fromObj.attributes));
        } else {
            if (!toObj.attributes) toObj.attributes = [];
            app.copyAttributes(fromObj.attributes, toObj.attributes);
        }
    }


    return toObj;
}

app.copyAttributes = (fromObj, toObj, overwriteAll = false, varName = "trait_type") => {
    // console.log(`[ copyAttributes ] fromObj: `, fromObj);

    // if (fromObj && fromObj.length > 0) {
    for (let i = 0; i < fromObj.length; i++) {
        let obj = toObj.find(o => o[varName] === fromObj[i][varName]);
        if (obj) {
            if (overwriteAll)
                obj = fromObj[i];
        } else {
            toObj.push(fromObj[i]);
        }
    }
    // }
}

app.copyAttributeValueIfNeeded = function (sourceObj, targetObj, overwriteAll, customOverride, sourceAttrName, targetAttrName = "") {

    let overwrite = overwriteAll && (customOverride === undefined || customOverride === null ? overwriteAll : customOverride);
    // console.log(`[ copyAttributeValueIfNeeded ] targetAttrName: ${targetAttrName} - overwrite: ${overwrite} - overwriteAll: ${overwriteAll}  - customOverride: ${customOverride} `);
    if (targetAttrName === "") {
        if (sourceObj[sourceAttrName] !== null && (overwrite || (targetObj[sourceAttrName] === undefined || targetObj[sourceAttrName].length < 1))) {
            targetObj[sourceAttrName] = sourceObj[sourceAttrName];
        }
    } else {
        if (sourceObj[sourceAttrName] !== null && (overwrite || (targetObj[sourceAttrName] === undefined || targetObj[targetAttrName].length < 1))) {
            targetObj[targetAttrName] = sourceObj[sourceAttrName];
        }
    }
}

