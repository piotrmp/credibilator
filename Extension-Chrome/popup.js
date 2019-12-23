'use strict';

chrome.tabs.executeScript({
          file: 'contentScript.js'
        });

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		//let content=request.textContent.replace(/\n/g,'</p>\n<p>');
		//document.getElementById("textContent").innerHTML=content;
		var content;
		document.getElementById("textContent").innerHTML=""
		for (content of request.textContent.split("\n")){
			if (content==""){
				continue;
			}
			document.getElementById("textContent").innerHTML+="<p>"+content+"</p>\n";
			let parsed=nlp(content);
			let alltags=parsed.out('tags');
			var sentence;
			var token;
			document.getElementById("textContent").innerHTML+="<p>"
			for (sentence of alltags){
				for (token in sentence){
					let tag=sentence[token][0]
					document.getElementById("textContent").innerHTML+=(" "+token+"_"+tag)
				}
			}
			document.getElementById("textContent").innerHTML+="</p>"
		}
  });
