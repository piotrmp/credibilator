'use strict';

chrome.tabs.executeScript({
          file: 'contentScript.js'
        });

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    let content=request.textContent.replace(/\n/g,'</p>\n<p>');
    document.getElementById("textContent").innerHTML=content;
  });
