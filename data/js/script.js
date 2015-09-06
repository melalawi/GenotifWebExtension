var GTE_SCRIPT = (function () {

"use strict";

const GENE_NAME_SELECTOR = 'protein>recommendedName>fullName';
const GENE_FUNCTION_SELECTOR = 'comment[type="function"]';

var previousRange,
    qTip;

function ContentScript(browserAdaptor) {
    var adaptor = browserAdaptor,
        geneDatabase;

    this.initialize = function(genes) {
        if (genes) {
            geneDatabase = genes;

            //wait for text highlight
            $(document).mouseup(function(){
                var highlightedRange = getNewRange();

                if (highlightedRange) {
                    processHighlightedRange(highlightedRange);
                }
            });
        }
    };

    function processHighlightedRange(range) {
        //split string by whitespace and non-alphanumeric characters
        var text = range.getString(),
            splitArray = text.trim().split(/\s+|\W+/);

        //remove empty strings
        splitArray = splitArray.filter(Boolean);

        if (splitArray.length) {
            //check the first entry for a match (lowercase-ify the string for case-insensitive matching)
            text = splitArray[0].toLowerCase();

            //if found
            if (geneDatabase.hasOwnProperty(text)) {
                generatePopup(range, geneDatabase[text]);
            }
        }
    }

    function generatePopup(range, gene) {
        resetQTip(range, gene);

        setTimeout(function(){
            adaptor.sendMessage('geneRequest:' + gene, gene, function(response){
                var api = qTip.qtip('api'),
                    formattedText = parseGeneXML(response);


                api.set(formattedText);
            });
        }, 250);
    }

    function parseGeneXML(text) {
        var parsedXML = $($.parseXML(text)),
            titleNode = parsedXML.find(GENE_NAME_SELECTOR),
            summaryNode = parsedXML.find(GENE_FUNCTION_SELECTOR),
            result = {};

        result['content.title'] = titleNode.text().trim();
        result['content.text'] = summaryNode.length ? '<b>Function:</b> ' + summaryNode.text().trim() : 'No summary in UniProt.';

        return result;
    }

    function resetQTip(range, text) {
        //destroy previous
        if (qTip) {
            qTip.remove();
        }

        qTip = $('<div >', {class: 'qtip-gene-container'}).css(range.getEndOfRange());

        $(document.body).append(qTip);

        //generate qTip
        qTip.qtip({
            style: { classes: 'qtip-gene' },

            //show by default, hide when user clicks outside of the tooltip
            show: { ready: true },

            hide: {
                event: 'unfocus',
                fixed: true
            },

            events: {
                hide: function (event, api) {
                    api.destroy();
                    qTip.remove();
                    qTip = null;
                }
            },

            content: {
                text: '<img src="' + adaptor.localDirectory('images/loading.gif') + '">'
            },

            position: {
                my: 'bottom center',
                at: 'top center',
                target: qTip,
                viewport: $(window)
            }
        });
    }
}

function getNewRange() {
    var result;

    if (typeof window.getSelection !== "undefined") {
        //if anything is selected
        if (window.getSelection().rangeCount) {
            //Only want the first 'range' selected (ie if multiple groups of text are selected)
            var range = new HighlightedRange(window.getSelection().getRangeAt(0));

            if (range.getString() && range.equalTo(previousRange) === false) {
                result = range;
                previousRange = range;
            } else {
                previousRange = null;
            }
        }
    }

    return result;
}

//custom range object
function HighlightedRange(range) {
    var selectionRange = range,
        rangeRect = selectionRange.getBoundingClientRect();

    this.getRange = function() { return selectionRange; };
    this.getString = function() { return selectionRange.toString(); };

    this.equalTo = function(hRange) {
        var result = false;

        if (hRange instanceof HighlightedRange) {
            var secondRange = hRange.getRange();

            result = selectionRange.compareBoundaryPoints(Range.START_TO_START, secondRange) === 0 &&
                     selectionRange.compareBoundaryPoints(Range.END_TO_END, secondRange) === 0;
        }

        return result;
    };

    this.getEndOfRange = function() {
        var rangeRect = range.getBoundingClientRect(),
            documentRect = document.documentElement.getBoundingClientRect();

        return {
            top: rangeRect.top - documentRect.top,
            left: rangeRect.left - documentRect.left
        };
    };
}

return {
    ContentScript: ContentScript
};

//module namespace
}());