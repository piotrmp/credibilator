'use strict';

// having received a message...
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	// check if it's not coming from a popup
	if (typeof sender.tab === "undefined"){
        if (request.buttonType=='nonVisual'){
            // prepare the url for analysis tab 
            let urlA=chrome.runtime.getURL("analyse.html");
            // open in a new tab, but...
            chrome.tabs.create({ url: urlA }, function(tab) {
                // wait for the execution of its script
                chrome.tabs.executeScript(tab.id, {file:"./analyse.js"}, function() {
                    // before sending the message with content
                    chrome.tabs.sendMessage(tab.id, request);
                });
            });
        }
        else{
            let urlA=chrome.runtime.getURL("credibilator.html");
            // open in a new tab, but...
            chrome.tabs.create({ url: urlA }, function(tab) {
                // wait for the execution of its script
                chrome.tabs.executeScript(tab.id, {file:"./viz/main.js"}, function() {
                    // before sending the message with content
                    chrome.tabs.sendMessage(tab.id, request);
                });
            });
        }
	}
});

