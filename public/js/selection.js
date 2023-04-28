// namespace
if (typeof app === `undefined`) app = {};
if (typeof app.state === `undefined`) app.state = {};
if (typeof app.state.selection === `undefined`) app.state.selection = {};

app.setSelection = (arrayOfIndexes) => {
    return new Promise(async (resolve, reject) => {
        app.state.selection.arrayOfIndexes = arrayOfIndexes;

        app.updateSelectButton();
        app.updateAllGridItemsSelectedState();
        await app.saveState();
        app.updateUiWithSelection();
        resolve();
    })
}

// called by the click event of a grid item
app.toggleGridItemSelection = element => {

    let $itemElement = $(element).find('input:checkbox:first'), newCheckedState = !$itemElement.prop('checked');

    $itemElement.prop('checked', newCheckedState);

    app.setItemSelection($(element).data("index"), newCheckedState);
}


app.updateAllGridItemsSelectedState = () => {
    if (!app.state.selection)
        return;

    app.$gridItemsId = app.$gridItemsId || $("#gridItemsId");
    app.$gridItemsId.find('input:checkbox').prop('checked', false);

    // check all indexes that match the arrayOfIndexes
    for (let i = 0; i < app.state.selection.arrayOfIndexes.length; i++) {
        app.$gridItemsId
            .find(`[data-index='${app.state.selection.arrayOfIndexes[i]}']`)
            .find('input:checkbox:first')
            .prop('checked', true);
    }
}


app.initSelectionIfNeeded = () => {
    if (typeof app.state.selection === `undefined`) app.state.selection = {};
    if (typeof app.state.selection.arrayOfIndexes === `undefined`) {
        app.state.selection.arrayOfIndexes = [];
        // if (app.state.selection && app.state.selection.arrayOfIndexes)
        //     app.state.selection.arrayOfIndexes = app.state.selection.arrayOfIndexes;
    }
}

app.setItemSelection = (index, checked) => {
    app.initSelectionIfNeeded();
    if (checked) app.addItemToSelection(index); else app.removeItemFromSelection(index);

    app.updateUiWithSelection();
}

app.updateUiWithSelection = async () => {
    app.drawItemCountHtml();
    // app.state.selection = app.state.selection;
    await app.saveState();
}

app.addItemToSelection = (index) => {
    const found = app.state.selection.arrayOfIndexes.includes(index);
    if (found) return;
    app.state.selection.arrayOfIndexes.push(index);
    app.updateUiWithSelection();
}

app.removeItemFromSelection = (index) => {
    const found = app.state.selection.arrayOfIndexes.includes(index);
    if (!found) return;
    app.removeItemOnce(app.state.selection.arrayOfIndexes, index);
    app.updateUiWithSelection();
}

app.selectNone = () => {
    app.state.selection.arrayOfIndexes = [];
    $("#gridItemsId").find('input:checkbox').prop('checked', false);
}

app.selectionEnabled = false;

app.doAddSelectionToBatch = () => {
    // console.log("[ doAddSelectionToBatch ]")
}

app.doToggleSelectMode = () => {
    app.selectionEnabled = !app.selectionEnabled;
    app.updateSelectMode();
}
app.updateSelectMode = () => {
    // console.log("[ updateSelectMode ] enabled: " + app.selectionEnabled);
    if (app.selectionEnabled === true) {
        app.enableSelectMode();
    } else {
        app.disableSelectMode();
    }
}

app.enableSelectMode = () => {
    $('body').addClass("selectModeEnabled");
    $('#multiSelectCheckboxId').prop('checked', true);
    app.selectionEnabled = true;

}

app.disableSelectMode = () => {
    $('body').removeClass("selectModeEnabled");
    $('#multiSelectCheckboxId').prop('checked', false);
    app.selectionEnabled = false;

}


app.updateSelectButton = () => {
    if (app.state.selection && app.state.selection.allSelected) {
        selectAllButtonId.innerHTML = "Deselect All";
    } else {
        selectAllButtonId.innerHTML = "Select All";
    }
}

app.updateSelectShowButton = () => {
    if (app.state.selection.showSelected) {
        showAllButtonId.innerHTML = "Show All";
    } else {
        showAllButtonId.innerHTML = "Show Selected";
    }
}

// Select All / Deselect All Button
app.doSelectButton = async () => {

    app.state.selection.arrayOfIndexes = [];
    if (app.state.selection.allSelected) {
        app.state.selection.allSelected = false;
    } else {
        let assets = await app.getAssetsForCurrentFilter();
        for (const asset in assets) {
            app.state.selection.arrayOfIndexes.push(assets[asset].index);
        }
        app.state.selection.allSelected = true;
    }

    app.updateSelectButton();
    app.updateAllGridItemsSelectedState();
    await app.saveState();
    app.updateUiWithSelection();

}

// Show All / Show Selected Button
app.doSelectShowButton = async () => {

    if (app.state.selection.showSelected) {
        app.state.selection.showSelected = false;
    } else {
        app.state.selection.showSelected = true;
    }

    // app.updateSelectShowButton();
    await app.saveState();
}


app.state.selectionListToArray = () => {
    app.state.selection.arrayOfIndexes = app.state.selection.listOfIndexes.split(",");
}


app.removeItemOnce = (array, value) => {
    let index = array.indexOf(value);
    if (index > -1) {
        array.splice(index, 1);
    }
    return array;
}


$('#selectAllButtonId').click(() => app.doSelectButton());
$('#showAllButtonId').click(() => app.doSelectShowButton());
$('#multiSelectButtonId').click(() => app.doToggleSelectMode());
$('#addSelectionToBatchButtonId').click(() => app.doAddSelectionToBatch());