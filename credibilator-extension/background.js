'use strict';

// having received a message...
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	// check if it's not coming from a popup
	if (typeof sender.tab === "undefined"){
            let urlA=chrome.runtime.getURL("credibilator.html");
            // open in a new tab, but...
            console.log("Background: opening new tab...")
            chrome.tabs.create({ url: urlA }, function(tab) {
                // wait for the execution of its script
		console.log("Background: preparing environment...")
                chrome.scripting.executeScript({target: {tabId: tab.id}, files: ["./viz/main.js"]}, function() {
                    // before sending the message with content
			if (chrome.runtime.lastError){
				if (chrome.runtime.lastError.message.startsWith("Cannot access contents of url \"chrome-extension://")){
					console.log("Everything as expected.")
				}else{
					console.warn("Last error: " + chrome.runtime.lastError.message);
				}
			}
			console.log("Background: sending data to the new tab...")
			chrome.tabs.sendMessage(tab.id, request);
                });
            });
	}
});

