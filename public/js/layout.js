// namespace
if (typeof app === `undefined`) app = {};


app.previewTraitTemplate = `<tr><td class="wraplong">LABEL_VALUE</td><td class="wraplong">VALUE_VALUE</td><td>MIN_VALUE / MAX_VALUE</td><td>RARITY_VALUE</td></tr>`;

app.previewUrlTemplate = `<div class="urlPreview">URL_VALUE</div>`;

app.previewOptionalLink = `<div><div class="previewHeader">LABEL_VALUE</div><div class="previewValue">VALUE_VALUE</div></div>`;

app.licenseTemplate = `
<div class="row form-floating mb-3"  id="ROWID_row">
    <div class="col-md-10">
        <div class="form-floating">
            <input type="text"
                   id="ROWID_licensesInputId"
                   value="URL_VALUE"
                   class="form-control floatingTextField required"
                   placeholder=""
                   onchange="app.saveFormState()">
            <label for="ROWID_licensesInputId">URI</label>
        </div>
    </div>

    <div class="col-md-2">
        <div class="form-floating">
            <button data-id="ROWID" type="button" onclick="app.removeLicense(this)"
                    class="btn btn-outline-primary btn-sm fillSpace">
                x
            </button>
        </div>
    </div>
</div>`;

app.urlTemplate = `
<div class="row form-floating mb-3"  id="ROWID_row">
    <div class="col-md-10">
        <div class="form-floating">
            <input type="text"
                   id="ROWID_urlInputId"
                   value="URL_VALUE"
                   class="form-control floatingTextField required"
                   placeholder=""
                   onchange="app.saveFormState()">
            <label for="ROWID_urlInputId">URI</label>
        </div>
    </div>

    <div class="col-md-2">
        <div class="form-floating">
            <button data-id="ROWID" type="button" onclick="app.removeUrl(this)"
                    class="btn btn-outline-primary btn-sm fillSpace">
                X
            </button>
        </div>
    </div>
</div>`;

app.metadataTemplate = `
<div class="row form-floating mb-3"  id="ROWID_row">
    <div class="col-md-10">
        <div class="form-floating">
            <input type="text"
                   id="ROWID_urlInputId"
                   value="URL_VALUE"
                   class="form-control floatingTextField required"
                   placeholder=""
                   onchange="app.saveFormState()">
            <label for="ROWID_urlInputId">URI</label>
        </div>
    </div>

    <div class="col-md-2 p-3">
<!--        <div class="form-floating">-->
            <button data-id="ROWID" id="ROWID_url_clearButtonId" type="button" onclick="app.removeMetadataUri(this)"
                    class="btn btn-outline-primary btn-sm fillSpace">X</button>
<!--        </div>-->
    </div>
</div>`;


app.traitTemplate = `
<div class="row form-floating mb-3"  id="ROWID_row">
    <div class="col-md-3 p-1">
        <div class="form-floating">
            <input type="text"
                   id="ROWID_labelInputId"
                   value="LABEL_VALUE"
                   class="label form-control floatingTextField required"
                   placeholder="Label"
                   autocomplete="off">
            <label for="ROWID_labelInputId">LABEL_HEADER</label>
        </div>
    </div>

    <div class="col-md-3 p-1">
        <div class="form-floating">
            <input type="text"
                   id="ROWID_valueInputId"
                   value="VALUE_VALUE"
                   class="value form-control floatingTextField required"
                   placeholder="Value"
                   autocomplete="off">
            <label for="ROWID_valueInputId">VALUE_HEADER</label>
        </div>
    </div>

    <div class="col-md-2 p-1">
        <div class="form-floating">
            <input type="text"
                   id="ROWID_minInputId"
                   value="MIN_VALUE"
                   class="minValue form-control floatingTextField"
                   placeholder="Min"
                   autocomplete="off">
            <label for="ROWID_minInputId">MIN_HEADER</label>
        </div>
    </div>

    <div class="col-md-2 p-1">
        <div class="form-floating">
            <input type="text"
                   id="ROWID_maxInputId"
                   value="MAX_VALUE"
                   class="maxValue form-control floatingTextField"
                   placeholder="Max"
                   autocomplete="off">
            <label for="ROWID_maxInputId">MAX_HEADER</label>
        </div>
    </div>

    <div class="col-md-2 p-1">
        <div class="form-floating p-2 mt-2">
            <button data-id="ROWID" id="ROWID_clearButtonId" type="button" onclick="app.removeTrait(this)"
                    class="btn btn-outline-primary btn-sm fillSpace">
                X
            </button>
        </div>
    </div>
</div>`;

app.traitWithCheckboxTemplate = `
<div class="row form-floating mb-3" id="ROWID_nftDefaults_row">
    <div class="col-md-3 p-1">
        <div class="form-floating">
            <input type="text"
                   id="ROWID_nftDefaults_labelInputId"
                   value="LABEL_VALUE"
                   class="label form-control floatingTextField required"
                   placeholder="Label"
                   autocomplete="off">
            <label for="ROWID_nftDefaults_labelInputId">LABEL_HEADER</label>
        </div>
    </div>

    <div class="col-md-3 p-1">
        <div class="form-floating">
            <input type="text"
                   id="ROWID_nftDefaults_valueInputId"
                   value="VALUE_VALUE"
                   class="value form-control floatingTextField required"
                   placeholder="Value"
                   autocomplete="off">
            <label for="ROWID_nftDefaults_valueInputId">VALUE_HEADER</label>
        </div>
    </div>

    <div class="col-md-2 p-1">
        <div class="form-floating">
            <input type="text"
                   id="ROWID_nftDefaults_minInputId"
                   value="MIN_VALUE"
                   class="minValue form-control floatingTextField"
                   placeholder="Min"
                   autocomplete="off">
            <label for="ROWID_nftDefaults_minInputId">MIN_HEADER</label>
        </div>
    </div>

    <div class="col-md-2 p-1">
        <div class="form-floating">
            <input type="text"
                   id="ROWID_nftDefaults_maxInputId"
                   value="MAX_VALUE"
                   class="maxValue form-control floatingTextField"
                   placeholder="Max"
                   autocomplete="off">
            <label for="ROWID_nftDefaults_maxInputId">MAX_HEADER</label>
        </div>
    </div>

    <div class="col-md-2 p-1">
        <div class="form-floating row p-3">
<!--            <div class="col">-->
                <button data-id="ROWID_nftDefaults" id="ROWID_nftDefaults_clearButtonId" type="button" onclick="app.removeTrait(this,true)"
                        class="btn btn-outline-primary btn-sm fillSpace">X</button>
            <!--</div>
            <div class="col">
                <input type="checkbox" selected class="form-check-input overrideCheckbox traitOverrideCheckbox" id="ROWID_traitCheckboxId">
            </div>-->
        </div>
    </div>
    
</div>`;
