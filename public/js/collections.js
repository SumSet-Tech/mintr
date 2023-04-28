// namespace
if (typeof app === `undefined`) app = {};
if (typeof app.state === `undefined`) app.state = {};
if (typeof app.state.collection === `undefined`) app.state.collection = {};


app.initCollectionsView = function () {

    app.$collectionsListContainerId = $("#collectionsListContainerId");

    $("#okNewCollectionModalButtonId").click(function () {
        app.doNewCollection(newCollectionNameId.value, newCollectionDescriptionId.value);
        app.drawCollectionsList();
    });

    app.drawCollectionsList();
}

app.drawCollectionsList = function () {

    app.$collectionsListContainerId.children().remove();

    let collections = app.db.collections
        .orderBy("id").reverse().toArray().then(collections => {

            if (collections.length > 0) {
                $("#noCollectionMessageId").addClass("hidden");
                $("#collectionsListContainerId").removeClass("hidden");
            } else {
                $("#noCollectionMessageId").removeClass("hidden");
                $("#collectionsListContainerId").addClass("hidden");
            }
            for (let i = 0; i < collections.length; i++) {

                let iconUrl = collections[i].icon || collections[i].userData.collectionIcon;

                let template = app.collectionsViewListItemTemplate;
                template = template.replace(/COLLECTION_NAME/g, collections[i].userData.collectionName);
                template = template.replace(/COLLECTION_IMG_SRC/g, iconUrl || "/img/placeholder_image.svg");
                // template = template.replace(/COLLECTION_IMG_SRC/g, collections[i].icon);
                template = template.replace(/COLLECTION_DESCRIPTION/g, collections[i].userData.collectionDescription);
                template = template.replace(/COLLECTION_ID/g, collections[i].id);
                $("#gridItemsId").append(template);

                app.$collectionsListContainerId.append(template);
            }

            $(".editCollectionButton").click(async function (e) {

                if (typeof app.state.collection === `undefined`) app.state.collection = {};
                app.state.collection.currentId = $(this).attr('data-id');

                await app.loadCurrentCollectionFromDb();

                // save the state, then go to collection
                await app.saveState();
                window.location.href = "../collection";
            });
        });
}

app.doNewCollection = function (name, description) {

    let newUserData = {};
    newUserData.collectionName = name;
    newUserData.collectionDescription = description;

    app.db.collections.add({userData: newUserData});
}

app.collectionsViewListItemTemplate = `
<a href="#" class="collectionsViewListItem list-group-item list-group-item-action d-flex gap-3 py-3" aria-current="true">

    <img src="COLLECTION_IMG_SRC" class="img-fluid" alt="Thumbnail"  width="100" height="100" crossorigin="anonymous">
    <div class="d-flex gap-2 w-100 justify-content-between">
        <div>
            <h5 class="mb-0">COLLECTION_NAME</h5>
            <p class="mb-0 opacity-75">COLLECTION_DESCRIPTION</p>
        </div>
        <button type="button" class="btn btn-light editCollectionButton" data-id="COLLECTION_ID">Edit</button>
    </div>
</a>
`;


$(document).ready(function () {
    app.initCollectionsView();
});