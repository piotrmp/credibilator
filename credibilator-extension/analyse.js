'use strict';

// wait for the container message and unpack the contents
chrome.runtime.onMessage.addListener(
	function listenOnce(message, sender, sendResponse) {
		chrome.runtime.onMessage.removeListener(listenOnce)
		unpackContainer(message)
});

let globalContainer
function unpackContainer(container){
	globalContainer=container;
	document.getElementById("title").innerHTML=container.pageTitle;
	document.getElementById("stylometricScore").innerHTML=container.stylometricScore
	let counter=0
	for (let feature in container.stylometricFeatures){
		//document.getElementById("features").innerHTML+=(feature+": "+container.stylometricFeatures[feature]+"<br/>\n")
		counter++;
	}
	document.getElementById("features").innerHTML="Got "+counter+" of them.";
	document.getElementById("textContent").innerHTML=container.textContent.replace(/\n/g,'<br />');
	document.getElementById("loadmodelbutton").addEventListener("click", loadModelClick);
	document.getElementById("processbutton").addEventListener("click", processClick);
}

// Run the BiLSTMAvg classifier

// Global vars
let MAX_SEQUENCE_LENGTH=120
let MAX_DOCUMENT_LENGTH=50

// load the model
let globalModel=null
async function loadModel(url,allcodes,allmasks){
	try{
		const model = await tf.loadLayersModel(url);
		console.log('loaded')
		return(model)
	} catch (e) {
		console.log(e);
	}
}

async function loadModelClick(){
	document.getElementById("model").innerHTML="Loading..."
	globalModel=await loadModel('./bilstmavg/data/tfjs-small-interp/model.json');
	document.getElementById("model").innerHTML="Loaded."
	document.getElementById("processbutton").disabled=false;
}

// extract text, tokenise and score
let globalTokenised=null
async function processClick(){
	let content=globalContainer.textContent;
	globalTokenised=tokenise_bilstmavg(content);
	document.getElementById("scored").innerHTML ="Scoring...";
	readWordCodes("./bilstmavg/data/tfjs-small-interp/words.txt",handleWordCodes)
}

// generate input vectors
function inputVectors(tokenised,wordCodes){
	let resultHTML=""
	let allcodes=[]
	let i=0;
	for (let sentence of tokenised){
		let sentcodes=[]
		let j=0
		for (let token of sentence){
			let code=wordCodes['<UNK>']
			if (token in wordCodes){
				code=wordCodes[token]
			}
			sentcodes.push(code)
			resultHTML=resultHTML+token+" -- "+code+"<br/>\n";
			j=j+1
			if (j==MAX_SEQUENCE_LENGTH){
				break;
			}
		}
		for(;j<MAX_SEQUENCE_LENGTH;j=j+1){
			sentcodes.push(0);
		}
		allcodes.push(sentcodes)
		resultHTML=resultHTML+"<hr/>\n";
		i=i+1
		if (i==MAX_DOCUMENT_LENGTH){
			break;
		}
	}
	let documentLength=i
	for (;i<MAX_DOCUMENT_LENGTH;i=i+1){
		allcodes.push(Array(MAX_SEQUENCE_LENGTH).fill(0))
	}
	let allmasks=[]
	if (documentLength>0){
		allmasks=allmasks.concat(Array(documentLength).fill(Array(2).fill(MAX_DOCUMENT_LENGTH*1.0/documentLength)))
	}
	if (documentLength<MAX_DOCUMENT_LENGTH){
		allmasks=allmasks.concat(Array(MAX_DOCUMENT_LENGTH-documentLength).fill(Array(2).fill(0.0)))
	}
	return([allcodes,allmasks,resultHTML])
}

// use the model it
async function useModel(model,allcodes,allmasks){
	try{
		const prediction = model.predict([tf.tensor([allcodes]),tf.tensor([allmasks])]);
		//let result=prediction.dataSync(); 
		let result=[prediction[0].dataSync(), prediction[1].dataSync(), prediction[2].dataSync()];
		return(result)
	} catch (e) {
		console.log(e);
	}
}

// just for demo, to be replaced by super-fancy visualisation
function showInterpretableNeural(tokenised,wordCodes,prediction){
	console.log(prediction);
	let sentenceScores=Array.from(prediction[1]);
	console.log(sentenceScores);
	let sentenceCoords=Array.from(prediction[2]);
	let resultHTML="";
	let i=0;
	for (let sentence of tokenised){
		let j=0
		resultHTML+="<b>";
		for (let token of sentence){
			let word='[UNK]'
			if (token in wordCodes){
				word=token
			}
			resultHTML=resultHTML+word+" ";
			j=j+1;
			if (j==MAX_SEQUENCE_LENGTH){
				break;
			}
		}
		resultHTML+="</b><br/>\n";
		resultHTML+="F: "+sentenceScores[i*2+1].toFixed(2)+" R: "+sentenceScores[i*2+0].toFixed(2);
		resultHTML+="<br/>\n";
		for (let k=0;k<200;++k){
			resultHTML+=sentenceCoords[i*200+k].toFixed(2)+" ";
		}
		resultHTML+="<br/>\n";
		i++;
		if (i==MAX_DOCUMENT_LENGTH){
			break;
		}
	}
	document.getElementById("interpretation").innerHTML = resultHTML
}

// do the asynchronous processing and display the results
async function handleWordCodes(wordCodes){
	let inputVectors1=inputVectors(globalTokenised,wordCodes)
	let allcodes=inputVectors1[0]
	let allmasks=inputVectors1[1]
	let resultHTML=inputVectors1[2]
	let prediction=await useModel(globalModel,allcodes,allmasks);
	let overallScore=Array.from(prediction[0]);
	let predR=overallScore[0];
	let predF=overallScore[1];
	document.getElementById("scored").innerHTML = "NONCREDIBLE: "+predF+"<br/>CREDIBLE: "+predR;
	showInterpretableNeural(globalTokenised,wordCodes,prediction);
}


