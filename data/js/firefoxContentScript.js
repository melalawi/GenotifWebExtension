(function() {

"use strict";

var messageListeners = {},
    contentScript,
    adaptor;

adaptor = {
    localDirectory: function(path) {
        return self.options.parentDirectory + path;
    },

    sendMessage: function(message, data, onResponse) {
        self.port.once(message, onResponse);
        self.port.emit('contentScriptMessage', {message: message, data: data});
    }
};

function initialize(settings) {
    contentScript = new GTE_SCRIPT.ContentScript(adaptor);
    contentScript.initialize(settings);
}

self.port.once('geneData', initialize);
})();
