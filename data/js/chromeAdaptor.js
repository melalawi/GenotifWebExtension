(function() {

"use strict";

var contentScript = new GTE_SCRIPT.ContentScript();

function initialize(settings) {
    contentScript.initialize(settings);
}

chrome.runtime.onMessage.addListener(function(message) {
    initialize(message);
});

})();