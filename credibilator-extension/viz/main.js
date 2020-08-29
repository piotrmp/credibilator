(function (window, undefined) {

    var interfaceMethods = function(){
        //interface variables
        
        this.verticalBottomSpace = 50;
        
        
        //div names
        this.styleDivId = "#visualizationStyle";
        this.wordsDivId = "#visualizationWords";
        this.sentencesDivId = "#visualizationSentences";
        this.documentsDivId = "#visualizationDocuments";
        this.mapDivId = "#visualizationMap";
        this.visDivIds = [this.styleDivId, this.wordsDivId, this.sentencesDivId, this.documentsDivId, this.mapDivId];
        
        
        //mapping checkboxes to div
        this.checkboxesToDiv = {"fancy-checkbox-style": this.styleDivId, 
                           "fancy-checkbox-words": this.sentencesDivId,
                           "fancy-checkbox-sentences": this.sentencesDivId,
                           "fancy-checkbox-documents": this.documentsDivId,
                           "fancy-checkbox-map": this.mapDivId,
                           };
    }
    
    interfaceMethods.prototype.initialize = function(){
        //set some of the element dimensions
        this.setDimensions();
        
        this.setListeners();
        
        this.hideAllVis();
        
        //set all checkboxes with equal length
        $(".btn.btn-default.active").css("width", "6.5em");
        
    }
    
    interfaceMethods.prototype.hideAllVis = function(){
        this.visDivIds.forEach(function(d,i){
            $(d).hide();
        })
    }
    
    interfaceMethods.prototype.setDimensions = function(){
        var thisObject = this;
        
        d3.select("#fullText")
        .style("height", ($(window).height() - ($("#fullText")[0].getBoundingClientRect().top+thisObject.verticalBottomSpace))+"px")
        .style("overflow","auto");
        
    }
    
    interfaceMethods.prototype.setListeners = function(){
        //
        var thisObject = this;
        
        //listener checkboxes
        $('input[type="checkbox"]').change(function() {
            if ($(this).prop('checked')){
                $(thisObject.checkboxesToDiv[$(this).prop("name")]).show();
            }
            else{
                $(thisObject.checkboxesToDiv[$(this).prop("name")]).hide();
            }
        })
    }
    
    

// List functions you want other scripts to access
    window.interfaceMethods = {
        interfaceMethods: interfaceMethods
    };
})(window)

//user defined functions
function getRandomInt(max) {
          return Math.floor(Math.random() * Math.floor(max));
}
//------------------------------
let messageGlobal;
// wait for the container message and unpack the contents
chrome.runtime.onMessage.addListener(
	function listenOnce(message, sender, sendResponse) {
		chrome.runtime.onMessage.removeListener(listenOnce);
		messageGlobal = message;
        unpackContainer(message)
        
});

// Global vars
let MAX_SEQUENCE_LENGTH=120;
let MAX_DOCUMENT_LENGTH=50;
let modelName='tfjs-10k-interp-iter';

function descompContenedor(){
    unpackContainer(messageGlobal)
}

// load the model
let globalModel=null
async function loadModel(url,allcodes,allmasks){
	try{
		const model = await tf.loadLayersModel(url);
		console.log('loaded');
		return(model);
	} catch (e) {
		console.log(e);
	}
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
			stepCallback(i,sentLen, probs,vecs);
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


let globalWordCodes;
async function handleWordCodes(wordCodes){
    globalWordCodes=wordCodes;
	let inputVectors1=inputVectors(globalTokenised,wordCodes)
	let allcodes=inputVectors1[0]
	let allmasks=inputVectors1[1]
	let resultHTML=inputVectors1[2]
	
    useModelIter(globalModel,allcodes,allmasks,stepCallback,endCallback);

    //let prediction=await useModel(globalModel,allcodes,allmasks);
	//let overallScore=Array.from(prediction[0]);
	//let predR=overallScore[0];
	//let predF=overallScore[1];
	//document.getElementById("scored").innerHTML = "NONCREDIBLE: "+predF+"<br/>CREDIBLE: "+predR;
	//showInterpretableNeural(globalTokenised,wordCodes,prediction);
    
    //mp.setText(listOfSentences);
    

    sp = new stylePanel.stylePanel("#visualizationStyle");



    //sp.setHeaderAndRows({"Avg. sentence Length": [{"valuesX":0, "valuesYNonCredible":10, "valuesYCredible":3},{"valuesX":1, "valuesYNonCredible":3, "valuesYCredible":5}, {"valuesX":2, "valuesYNonCredible":4, "valuesYCredible":10},{"valuesX":3, "valuesYNonCredible":7, "valuesYCredible":12},{"valuesX":4, "valuesYNonCredible":1, "valuesYCredible":16}],"# all caps sentences": [{"valuesX":0, "valuesYNonCredible":80, "valuesYCredible":13},{"valuesX":1, "valuesYNonCredible":23, "valuesYCredible":55}, {"valuesX":2, "valuesYNonCredible":34, "valuesYCredible":10},{"valuesX":3, "valuesYNonCredible":27, "valuesYCredible":12}]}, "#visualizationStyle", mp);
    //sp.setTwoColumnBarChart("Sentence Length",[{"valuesX":0, "valuesYNonCredible":10, "valuesYCredible":3},{"valuesX":1, "valuesYNonCredible":3, "valuesYCredible":5}, {"valuesX":2, "valuesYNonCredible":4, "valuesYCredible":10},{"valuesX":3, "valuesYNonCredible":7, "valuesYCredible":12},{"valuesX":4, "valuesYNonCredible":1, "valuesYCredible":16}], "#visualization", 2);

    //sp.setSingleBarChart([{"valuesX":0,"valuesY":10},{"valuesX":1,"valuesY":3},{"valuesX":2,"valuesY":4},{"valuesX":3,"valuesY":7},{"valuesX":4,"valuesY":1}], "#visualization", 2);

    //sentPanel = new sentencePanel.sentencePanel("#visualizationSentences");
    //sentPanel.setKNearestSentences([{"text":"The authorities have suspended outbound planes and trains into the city, as well as buses, subways and ferries.", "label": "credible","source":"bbc.com"}, {"text":"There are more than 500 confirmed cases of the virus which has spread overseas.", "label": "noncredible","source":"bbc.com"}, {"text":"Residents have been told not to leave the city of 11 million people", "label": "credible","source":"bbc.com"},{"text":"The authorities have suspended outbound planes and trains into the city, as well as buses, subways and ferries.", "label": "credible","source":"bbc.com"}, {"text":"There are more than 500 confirmed cases of the virus which has spread overseas.", "label": "noncredible","source":"bbc.com"}, {"text":"The authorities have suspended outbound planes and trains into the city, as well as buses, sub.", "label": "credible","source":"bbc.com"},{"text":"The authorities have suspended outbound planes and trains into the city, as well as buses, subways and ferries.", "label": "credible","source":"bbc.com"}, {"text":"There are more than 500 confirmed cases of the virus which has spread overseas.", "label": "noncredible","source":"bbc.com"}, {"text":"The authorities have suspended outbound planes and trains into the city, as well as buses, subwa.", "label": "credible","source":"bbc.com"}])

    mapPanelObj = new mapPanel.mapPanel("#visualizationMap",bec);
    //mapPanel.setHeaderAndMap("random","#visualizationMap",mapPanel)
    mp.setMapObject(mapPanel);
}

function stepCallback(i,I,probs,vecs){
	console.log("Scored "+i+" / "+I + ": " + probs[1]);
    listOfSentences[i]["score"] = probs[1];
    listOfSentences[i]["origVector"] = vecs;
    if (i<I-1){
        listOfSentences[i+1]["class"] = "wavy";
    }
    listOfSentences[i]["class"] = "normal";
    mp.setText(listOfSentences);
}

// once everything is finished, visualise
function endCallback(prediction){
    $("#switchSentenceScore").removeAttr("disabled");
    $("#switchMachineView").removeAttr("disabled");
    
    //listOfSentences[listOfSentences.length-1]["class"] = "normal";
    mp.setText(listOfSentences);
	let overallScore=Array.from(prediction[0]);
	let predR=overallScore[0];
	let predF=overallScore[1];
	//document.getElementById("scored").innerHTML = "NONCREDIBLE: "+predF+"<br/>CREDIBLE: "+predR;    
    mp.setSentenceConfidence(predR);
	showInterpretableNeural(globalTokenised,globalWordCodes,prediction);
    mp.setText(listOfSentences);
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
    console.log(tokenised);
	for (let sentence of tokenised){
		let j=0
		sentenceHTML="";
		for (let token of sentence){
			let word='[UNK]'
			if ((token in wordCodes)&&(j<MAX_SEQUENCE_LENGTH)){
				word=token
			}
            else{
                word='<span class="UNK">'+token+'</span>'
            }
			sentenceHTML=sentenceHTML+word+" ";
			j=j+1;
			//if (j==MAX_SEQUENCE_LENGTH){
			//	break;
			//}
		}
        console.log(i*2+1);
        console.log(sentenceScores[i*2+1]);
        listOfSentences[i]["score"] = sentenceScores[i*2+1];
        listOfSentences[i]["html"] = sentenceHTML;
        i++;
		/*resultHTML+="</b><br/>\n";
		resultHTML+="F: "+sentenceScores[i*2+1].toFixed(2)+" R: "+sentenceScores[i*2+0].toFixed(2);
		resultHTML+="<br/>\n";
		for (let k=0;k<200;++k){
			resultHTML+=sentenceCoords[i*200+k].toFixed(2)+" ";
		}
		resultHTML+="<br/>\n";
		
		if (i==MAX_DOCUMENT_LENGTH){
			break;
		}*/
	}
	//document.getElementById("interpretation").innerHTML = resultHTML
}

let globalContainer
async function unpackContainer(container){
	globalContainer=container;
	
    
    var content=globalContainer.textContent;
    var stylometricScore = container.stylometricScore;
    globalTokenised=tokenise_bilstmavg(content);
    listOfSentences = [];
    globalTokenised.forEach(function(d){
        var sentence = {"class":"normal","text":d.join(' '),"score":0}
        listOfSentences.push(sentence);
    })
console.log(listOfSentences)

    //create interface object
    intObj = new interfaceMethods.interfaceMethods();

    intObj.initialize();

    bec = new backendConnector.backendConnector();
    
    d3.select("#newsTitle").text(container.pageTitle);

    mp = new mainPanel.mainPanel("#fullText","#credibilityScore");
    
    mp.setDocumentConfidence(1-container.stylometricScore);
    mp.setCredibleBar(1-container.stylometricScore);
    
    //document.getElementById("modelMsg").innerHTML="Loading..."
	globalModel=await loadModel('./bilstmavg/data/' + modelName + '/model.json');
	//document.getElementById("modelMsg").innerHTML="Loaded."
    
    
    
    
    readWordCodes("./bilstmavg/data/" + modelName + "/words.txt",handleWordCodes);
    

    //textProcessingObject = new textProcessing();

    //var listOfSentences = [{"class":"normal","text":"The authorities have suspended outbound planes and trains into the city, as well as buses, subways and ferries.","score":"0.7"}, {"class":"normal","text":"Residents have been told not to leave the city of 11 million people.'.","score":"0.9"},{"class":"wavy","text":" Voicing fear about food shortages, '.","score":"0.9"},{"class":"normal","text":"one said it felt like 'the end of the world'.","score":"0.9"},{"class":"normal","text":"There are more than 500 confirmed cases of the virus which has spread overseas.","score":"0.0"}, {"class":"underlined","text": "Officials in Hong Kong reported the territory's first two cases of the coronavirus on Wednesday and one case was reported in the nearby city of Macau.","score":"0.0"}];

    //textProcessingObject.findSentenceNeighborsInCorpus(listOfSentences);

    
}
console.log("here")