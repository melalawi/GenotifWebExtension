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

var TAB_SCRIPTS = {
    js: ['js/jquery-2.1.4.min.js', 'js/jquery.qtip.min.js', 'js/script.js'],
    css: ['css/jquery.qtip.css']
};

const QUERY_URL = "http://www.uniprot.org/uniprot/GENE_ID.xml";
const GENE_FILE = "humanGenes.json";

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
                adaptor.initializeTab(tab, TAB_SCRIPTS, {message: 'geneData', data: backendManager.getJSON()});
            }
        }
    }
}

function BackendManager(browserAdaptor) {
    var geneJSON,
        adaptor = browserAdaptor;

    //Loads settings via the provided adaptor, then goes on to load emoticons
    this.initializeBackend = function(deferred) {
        if (!adaptor) {
            throw "Error in BackendManager: Incompatible Adaptor";
        } else {
            var geneFile = adaptor.localDirectory(GENE_FILE);

            adaptor.XMLRequest(geneFile, function(responseText){
                geneJSON = JSON.parse(responseText);

                deferred.resolve();
            });
        }
    };

    this.getJSON = function() {
        return geneJSON;
    };

    this.lookupGene = function(geneID, response) {
        var lookupURL = QUERY_URL.replace('GENE_ID', geneID);

        //need to add intermediate step
        adaptor.XMLRequest(lookupURL, response)
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