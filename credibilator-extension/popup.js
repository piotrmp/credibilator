'use strict';

chrome.tabs.executeScript({file: 'general/unfluffPacked.js'},function(){
	chrome.tabs.executeScript({file: 'contentScript.js'})
        });

let container;
var doc, cred, user;
var USERSTUDYPOPUP = false;

// having received a message from tab...
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		// store the message
		container=request;
		let charNumber=container.textContent.length
		let lineNumber=container.textContent.split(/\r?\n/).length
		let wordNumber=container.textContent.split(/\s+/).length
		if (charNumber<500){
			document.getElementById("judgement").innerHTML= " too short for credibility assessment.";
		}else if ((wordNumber/lineNumber)<15){
			document.getElementById("judgement").innerHTML=" too fragmented for credibility assessment.";
		}else{
			startProcessing()
		}
});

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {

    // since only one tab should be active and in the current window at once
    // the return variable should only have one entry
    var activeTab = tabs[0];
     
    doc = activeTab.url.split("/").pop()[0];
    cred = activeTab.url.split("/").pop()[1];
    
    //.*parameterName=([^&|\n|\t\s]+)
    var regex = /.*user=([^&|\n|\t\s]+)/
    user = activeTab.url.match(regex)[1];

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
    if (USERSTUDYPOPUP){
        if ((["1", "2", "5", "6", "9", "10", "13", "14", "17", "18"].includes(user)) && (["B","D"].includes(doc))){
            loadGLMDict('./style/data/features-random2.tsv',handleGLMDict); 
        }
        else if ((["3", "4", "7", "8", "11", "12", "15", "16", "19", "20"].includes(user)) && (["A", "C", "E"].includes(doc))){
            loadGLMDict('./style/data/features-random2.tsv',handleGLMDict); 
        }
    }
    else{
        loadGLMDict('./style/data/features-true.tsv',handleGLMDict); 
    }
    
	
}

function handleGLMDict(){
	console.log("Loaded GLM dictionary.")
	score(container.textContent);
}

// Process given text
function score(content){
	console.log("Tagging...");
	let tagged=tag(content);
	console.log("Generating features...");
	let result=generateFeatures(tagged);
	let features=result[0];
	let interpretation=result[1];
	console.log("Scoring...");
	let score=scoreGLM(features);
	console.log("Done.");
	let hrScore=((1-score)*100).toFixed(2);
	container['stylometricScore']=score;
	container['stylometricFeatures']=features;
	container['stylometricInterpretation']=interpretation;
    if (USERSTUDYPOPUP){
        document.getElementById("judgement").innerHTML= "[Score hidden. Click style or neural to find out]";
    }
    else{
        document.getElementById("judgement").innerHTML= ""+hrScore+"% credible (stylometric)";
    }
	//document.getElementById("whybutton").addEventListener("click", whyClick);
	//document.getElementById("whybutton").disabled=false
    
    //get params
   
    

    
    
    
    
	document.getElementById("visualWhyButtonStyle").addEventListener("click", visualWhyClickStyle);
	document.getElementById("visualWhyButtonStyle").disabled=false
    
    document.getElementById("visualWhyButton").addEventListener("click", visualWhyClick);
	document.getElementById("visualWhyButton").disabled=false
}

// user clicked the button...
function whyClick(){
	// pass on the message to background script
	container.buttonType = "nonVisual"
    
	chrome.runtime.sendMessage(container,function(response) {});
}

// user clicked the button...
function visualWhyClickStyle(){
	// pass on the message to background script
    container.buttonType = "visualStyle"
    if (window.event.ctrlKey) {
        container.buttonType = "nonVisual"
    }
    container.doc = doc;
    container.user = user;
    container.cred = cred;
    
    
	chrome.runtime.sendMessage(container,function(response) {});
}

function visualWhyClick(){
	// pass on the message to background script
    container.buttonType = "visual"
    if (window.event.ctrlKey) {
        container.buttonType = "nonVisual"
    }	
    container.doc = doc;
    container.user = user;
    container.cred = cred;
    if (USERSTUDYPOPUP){
        container['stylometricScore']=0.5;
    }
	chrome.runtime.sendMessage(container,function(response) {});
}
