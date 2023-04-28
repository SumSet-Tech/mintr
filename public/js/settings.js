// namespace
if (typeof app === `undefined`) app = {};
if (typeof app.state === `undefined`) app.state = {};


app.initSettingsView = function () {
    // console.log("[ initSettingsView ]");
    $(document).ready(async function () {
        app.loadState();
    });
}


app.initSettingsView();