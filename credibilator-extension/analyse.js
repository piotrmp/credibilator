'use strict';

// wait for the container message
chrome.runtime.onMessage.addListener(
	function listenOnce(message, sender, sendResponse) {
		chrome.runtime.onMessage.removeListener(listenOnce)
		unpackContainer(message)
});

// unpack the contents from the container sent by popup
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
	document.getElementById("interpretbutton").disabled=false;
	document.getElementById("interpretbutton").addEventListener("click", interpretClick);
}

// Style interpretation requested by user
async function interpretClick(){
	loadGLMDict('./style/data/features.tsv',showInterp) 
}


async function showInterp(glmDict){
	let IMPACT_THRS_TAG=50;
	let IMPACT_THRS_DICT=20;
	let IMPACT_THRS_CAT=5;
	let html="<strong>DICT</strong><br/>";
	for (let iS=0;iS<globalContainer.stylometricInterpretation.length;++iS){
		let sentence=globalContainer.stylometricInterpretation[iS];
		for (let iT=0;iT<sentence.length;++iT){
			let token=sentence[iT];
			let putSpace=true;
			if (html=="" || (iT>0 && sentence[iT-1][1]==-1) || token[1]==1){
				putSpace=false;
			}
			let impactSum=0;
			for (let iL=0;iL<token[2].length;++iL){
				let lemma=token[2][iL][0];
				let categories=token[2][iL][1];
				for (let cat of categories){
					cat="catGI"+cat;
					if (cat in glmDict){
						impactSum+=glmDict[cat];
					}
				}
			}
			//console.log(impactSum);
			if (putSpace){
				html+=" ";
			}
			let impactReason="";
			if (impactSum>IMPACT_THRS_DICT || impactSum<-IMPACT_THRS_DICT){
				for (let iL=0;iL<token[2].length;++iL){
					let cats=[]
					for (let cat of token[2][iL][1]){
						let cat0=cat;
						cat="catGI"+cat;
						if (cat in glmDict && (glmDict[cat]>IMPACT_THRS_CAT || glmDict[cat]<-IMPACT_THRS_CAT)){
							cats.push(cat0)
						}
					}
					if (cats.length==0){
						continue;
					}
					let msg=token[2][iL][0]+"&rarr;"+cats.join(", ");
					if (impactReason!=""){
						impactReason+=" ";
					}
					impactReason+=msg;
				}
			}
			if (impactSum>IMPACT_THRS_DICT){
				html+="<span title=\""+impactReason+"\" style=\"background-color:yellow\">"+token[0]+"</span>";
			}else if (impactSum<-IMPACT_THRS_DICT){
				html+="<span title=\""+impactReason+"\" style=\"background-color:aqua\">"+token[0]+"</span>";
			}else{
				html+=token[0];
			}
		}
		html+="<br/>"
	}
	html+="<strong>TAG</strong><br/>";
	for (let iS=0;iS<globalContainer.stylometricInterpretation.length;++iS){
		let sentence=globalContainer.stylometricInterpretation[iS];
		let symbols=[];
		for (let iT=0;iT<sentence.length;++iT){
			let token=sentence[iT];
			let symbol="";
			for (let tag of token[3]){
				let tag2="TAG_"+tag;
				if (tag2 in glmDict && (glmDict[tag2]>IMPACT_THRS_TAG || glmDict[tag2]<-IMPACT_THRS_TAG)){
					let tagLen=(tag.match(/_/g) || []).length+1;
					symbol=tag
					if (tagLen>=2){
						symbols[iT-1]=tag
						if (tagLen>=3){
							symbols[iT-2]=tag
						}
					}
				}
			}
			symbols.push(symbol);
		}
		for (let iT=0;iT<sentence.length;++iT){
			let token=sentence[iT];
			let putSpace=true;
			if (html=="" || (iT>0 && sentence[iT-1][1]==-1) || token[1]==1){
				putSpace=false;
			}
			if (putSpace){
				html+=" ";
			}
			let prefix="";
			let suffix="";
			if (symbols[iT]!="" && (iT==0||symbols[iT]!=symbols[iT-1])){
				let color="aqua";
				if (glmDict["TAG_"+symbols[iT]]>0){
					color="yellow";
				}
				prefix="<span title=\""+symbols[iT]+"\" style=\"background-color:"+color+"\">"
			}
			if (symbols[iT]!="" && (iT==(sentence.length-1)||symbols[iT]!=symbols[iT+1])){
				suffix="</span>"
			}
			html+=prefix+token[0]+suffix;
		}
		html+="<br/>"
	}

	document.getElementById("interpretationStyle").innerHTML=html;
}

// Run the BiLSTMAvg classifier

// Global vars
let MAX_SEQUENCE_LENGTH=120;
let MAX_DOCUMENT_LENGTH=50;
let modelName='tfjs-10k-interp-iter';

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

// when clicked by user
async function loadModelClick(){
	document.getElementById("model").innerHTML="Loading..."
	globalModel=await loadModel('./bilstmavg/data/'+modelName+'/model.json');
	document.getElementById("model").innerHTML="Loaded."
	document.getElementById("processbutton").disabled=false;
}

// extract text, tokenise and score
let globalTokenised=null
async function processClick(){
	let content=globalContainer.textContent;
	globalTokenised=tokenise_bilstmavg(content);
	document.getElementById("scored").innerHTML ="Scoring...";
	readWordCodes("./bilstmavg/data/"+modelName+"/words.txt",handleWordCodes)
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

// use the model iteratively and store results in global var
let globalResult=null;
async function useModelIter(model,allcodes,allmasks,stepCallback,endCallback){
	let sentLen=0
	for (let i=0;i<allmasks.length;++i){
		if (allmasks[i][0]!=0.0){
			sentLen++;
		}
	}
	globalResult=[[0.0,0.0],[],[]];
	let i=0;
	(function loop() {
		try{
			const prediction = model.predict(tf.tensor([allcodes[i]]));
			let probs=Array.from(prediction[0].dataSync())
			globalResult[1]=globalResult[1].concat(probs);
			let vecs=Array.from(prediction[1].dataSync())
			globalResult[2]=globalResult[2].concat(vecs);
			globalResult[0][0]+=probs[0];
			globalResult[0][1]+=probs[1];
			stepCallback(i,sentLen);
		} catch (e) {
			console.log(e);
		}
		i++;
		if (i<sentLen){
			setTimeout(loop, 0);
		}else{
			globalResult[0][0]/=sentLen;
			globalResult[0][1]/=sentLen;
			endCallback(globalResult)
		}
	})();
}

// just for demo, to be replaced by super-fancy visualisation
function showInterpretableNeural(tokenised,wordCodes,prediction){
	//console.log(prediction);
	let sentenceScores=Array.from(prediction[1]);
	//console.log(sentenceScores);
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
		if (i*2==sentenceScores.length){
			break;
		}
	}
	document.getElementById("interpretationNeural").innerHTML = resultHTML
}


// once word codes are available, trigger running the model
let globalWordCodes;
async function handleWordCodes(wordCodes){
	globalWordCodes=wordCodes;
	let inputVectors1=inputVectors(globalTokenised,globalWordCodes)
	let allcodes=inputVectors1[0]
	let allmasks=inputVectors1[1]
	let resultHTML=inputVectors1[2]
	useModelIter(globalModel,allcodes,allmasks,stepCallback,endCallback);
}

// once a step is finished, show progress
function stepCallback(i,I){
	let elem = document.getElementById("scored");
	elem.innerHTML = (i*100.0/I).toFixed(0)+"%";
	console.log("Scored "+i+" / "+I);
}

// once everything is finished, visualise
function endCallback(prediction){
	let overallScore=Array.from(prediction[0]);
	let predR=overallScore[0];
	let predF=overallScore[1];
	document.getElementById("scored").innerHTML = "NONCREDIBLE: "+predF+"<br/>CREDIBLE: "+predR;
	showInterpretableNeural(globalTokenised,globalWordCodes,prediction);
}


