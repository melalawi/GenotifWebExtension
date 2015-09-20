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
    selectedOrganism: 'humanGenes.json'
};

var TAB_SCRIPTS = {
    js: ['js/jquery-2.1.4.min.js', 'js/jquery.qtip.min.js', 'js/script.js'],
    css: ['css/jquery.qtip.css']
};

const QUERY_URL = "http://www.uniprot.org/uniprot/GENE_ID.xml";
const GENE_FILES = [
    'arabidopsisGenes.json',
    'celegansGenes.json',
    'drosphilaGenes.json',
    'humanGenes.json',
    'mouseGenes.json',
    'riceGenes.json',
    'yeastGenes.json',
    'zebrafishGenes.json'
];

function Manager(browserAdaptor) {
    var backendManager,
        adaptor = browserAdaptor,
        genesReady = new Deferred.Deferred();

    genesReady.then(injectContentScripts);

    this.initialize = function() {
        TAB_SCRIPTS.js.push(adaptor.scriptFile);

        backendManager = new BackendManager(adaptor);
        backendManager.initializeBackend(genesReady);

        //listen to tabs
        adaptor.messageListener(messageHandler);
    };

    function messageHandler(tab, message, data, responseCallback) {
        if (message.indexOf('geneRequest') !== -1) {
            backendManager.lookupGene(data, function(response){
                adaptor.sendMessage(tab, message, response)
            });
        } else if (message === 'organismChange') {
            backendManager.saveExtensionSettings({'selectedOrganism': data});
            
            if (genesReady.state() === 'resolved') {
                adaptor.getLoadedTabs(function(queue) {
                    for (var index = 0; index < queue.length; ++index) {
                        adaptor.sendMessage(queue[index], 'organismChange', backendManager.getExtensionSettings());
                    }
                })
            }
        } else if (message === 'getExtensionSettings') {
            responseCallback(backendManager.getExtensionSettings());
        }
    }

    function injectContentScripts() {
        adaptor.getLoadedTabs(serveTabQueue);

        adaptor.initializeTabListener(serveTab);
    }

    //sends data to every tab
    function serveTabQueue(queue) {
        for (var index = 0; index < queue.length; ++index) {
            serveTab(queue[index]);
        }
    }

    function serveTab(tab) {
        if (genesReady.state() === 'resolved') {
            var tabURL = adaptor.getTabURL(tab);

            //just in case, check to make sure url starts with http (chrome isnt good at doing this itself)
            if (tabURL.match(/(^http)/gi)) {
                adaptor.initializeTab(tab, TAB_SCRIPTS, {message: 'extensionSettings', data: backendManager.getExtensionSettings()});
            }
        }
    }
}

function BackendManager(browserAdaptor) {
    var extensionSettings = {
        geneJSONs: {},
        settings: DEFAULT_SETTINGS
    },
    deferredArray = [],
    adaptor = browserAdaptor;

    //Loads settings via the provided adaptor, then goes on to load emoticons
    this.initializeBackend = function(deferred) {
        if (!adaptor) {
            throw "Error in BackendManager: Incompatible Adaptor";
        } else {
            loadOrganismFiles(function(){
                adaptor.storageLoad(function(saved){
                    extensionSettings.settings = sanitizeSettings(saved);
                    
                    deferred.resolve();
                })
            });
        }
    };
    
    function loadOrganismFiles(onComplete) {
        for (var index = 0; index < GENE_FILES.length; ++index) {
            var currentFile = adaptor.localDirectory('json/' + GENE_FILES[index]);

            deferredArray.push(loadCurrentFile(GENE_FILES[index], currentFile));
        }
        
        Deferred.when(deferredArray, function() {
            onComplete();
        });
    }
    
    function loadCurrentFile(organismName, filePath) {
        var fileReady = new Deferred.Deferred();

        adaptor.XMLRequest(filePath, function(responseText){
            extensionSettings.geneJSONs[organismName] = JSON.parse(responseText);
            
            fileReady.resolve();
        });
        
        return fileReady;
    }
    
    this.saveExtensionSettings = function(newSettings) {
        var sanitized = sanitizeSettings(newSettings);
        
        extensionSettings.settings = sanitized;
        
        adaptor.storageSave(sanitized);
    };

    this.getExtensionSettings = function() {
        return extensionSettings;
    };

    this.lookupGene = function(geneID, response) {
        var lookupURL = QUERY_URL.replace('GENE_ID', geneID);

        //need to add intermediate step
        adaptor.XMLRequest(lookupURL, response)
    };
    
    function sanitizeSettings(data) {
        var sanitizedResults = {};

        //iterate through data, only preserving variables that exist in the default as well
        for (var key in DEFAULT_SETTINGS) {
            if (DEFAULT_SETTINGS.hasOwnProperty(key)) {
                sanitizedResults[key] = data !== null && typeof data[key] === typeof DEFAULT_SETTINGS[key] ? data[key] : DEFAULT_SETTINGS[key];
            }
        }
        
        return sanitizedResults;
    }
}

/*************************************/
//in order to bridge communications between background pages in firefox, the addon-sdk utilizes the predefined 'exports' object
//only the functions defined in exports can be 'exported' and used in the other background scripts
//'exports' does not exist in chrome, however, and as a result attempting to call it in chrome will result in a crash
//coupling... levels... rising

//if exports exists, define the background manager that will be accessed in firefoxBackground.js
if (typeof exports === 'object') {
    Deferred = require('lib/deferred');

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