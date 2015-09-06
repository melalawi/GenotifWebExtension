//need to rework callback script
var UUGE_FIREFOX = (function(){

"use strict";

const URL_REGEX = /\b(http:\/\/|https:\/\/)/g;

exports.initialize = function() {
    manager = background.generateManager(adaptor);
    manager.initialize();
};

var background = require("lib/background"),
    tabs = require("sdk/tabs"),
    self = require("sdk/self"),
    manager,
    callbackListener,
    adaptor;

const contentScriptOptions = {"parentDirectory" : self.data.url(''), versionNumber: self.version};

adaptor = {
    scriptFile: 'js/firefoxContentScript.js',

    localDirectory: function (url) {
        return self.data.url(url);
    },

    getTabURL: function(tab) {
        return tab.url;
    },

    initializeTab: function(tab, files, message) {
        //add ./ to each path or else firefox yells at you
        for (var array in files) {
            if (files.hasOwnProperty(array)) {
                for (var fileIndex = 0; fileIndex < files[array].length; ++fileIndex) {
                    files[array][fileIndex] = './' + files[array][fileIndex];
                }
            }
        }

        require("sdk/page-mod").PageMod({
            include: "*",
            contentScriptWhen: "end",
            contentStyleFile: files.css,
            contentScriptFile: files.js,
            contentScriptOptions: contentScriptOptions,
            onAttach: function(worker) {
                this.port.emit(message.message, message.data);

                worker.port.on('contentScriptMessage', function(data) {
                    if (callbackListener) {
                        callbackListener(data, worker);
                    }
                });
            }
        });
    },

    getLoadedTabs: function(callback) {
        var tabQueue = [];

        for (let tab of tabs) {
            if (tab.url.match(URL_REGEX)) {
                tabQueue.push(tab);
            }
        }

        callback(tabQueue);
    },

    initializeTabListener: function(callback) {
        tabs.on('ready', function(tab){
            if (tab.url.match(URL_REGEX)) {
                callback(tab);
            }
        });

    },

    storageLoad: function(onLoad){
        onLoad(require("sdk/simple-storage").storage);
    },
        
    storageSave: function(data){
        require("sdk/simple-storage").storage = data;
    },

    sendMessage: function(worker, message, data) {
        worker.port.emit(message, data);
    },

    messageListener: function(backgroundCallback) {
        callbackListener = function(data, worker) {
            if (callbackListener.callback) {
                callbackListener.callback(worker, data.message, data.data, function(returnMessage){
                    worker.port.emit(returnMessage.message, returnMessage.data);
                });
            }
        };

        callbackListener.callback = backgroundCallback;
    },

    XMLRequest: function(url, onLoad, onError) {
        var REQUEST = require("sdk/request").Request({
            url: url,
            overrideMimeType: "text/plain; charset=latin1",
            onComplete: function (response) {
                if (response.status === 200) {
                    onLoad(response.text);
                } else {
                    onError();
                }

            }
        });

        REQUEST.get();
    }
};

//firefox namespace
}());