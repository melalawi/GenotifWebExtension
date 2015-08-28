var GTE_BACKGROUND = (function () {

"use strict";

var self = this,
    Deferred;

//non-firefox
//don't like this solution
function generateManager(Def, adaptor) {
    Deferred = Def;

    return new Manager(adaptor);
}

const DEFAULT_SETTINGS = {
};

const MESSAGES = {
    LOAD_SETTINGS: 'load',
    SAVE_SETTINGS: 'saveAll',
    RESET_SETTINGS: 'reset'
};

function Manager(browserAdaptor) {
    var backendManager,
        adaptor = browserAdaptor,
        genesReady = new Deferred.Deferred();

    genesReady.then(/*function*/);

    this.initialize = function() {
        backendManager = new BackendManager(adaptor);
        backendManager.initializeBackend(genesReady);

        //listen to tabs
        adaptor.messageListener(messageHandler);
    };

    function messageHandler(tab, message, data, responseCallback) {
        switch (message) {
            case MESSAGES.LOAD_SETTINGS:
                responseCallback(backendManager.getSettings());
                break;
            case MESSAGES.SAVE_SETTINGS:
                if (backendManager) {
                    var saveConfirmed = new Deferred.Deferred();

                    saveConfirmed.then(function(){
                        adaptor.sendMessage(tab, 'settingsSaved');
                    });

                    backendManager.setSettings(data, saveConfirmed);
                }
                break;
            case MESSAGES.RESET_SETTINGS:
                if (backendManager) {
                    //backendManager.resetData(data);
                }
                break;
            default:
                console.log("Unrecognized content script request: " + message);
            break;
        }
    }

    //sends data to every tab
    function serveTabQueue(queue) {
        for (var index = 0; index < queue.length; ++index) {
            serveTab(queue[index]);
        }
    }

    function serveTab(tab) {
    }

    function isValidURL(tabURL) {
        var found = false,
            filteredURLs = backendManager.getVariable('webFilterList');

        for (var index = 0; index < filteredURLs.length; ++index) {
            //regexify the current URL, replacing all user-provided asterisks with the appropriate wildcard function
            //if no wildcards are present, match the exact url only
            var urlRegex = generateURLRegex(filteredURLs[index].url);

            if (tabURL.match(urlRegex)) {
                found = true;
                break;
            }
        }

        //no urls listed + whitelist mode set should return every url as valid
        return filteredURLs.length === 0 || found === (backendManager.getVariable('webFilterMode') === 'Whitelist');
    }
}

function BackendManager(browserAdaptor) {

}

function generateURLRegex(url) {
    var regex = url;

    //escape any regex problem characters (except asterisk)
    regex = regex.replace(/[\-\[\]\/\{\}\(\)\+\?\.\\\^\$\|]/g, "\\$&");

    //if the http specifier does not exist at the start of the url, append it and the wildcard. Otherwise, append startsWith function
    if (regex.indexOf('http') !== 0) {
        regex = '^http*' + regex;
    } else {
        regex = '^' + regex;
    }

    //replace any asterisks with the appropriate wildcard function
    regex = regex.replace(/\*/g, ".*?");

    //generate regex
    regex = new RegExp(regex + '$', 'i');

    return regex;
}

/*************************************/
//in order to bridge communications between background pages in firefox, the addon-sdk utilizes the predefined 'exports' object
//only the functions defined in exports can be 'exported' and used in the other background scripts
//'exports' does not exist in chrome, however, and as a result attempting to call it in chrome will result in a crash
//coupling... levels... rising

//if exports exists, define the background manager that will be accessed in firefoxBackground.js
if (typeof exports === 'object') {
    Deferred = require('deferred');

    exports.generateManager = function(adaptor) {
        return new Manager(adaptor);
    };
}

/*************************************/


return {
    generateManager: generateManager
};



//module namespace
}());