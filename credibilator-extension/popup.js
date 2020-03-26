'use strict';

chrome.tabs.executeScript({
          file: 'contentScript.js'
        });

let container;

// having received a message from tab...
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		// store the message
		container=request;
		startProcessing()
});


let lemmatizer = new Lemmatizer('./style/javascript-lemmatizer');


// initiate the processing
async function startProcessing(){
	//lemmatizer = new Lemmatizer('./style/javascript-lemmatizer');
	//console.log("Loaded lemmatizer.")
	loadGIDict('./style/data/GI_extended.tsv',handleGIDict) 
}

function handleGIDict(){
	console.log("Loaded GI dictionary.")
	loadGLMDict('./style/data/features.tsv',handleGLMDict) 
}

function handleGLMDict(){
	console.log("Loaded GLM dictionary.")
	score(container.textContent);
}

// Process given text
function score(content){
	let verbose=true;
	console.log("Tagging...")
	let tagged=tag(content);
	console.log("Generating features...")
	let result=generateFeatures(tagged,verbose)
	let features=result[0]	
	console.log("Scoring...")
	let score=scoreGLM(features);
	console.log("Done.")
	let hrScore=((1-score)*100).toFixed(2);
	container['stylometricScore']=score;
	container['stylometricFeatures']=features;
	document.getElementById("judgement").innerHTML= ""+hrScore+"% credible";
	document.getElementById("whybutton").addEventListener("click", whyClick);
	document.getElementById("whybutton").disabled=false
}

// user clicked the button...
function whyClick(){
	// pass on the message to background script
	chrome.runtime.sendMessage(container,function(response) {});
}

