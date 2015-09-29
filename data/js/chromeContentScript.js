(function() {

"use strict";

var messageListeners = {},
    contentScript,
    adaptor;

adaptor = {
    localDirectory: function(path) {
        return chrome.extension.getURL('data/' + path);
    },

    sendMessage: function(message, data, onResponse) {
        oneTimeMessage(message, onResponse);

        chrome.runtime.sendMessage({message: message, data: data});
    }
};

function initialize(settings) {
    contentScript = new GTE_SCRIPT.ContentScript(adaptor);
    contentScript.initialize(settings);
    
    chrome.runtime.onMessage.addListener(function(response, sender) {
        if (response.message === 'organismChange') {
            contentScript.changeSelectedOrganism(response.data);
        }
    });
}

function oneTimeMessage(message, callback) {
    var onReceived = function(response) {
        if (response.message === message) {
            chrome.runtime.onMessage.removeListener(messageListeners[message]);
            delete messageListeners[message];

            callback(response.data);
        }
    };

    messageListeners[message] = onReceived;

    chrome.runtime.onMessage.removeListener(messageListeners[message]);
    chrome.runtime.onMessage.addListener(messageListeners[message]);
}

oneTimeMessage('extensionSettings', initialize);
})();