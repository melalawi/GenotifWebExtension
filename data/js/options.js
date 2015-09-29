(function(){
    
"use strict";

var defaultOrganism = "human";

$(document).ready(function(){
    loadOptions();
});

function loadOptions() {
	var selector = $('#organismSelector');
    
    chrome.runtime.sendMessage({message: 'getExtensionSettings'}, function(response) {
        selector.val(response.settings.selectedOrganism);
    });
    
    selector.on('change', function() {
        chrome.extension.sendMessage({message: 'organismChange', data: this.value});
    });
}

}());