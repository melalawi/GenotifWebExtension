"use strict";

var background = require("lib/firefoxBackground"),
    simplePrefs = require("sdk/simple-prefs"),
    tabs = require("sdk/tabs"),
    self = require("sdk/self");

background.initialize();

//options
simplePrefs.on("accessSettings", openOptionsPage);

function openOptionsPage() {
}