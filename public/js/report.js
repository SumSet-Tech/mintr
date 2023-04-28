// namespace
if (typeof app === `undefined`) app = {};
if (typeof app.state === `undefined`) app.state = {};
if (typeof app.state.collection === `undefined`) app.state.collection = {};
if (typeof app.state.transcoding === `undefined`) app.state.transcoding = {};

app.wordsThatMeanNone = ["none", "", "blank", "empty", "missing", "no"];

app.doUpdateCollectionReport = (collectionId) => {

    // console.log("[ doUpdateCollectionReport ]  MUST CALL THIS LESS OFTEN!!!!!");

    app.db.open().then(function () {

        return app.db.assets
            .where('collectionId')
            .equals(collectionId)
            .toArray();

    }).then(async assets => {

        let reportData = {};

        // count
        for (const asset of assets) {

            if (!asset.metadata) continue;

            if (asset.metadata.attributes) {
                // console.log("asset.metadata.attributes ", asset.metadata.attributes);
                for (const attribute of asset.metadata.attributes) {
                    // console.log("attribute: ", attribute);
                    if (attribute.isInsertedLink || app.wordsThatMeanNone.indexOf(attribute.value.toLowerCase()) > -1) continue;

                    if (reportData[attribute.trait_type]) {
                        reportData[attribute.trait_type].count++;
                    } else {
                        reportData[attribute.trait_type] = {count: 1, values: {}, name: attribute.trait_type};
                    }

                    if (reportData[attribute.trait_type].values[attribute.value]) {
                        reportData[attribute.trait_type].values[attribute.value].count++;
                    } else {
                        reportData[attribute.trait_type].values[attribute.value] = {count: 1};
                    }

                }
            }

        }

        app.state.collection.reportData = reportData;

        // rarity scores and trait counts
        for (let attribute in app.state.collection.reportData) {
            let traitCount = 0;
            app.state.collection.reportData[attribute].rarityScore = (1 / (app.state.collection.reportData[attribute].count / assets.length)).toFixed(2)
            for (let value in app.state.collection.reportData[attribute].values) {
                traitCount++;
                app.state.collection.reportData[attribute].values[value].rarityScore = (1 / (app.state.collection.reportData[attribute].values[value].count / assets.length)).toFixed(2)
                app.state.collection.reportData[attribute].values[value].percentWithThisTrait = ((app.state.collection.reportData[attribute].values[value].count / assets.length) * 100).toFixed(2)
            }
            app.state.collection.reportData[attribute].traitCount = traitCount;
        }


        await app.saveRarityScoresForNfts(assets);
        await app.saveCurrentCollectionReportToDb();

        app.drawCollectionPreviewTraitsTable();

    }).catch(Dexie.MissingAPIError, function () {
        console.log("Couldn't find indexedDB API");
    });
}

app.saveRarityScoresForNfts = (assets) => {
    // rarityScore,
    // console.log("[ saveRarityScoresForNfts ]");

    // save report data
    // app.state.collection.reportData

    // console.log("---------------");
    // console.log(app.state.collection.reportData);


    return new Promise((resolve, reject) => {

        app.state.collection.highestNftRarityScore = 0;
        app.state.collection.highestTraitRarityScore = 0;

        // write rarity score for each NFT
        for (const asset of assets) {

            if (!asset.metadata) continue;

            let rarityTotal = 0;
            if (asset.metadata.attributes) {
                for (const attribute of asset.metadata.attributes) {
                    if (attribute.isInsertedLink || app.wordsThatMeanNone.indexOf(attribute.value.toLowerCase()) > -1) continue;
                    attribute.rarity = app.getRarityScoreFromReportData(attribute.trait_type, attribute.value);
                    attribute.percent = app.getPercentWithThisTraitFromReportData(attribute.trait_type, attribute.value);
                    rarityTotal += parseFloat(attribute.rarity);

                    if (app.state.collection.highestTraitRarityScore < attribute.rarity) app.state.collection.highestTraitRarityScore = attribute.rarity;
                }
            }
            if (app.state.collection.highestNftRarityScore < rarityTotal) app.state.collection.highestNftRarityScore = rarityTotal;


            asset.metadata.rarityScore = rarityTotal;
            asset.rarityScore = rarityTotal;

        }
        // app.saveStateWithCallback();

        // console.log("assets");
        // console.log(assets);

        assets.sort(function (a, b) {
            return a.rarityScore - b.rarityScore
        });
        assets.reverse();

        let rarityRank = 1;

        // add ranking and save
        for (const asset of assets) {

            if (!asset.metadata) continue;

            asset.rarityRank = rarityRank++;
            asset.rarityRankPadded = asset.rarityRank.toString().padStart(10, '0');

            // app.saveRarityToAssetInDb(asset);

            app.addToQueue({priority: 1, action: "saveRarityToAssetInDb", asset: asset});

            app.doNextInQueue();

            app.refreshCatalogNeeded = true;

        }

        resolve();
    });
}


app.saveCurrentCollectionReportToDb = () => {

    return new Promise((resolve, reject) => {

        resolve();

    });
}

app.saveRarityToAssetInDb = (asset, callback = null) => {
    // console.log("[ saveRarityToAssetInDb ] asset: ", asset)

    let asyncWrite = Dexie.async(function* () {
        try {
            yield app.db.assets
                .where('id')
                .equals(asset.id)
                .modify({
                    rarityRank: asset.rarityRank,
                    rarityRankPadded: asset.rarityRankPadded,
                    rarityScore: asset.rarityScore,
                    metadata: asset.metadata
                });

        } finally {
            // console.log("WROTE TO ID: "+asset.id);
            if (callback !== null) callback();
        }
    });

    asyncWrite().catch(e => console.error(e));
}

app.getRarityScoreFromReportData = (trait = "", value = "") => {
    return app.state.collection.reportData[trait].values[value].rarityScore;
}
app.getPercentWithThisTraitFromReportData = (trait = "", value = "") => {
    return app.state.collection.reportData[trait].values[value].percentWithThisTrait;
}

app.getFilterString = (filterTerm) => {
    filterTerm = filterTerm.replaceAll(" ", "");
    filterTerm = filterTerm.replaceAll(",", "");
    filterTerm = filterTerm.replaceAll("+", "");
    filterTerm = filterTerm.replaceAll("&", "");
    return filterTerm.toLowerCase();
}

app.searchTermDelimiter = "_";

app.drawCollectionPreviewTraitsTable = () => {

    let traitAccordianHtml = "";

    let searchParts = app.currentSearchTerm.split("_");
    let traitCount = 0;
    let index = 0;
    for (const attribute in app.state.collection.reportData) {

        let template = app.collectionEditorTraitAccordianItemTemplate;
        let attributeName = app.getFilterString(app.state.collection.reportData[attribute].name);
        let attributeSelected = app.getFilterString("attribute" + attributeName) === searchParts[0];
        let traitSelected = app.getFilterString(attributeName) === searchParts[0];


        template = template.replaceAll(/INDEX/g, index++);
        template = template.replaceAll(/NAME/g, (attributeSelected || traitSelected ? "<b>" + attribute + "</b>" : attribute) + " (" + app.state.collection.reportData[attribute].traitCount + ")");


        template = template.replaceAll(/COUNT/g, app.state.collection.reportData[attribute].count);
        template = template.replaceAll(/RARITY/g, app.state.collection.reportData[attribute].rarityScore);

        template = template.replaceAll(/ACCORDIAN_HEADER_COLLAPSED_CLASS/g, attributeSelected || traitSelected ? "" : "collapsed");

        template = template.replaceAll(/ACCORDIAN_HEADER_EXPANDED/g, traitSelected ? "true" : "false");


        template = template.replaceAll(/ACCORDIAN_ITEM_COLLAPSED_CLASS/g, traitSelected ? "show" : "");

        template = template.replaceAll(/FILTER/g, app.getFilterString("attribute" + app.state.collection.reportData[attribute].name));


        let traitsHtml = "";
        for (let value in app.state.collection.reportData[attribute].values) {
            let template2 = app.collectionEditorTraitRowTemplate;
            let traitName = app.getFilterString(value);
            let selectedTrait = traitName === searchParts[1];

            template2 = template2.replaceAll(/NAME/g, selectedTrait ? "<b>" + value + "</b>" : value);
            template2 = template2.replaceAll(/COUNT/g, app.state.collection.reportData[attribute].values[value].count);
            template2 = template2.replaceAll(/RARITY/g, app.state.collection.reportData[attribute].values[value].rarityScore);
            template2 = template2.replaceAll(/FILTER/g, app.getFilterString(app.state.collection.reportData[attribute].name) + app.searchTermDelimiter + app.getFilterString(value));
            traitsHtml += template2;
        }

        traitCount++;
        template = template.replaceAll(/TRAITROWS/g, traitsHtml);

        traitAccordianHtml += template;

    }

    app.$noTraitsToDisplayId = app.$noTraitsToDisplayId || $("#noTraitsToDisplayId");
    if (traitCount > 0)
        app.$noTraitsToDisplayId.addClass("hidden");
    else
        app.$noTraitsToDisplayId.removeClass("hidden");

    collectionEditorTraitsAccordianId.innerHTML = traitAccordianHtml;

}