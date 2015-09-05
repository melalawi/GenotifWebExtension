var GTE_SCRIPT = (function () {

"use strict";

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

        adaptor.sendMessage('geneRequest:' + gene, gene, function(response){
            var api = qTip.qtip('api');

            api.set('content.text', response);
        });
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
            //show by default, hide when user clicks outside of the tooltip
            show: { ready: true },
            hide: {
                event: 'unfocus',
                fixed: true
            },
            events: {
                hide: function (event, api) {
                    api.destroy(true);
                    qTip.remove();
                    qTip = null;
                }
            },

            content: {
                title: text,
                text: text
            },
            position: {
                my: 'top left',  // Position my top left...
                at: 'bottom right', // at the bottom right of...
                target: qTip // x, y
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
            }

            previousRange = range;
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
            top: rangeRect.bottom - documentRect.top,
            left: rangeRect.left - documentRect.left
        };
    };
}

return {
    ContentScript: ContentScript
};

//module namespace
}());