var GTE_SCRIPT = (function () {

"use strict";

var previousRange;

function ContentScript(browserAdaptor) {
    var adaptor = browserAdaptor,
        geneDatabase;

    this.initialize = function(genes) {
        if (genes) {
            geneDatabase = genes;

            //wait for text highlight
            $(document).mouseup(function(){
                var highlighedText = nextHighlightedText();

                if (highlighedText) {
                    processHighlightedText(highlighedText);
                }
            });
        }
    };

    function processHighlightedText(text) {
        //split string by whitespace
        var splitArray = text.trim().split(/\s+/);

        //remove empty strings
        splitArray = splitArray.filter(Boolean);

        //check the first entry for a match
        testGeneID(splitArray[0]);
    }

    function testGeneID(id) {
        if (id) {
            if (geneDatabase.hasOwnProperty(id)) {
                var geneID = geneDatabase[id];

                adaptor.sendMessage('geneRequest:' + geneID, geneDatabase[id], generatePopup)
            }
        }
    }

    function generatePopup(details) {
        //todo: actually generate a popup, loading indicator
        console.log(details);
    }
}

function nextHighlightedText() {
    var text;

    if (typeof window.getSelection !== "undefined") {
        if (window.getSelection().rangeCount) {
            //Only want the first 'range' selected (ie if multiple groups of text are selected)
            var selection = window.getSelection().getRangeAt(0);

            //if anything is selected
            if (selection.startOffset < selection.endOffset) {
                //If this selection is new (ie user didnt simply reselect the same text)
                if (!previousRange || rangeEqualityTest(previousRange, selection) === false) {
                    previousRange = selection;

                    text = selection.toString();
                }
            }
        }
    }

    return text;
}

function rangeEqualityTest(rangeOne, rangeTwo) {
    return rangeOne.compareBoundaryPoints(Range.START_TO_START, rangeTwo) === 0 &&
           rangeOne.compareBoundaryPoints(Range.END_TO_END, rangeTwo) === 0;
}

return {
    ContentScript: ContentScript
};

//module namespace
}());