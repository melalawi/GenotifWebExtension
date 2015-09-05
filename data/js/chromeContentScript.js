(function() {

"use strict";

var messageListeners = [],
    contentScript,
    adaptor;

adaptor = {
    sendMessage: function(message, data, onResponse) {
        oneTimeMessage(message, onResponse);

        chrome.runtime.sendMessage({message: message, data: data});
    }
};

function initialize(settings) {
    contentScript = new GTE_SCRIPT.ContentScript(adaptor);
    contentScript.initialize(settings);
}

function oneTimeMessage(message, callback) {
    var onReceived = function(response) {
        if (response.message === message) {
            callback(response.data);

            chrome.runtime.onMessage.removeListener(onReceived);
            messageListeners.splice(messageListeners.indexOf(onReceived), 1);
        }
    };

    messageListeners.push(onReceived);

    chrome.runtime.onMessage.addListener(onReceived);
}

oneTimeMessage('geneData', initialize);
/*
//only listen once
messageListener = function(message) {
    initialize(message);

    chrome.runtime.onMessage.removeListener(messageListener);
};

chrome.runtime.onMessage.addListener(messageListener);
*/
})();