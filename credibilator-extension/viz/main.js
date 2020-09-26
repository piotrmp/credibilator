(function (window, undefined) {

    var interfaceMethods = function(){
        //interface variables
        
        this.verticalBottomSpace = 50;
        
        this.nonCredibleColor = "red";
        this.credibleColor = "green";
        this.neutralColor = "white";
        this.glowColor = "yellow";
        this.featuresToShow = 10;
        
        this.documentNeighbors = 10;
        
        
        //div names
        
        this.wordsDivId = "#visualizationWords";
        
        //docs divs
        this.mapDocsDivId = "#visualizationMapDocs";
        this.styleDivId = "#visualizationStyle";
        this.featureContributionDivId = "#visualizationFeatureContribution";
        this.sequenceTaggingDiv = "#sequenceViewDiv"
        this.documentTableDivId = "#visualizationDocuments";
        
        //sentence divs
        this.mapDivId = "#visualizationMap";
        this.machineViewDivId = "#machineViewDiv";
        this.sentenceTableDivId = "#visualizationSentences";
        this.selectedSentenceDivId = "#selectedSentencePanel";
        
        this.documentDivIds = [this.mapDocsDivId, this.styleDivId, this.featureContributionDivId,this.sequenceTaggingDiv,this.documentTableDivId];
        this.sentenceDivIds = [this.mapDivId,this.machineViewDivId,this.sentenceTableDivId,this.selectedSentenceDivId];
        
        this.visDivIds = [this.styleDivId, this.wordsDivId, this.sentencesDivId, this.documentsDivId, this.mapDivId];
        
        //mapping checkboxes to div
        /*this.checkboxesToDiv = {"fancy-checkbox-style": this.styleDivId, 
                           "fancy-checkbox-words": this.sentencesDivId,
                           "fancy-checkbox-sentences": this.sentencesDivId,
                           "fancy-checkbox-documents": this.documentsDivId,
                           "fancy-checkbox-map": this.mapDivId,
                           };*/
    }
    
    interfaceMethods.prototype.initialize = function(){
        //set some of the element dimensions
        
        
        this.setListeners();
        
        //this.hideAllVis();
        this.hideDocVis();
        //this.setDimensions();
        
        //set all checkboxes with equal length
        $(".btn.btn-default.active").css("width", "6.5em");
        
    }
    
    //Make display None for all
    interfaceMethods.prototype.hideAllVis = function(){
        this.visDivIds.forEach(function(d,i){
            $(d).hide();
        })
    }
    
    //Make display None for all the document-related-vis div
    interfaceMethods.prototype.hideDocVis = function(){
        this.documentDivIds.forEach(function(d,i){
            $(d).hide();
        })
    }
    
    //Make display None for all the sentence-related-vis div
    interfaceMethods.prototype.hideSentenceVis = function(){
        this.sentenceDivIds.forEach(function(d,i){
            $(d).hide();
        })
    }
    
    //Make visible all the document-related-vis div
    interfaceMethods.prototype.showDocVis = function(){
        this.documentDivIds.forEach(function(d,i){
            $(d).show();
        })
    }
    
    //Make visible all the sentence-related-vis div
    interfaceMethods.prototype.showSentenceVis = function(){
        this.sentenceDivIds.forEach(function(d,i){
            $(d).show();
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
        /*$('input[type="checkbox"]').change(function() {
            if ($(this).prop('checked')){
                $(thisObject.checkboxesToDiv[$(this).prop("name")]).show();
            }
            else{
                $(thisObject.checkboxesToDiv[$(this).prop("name")]).hide();
            }
        })*/
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

var totalNonCredibleDocs = 48031;
var totalCredibleDocs = 47869;


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
    sp.setHeaderAndRows({"": []}, "#visualizationStyle", mp);


    //sp.setHeaderAndRows({"Avg. sentence Length": [{"valuesX":0, "valuesYNonCredible":10, "valuesYCredible":3},{"valuesX":1, "valuesYNonCredible":3, "valuesYCredible":5}, {"valuesX":2, "valuesYNonCredible":4, "valuesYCredible":10},{"valuesX":3, "valuesYNonCredible":7, "valuesYCredible":12},{"valuesX":4, "valuesYNonCredible":1, "valuesYCredible":16}],"# all caps sentences": [{"valuesX":0, "valuesYNonCredible":80, "valuesYCredible":13},{"valuesX":1, "valuesYNonCredible":23, "valuesYCredible":55}, {"valuesX":2, "valuesYNonCredible":34, "valuesYCredible":10},{"valuesX":3, "valuesYNonCredible":27, "valuesYCredible":12}]}, "#visualizationStyle", mp);
    //sp.setTwoColumnBarChart("Sentence Length",[{"valuesX":0, "valuesYNonCredible":10, "valuesYCredible":3},{"valuesX":1, "valuesYNonCredible":3, "valuesYCredible":5}, {"valuesX":2, "valuesYNonCredible":4, "valuesYCredible":10},{"valuesX":3, "valuesYNonCredible":7, "valuesYCredible":12},{"valuesX":4, "valuesYNonCredible":1, "valuesYCredible":16}], "#visualization", 2);

    //sp.setSingleBarChart([{"valuesX":0,"valuesY":10},{"valuesX":1,"valuesY":3},{"valuesX":2,"valuesY":4},{"valuesX":3,"valuesY":7},{"valuesX":4,"valuesY":1}], "#visualization", 2);

    //sentPanel = new sentencePanel.sentencePanel("#visualizationSentences");
    //sentPanel.setKNearestSentences([{"text":"The authorities have suspended outbound planes and trains into the city, as well as buses, subways and ferries.", "label": "credible","source":"bbc.com"}, {"text":"There are more than 500 confirmed cases of the virus which has spread overseas.", "label": "noncredible","source":"bbc.com"}, {"text":"Residents have been told not to leave the city of 11 million people", "label": "credible","source":"bbc.com"},{"text":"The authorities have suspended outbound planes and trains into the city, as well as buses, subways and ferries.", "label": "credible","source":"bbc.com"}, {"text":"There are more than 500 confirmed cases of the virus which has spread overseas.", "label": "noncredible","source":"bbc.com"}, {"text":"The authorities have suspended outbound planes and trains into the city, as well as buses, sub.", "label": "credible","source":"bbc.com"},{"text":"The authorities have suspended outbound planes and trains into the city, as well as buses, subways and ferries.", "label": "credible","source":"bbc.com"}, {"text":"There are more than 500 confirmed cases of the virus which has spread overseas.", "label": "noncredible","source":"bbc.com"}, {"text":"The authorities have suspended outbound planes and trains into the city, as well as buses, subwa.", "label": "credible","source":"bbc.com"}])

    mapPanelObj = new mapPanel.mapPanel("#visualizationMap",bec, 'sentences');
    //mapPanel.setHeaderAndMap("random","#visualizationMap",mapPanel)
    mp.setMapObject(mapPanelObj);
    
    mapPanelDocsObj = new mapPanel.mapPanel("#visualizationMapDocs",bec,'documents');
    mp.setMapDocsObject(mapPanelDocsObj);
    
    
        
    sentPanelObj = new sentencePanel.sentencePanel(intObj.sentenceTableDivId, "sentences");
    
    docPanelObj = new sentencePanel.sentencePanel(intObj.documentTableDivId, "documents");
    
    //getFeatureList();
    
    if (globalContainer.buttonType=="visualStyle"){
        $('#switchSentenceScore').prop('checked',false);
        mp.switchConfidence();
    }
    
}

function stepCallback(i,I,probs,vecs){
//console.log("Scored "+i+" / "+I + ": " + probs[1]);
    listOfSentences[i]["score"] = probs[1];
    listOfSentences[i]["origVector"] = vecs;
    if (i<I-1){
        listOfSentences[i+1]["class"] = "wavy";
    }
    listOfSentences[i]["class"] = "normal";
    
    //This is for the user study in case they are checking the stylometric only
    if (globalContainer.buttonType!="visualStyle"){
        mp.setText(listOfSentences);
    }
}

// once everything is finished, visualise
function endCallback(prediction){
    $("#switchSentenceScore").removeAttr("disabled");
    $("#switchMachineView").removeAttr("disabled");
    
    //listOfSentences[listOfSentences.length-1]["class"] = "normal";
    //This is for the user study in case they are checking the stylometric only
    if (globalContainer.buttonType!="visualStyle"){
        mp.setText(listOfSentences);
    }
	let overallScore=Array.from(prediction[0]);
	let predR=overallScore[0];
	let predF=overallScore[1];
	//document.getElementById("scored").innerHTML = "NONCREDIBLE: "+predF+"<br/>CREDIBLE: "+predR;    
    mp.setSentenceConfidence(predR);
    
    if (globalContainer.buttonType!="visualStyle"){
        mp.setCredibleBar(mp.sentenceConfidence);
    }
	showInterpretableNeural(globalTokenised,globalWordCodes,prediction);
    
    //This is for the user study in case they are checking the stylometric only
    if (globalContainer.buttonType!="visualStyle"){
        mp.setText(listOfSentences);
    }
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
//console.log(prediction);
	let sentenceScores=Array.from(prediction[1]);
//console.log(sentenceScores);
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
        //console.log(i*2+1);
        //console.log(sentenceScores[i*2+1]);
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


    //create interface object
    intObj = new interfaceMethods.interfaceMethods();

    intObj.initialize();

    bec = new backendConnector.backendConnector();
    
    d3.select("#newsTitle").text(container.pageTitle);
    
    fcp = new featureContributionPanel.featureContributionPanel("#visualizationFeatureContribution", intObj);

    mp = new mainPanel.mainPanel("#fullText","#credibilityScore");
    
    mp.setDocumentConfidence(1-container.stylometricScore);
    mp.setCredibleBar(1-container.stylometricScore);
    
    //document.getElementById("modelMsg").innerHTML="Loading..."
	globalModel=await loadModel('./bilstmavg/data/' + modelName + '/model.json');
	//document.getElementById("modelMsg").innerHTML="Loaded."
    
    
    
    
    readWordCodes("./bilstmavg/data/" + modelName + "/words.txt",handleWordCodes);
    
    interpretClick();    
    intObj.setDimensions();
    

    //textProcessingObject = new textProcessing();

    //var listOfSentences = [{"class":"normal","text":"The authorities have suspended outbound planes and trains into the city, as well as buses, subways and ferries.","score":"0.7"}, {"class":"normal","text":"Residents have been told not to leave the city of 11 million people.'.","score":"0.9"},{"class":"wavy","text":" Voicing fear about food shortages, '.","score":"0.9"},{"class":"normal","text":"one said it felt like 'the end of the world'.","score":"0.9"},{"class":"normal","text":"There are more than 500 confirmed cases of the virus which has spread overseas.","score":"0.0"}, {"class":"underlined","text": "Officials in Hong Kong reported the territory's first two cases of the coronavirus on Wednesday and one case was reported in the nearby city of Macau.","score":"0.0"}];

    //textProcessingObject.findSentenceNeighborsInCorpus(listOfSentences);

    
}


/*
function showLogistic(glmDict,meanDict){
	let html="<strong>SUM</strong><br/>\n";
	let features=[];
	let impacts={};
	let intercept=glmDict["<INTERCEPT>"];
	for (let feature in glmDict){
		if (feature=="<INTERCEPT>"){
			continue;
		}
		let featureVal=0;
		if (feature in globalContainer.stylometricFeatures){
			featureVal=globalContainer.stylometricFeatures[feature];
		}
		//if (feature.startsWith("mean")){
			featureVal-=meanDict[feature];
			intercept+=meanDict[feature]*glmDict[feature];
		//}
		features.push(feature)
		impacts[feature]=featureVal*glmDict[feature];
		if (feature=="TAG_?_Value_Noun"){
			console.log(meanDict[feature])
			console.log(glmDict[feature])
			console.log(globalContainer.stylometricFeatures[feature])
		}
	}
	features.sort(function(a, b){return Math.abs(impacts[b])-Math.abs(impacts[a])});
	let chartData=[];
	for (let feature of features.slice(0,9)){
		if (impacts[feature]>0){
			chartData.push({label:feature,y:-impacts[feature]});
		}
	}
	for (let feature of features.slice(0,9)){
		if (impacts[feature]<0){
			chartData.push({label:feature,y:-impacts[feature]});
		}
	}
	let remainder=intercept;
	for (let feature of features.slice(9)){
		remainder+=impacts[feature];
	}
	chartData.push({label:"OTHER",y:-remainder});
	
    
	/*var chart = new CanvasJS.Chart("chartContainer", {
	theme: "light1", // "light1", "ligh2", "dark1", "dark2"
	animationEnabled: true,
	title: {
		text: "Feature contribution"
	},
	axisY: {
		title: "Crediblity",
		prefix: "",
		lineThickness: 0,
		suffix: ""
	},
	data: [{
		type: "waterfall",
		indexLabel: "{y}",
		indexLabelFontColor: "#EEEEEE",
		indexLabelPlacement: "inside",
		yValueFormatString: "0.##",
		risingColor:"blue",
		fallingColor:"gold",
		dataPoints: chartData
	}]
	});
	chart.render();
	return(html);
    
}*/

// Style interpretation requested by user
async function interpretClick(){
	loadGLMDictMean('../style/data/features.tsv',showInterp);
    loadHistogramData();
}

async function getFeatureList(){
	loadFeatureList('../style/data/featuresInOrder.tsv',saveFeatureOrder);
}

async function loadHistogramData(){
	loadHistData('../style/data/histCredible.tsv',assignHistCredib);
    loadHistData('../style/data/histNonCredible.tsv',assignHistNonCredib);
}

function loadHistData(path,callback){
	doGET(path, callback,buildHistData);
}

function buildHistData(fileData) {
	if (!fileData) {
		return null;
	}
	let result={};
	let lines=fileData.split('\n');
	let line;
	for (line of lines){
		if (line==""){
			continue;
		}
		let parts=line.split('\t')
		let feature=parts[0];
		let percentiles = [];
        for(var i of [1,2,3,4,5,6,7,8,9,10,11]){
            percentiles.push(parseFloat(parts[i]));
        }
        let freqs = [];
        for(var i of [12,13,14,15,16,17,18,19,20,21]){
            freqs.push(parseFloat(parts[i]));
        }
		//console.log(feature)
		//console.log(coef)
		result[feature]={"freqs":freqs,"percentiles":percentiles};
	}
	return(result)
}

async function assignHistCredib(result){
	histCredible=result;
}

async function assignHistNonCredib(result){
	histNonCredible=result;
}

async function saveFeatureOrder(result){
	featureList = result;
    featureValues = [];
    var feature;
    for (let ix in featureList){
        feature = featureList[ix];
		if (feature=="<INTERCEPT>"){
			continue;
		}
		if (feature in globalContainer.stylometricFeatures){
			featureValues.push(globalContainer.stylometricFeatures[feature]);
		}
        else{
            featureValues.push(0);
        }
	}
    var indexTop10 = featuresToVisualize.slice(0,9).map(function(d,i){return featureList.indexOf(d)});
    mp.getkNNDocs(intObj.documentNeighbors,featureValues, indexTop10);
}

async function showInterp(result){
	glmDict=result[0];
	let meanDict=result[1];
	
	showLogistic(glmDict,meanDict);
	//listOfCategories = showHighlightsCategory(glmDict);
    //listOfSequences = showHighlightsSequence(glmDict);
    //listOfCasing = showHighlightsCasing(glmDict);
}

function showLogistic(glmDict,meanDict){
	
	featuresToVisualize=[];
	impacts={};
	intercept=glmDict["<INTERCEPT>"];
	for (let feature in glmDict){
		if (feature=="<INTERCEPT>"){
			continue;
		}
		let featureVal=0;
		if (feature in globalContainer.stylometricFeatures){
			featureVal=globalContainer.stylometricFeatures[feature];
		}
		//if (feature.startsWith("mean")){
        featureVal-=meanDict[feature];
        intercept+=meanDict[feature]*glmDict[feature];
		//}
		featuresToVisualize.push(feature)
		impacts[feature]=featureVal*glmDict[feature];//+intercept;
		if (feature=="TAG_?_Value_Noun"){
//console.log(meanDict[feature])
//console.log(glmDict[feature])
//console.log(globalContainer.stylometricFeatures[feature])
		}
	}
	//featuresToVisualize.sort(function(a, b){return Math.abs(impacts[b])-Math.abs(impacts[a])});
	reorderFeatures();
    
    getNFeatures(intObj.featuresToShow);
    fcp.setHeaderAndRows(chartData,fcp.container,mp);
	
}

function reorderFeatures(){
	let featuresPos=[]
	let featuresNeg=[]
	let total=0
	for (let feature of featuresToVisualize){
		if (impacts[feature]>0){
			featuresPos.push(feature)
		}else{
			featuresNeg.push(feature)
		}
		total=total+impacts[feature]
	}
	featuresPos.sort(function(a, b){return Math.abs(impacts[b])-Math.abs(impacts[a])});
	featuresNeg.sort(function(a, b){return Math.abs(impacts[b])-Math.abs(impacts[a])});
	featuresToVisualize=[]
	while(featuresToVisualize.length<featuresPos.length+featuresNeg.length){
		let feature=null
		if (total>0){
			feature=featuresPos.splice(0,1)[0]
		}else{
			feature=featuresNeg.splice(0,1)[0]
		}
		total=total-impacts[feature]
		featuresToVisualize.push(feature)
	}
	//console.log(featuresToVisualize)
}

function getNFeatures(n){
    chartData=[];
	for (let feature of featuresToVisualize.slice(0,n-1)){
		//if (impacts[feature]>0){
			chartData.push({label:feature,y:-impacts[feature]});
		//}
	}
	/*for (let feature of featuresToVisualize.slice(0,n-1)){
		if (impacts[feature]<0){
			chartData.push({label:feature,y:-impacts[feature]});
		}
	}*/
	let remainder=intercept;
	for (let feature of featuresToVisualize.slice(n-1)){
		remainder+=impacts[feature];
	}
	//chartData.push({label:"OTHER",y:-remainder});
	
}

function showHighlightsCategory(glmDict, targetFeature){
	let listOfWordsCategory = [];
    
	for (let iS=0;iS<globalContainer.stylometricInterpretation.length;++iS){
		let sentence=globalContainer.stylometricInterpretation[iS];
		for (let iT=0;iT<sentence.length;++iT){
			let token=sentence[iT];
			let putSpace=true;
            let textToken = "";
			if (((iS==0)&&(iT==0))||(iT>0 && sentence[iT-1][1]==-1) || token[1]==1){
				putSpace=false;
			}
			let impactSum=0;
            let impactScore=0;
            let include = false;
            let impactReason=[];
			for (let iL=0;iL<token[2].length;++iL){
				let lemma=token[2][iL][0];
				let categories=token[2][iL][1];
				for (let cat of categories){
                    
					cat="catGI"+cat;
                    
					//if (cat in (featuresToVisualize.slice(0,intObj.featuresToShow-1))){
                    if ((targetFeature!=null)){
                        if ((cat==targetFeature)&&(!include)){
                            impactSum+=glmDict[cat];
                            impactScore+=impacts[cat];
                            include = true;
                            impactReason.push(token[2][iL][0]+"&rarr; "+cat+": "+featureDescription(cat));
                        }
                    }
                    else{
                        if ((featuresToVisualize.slice(0,intObj.featuresToShow-1)).includes(cat)){
                            impactSum+=glmDict[cat];
                            impactScore+=impacts[cat];
                            include = true;
                            impactReason.push(token[2][iL][0]+"&rarr; "+cat+": "+featureDescription(cat));
                        }
                    }
				}
			}
			//console.log(impactSum);
            
			if (putSpace){
				textToken+=" ";
			}
            
            if (textToken==" "){
                listOfWordsCategory.push({"text":textToken,"score":0,"class":"normal","reason":impactReason});
            }
			if (include){
				listOfWordsCategory.push({"text":token[0],"score":impactScore / Math.abs(impacts[featuresToVisualize[0]]),"class":"normal","reason":impactReason});
			}else{
				listOfWordsCategory.push({"text": token[0],"score":0,"class":"normal","reason":impactReason});
			}
		}
	}
    return(listOfWordsCategory);
}

function showHighlightsCasing(glmDict, targetFeature){
	let listOfWordsCasing = [];
    
	for (let iS=0;iS<globalContainer.stylometricInterpretation.length;++iS){
		let sentence=globalContainer.stylometricInterpretation[iS];
		for (let iT=0;iT<sentence.length;++iT){
			let token=sentence[iT];
			let putSpace=true;
            let textToken = "";
			if (((iS==0)&&(iT==0))||(iT>0 && sentence[iT-1][1]==-1) || token[1]==1){
				putSpace=false;
			}
			let impactSum=0;
            let impactScore=0;
            let include = false;
            let impactReason=[];
            let casingId=getCasing(token[0])
			let featureName=["wordscased","wordsCASED","wordsCased","wordsCaSeD"][casingId]
            
			
            
            if (targetFeature!=null){
                    if (featureName==targetFeature){
                        impactSum+=glmDict[featureName];
                        impactScore+=impacts[featureName];
                        include = true;
                        impactReason.push(featureName+"&rarr; " +featureDescription(featureName));
                    }
            }
            else{
                if ((featuresToVisualize.slice(0,intObj.featuresToShow-1)).includes(featureName)){
                    impactSum+=glmDict[featureName];
                    impactScore+=impacts[featureName];
                    include = true;
                    impactReason.push(featureName+"&rarr; " +featureDescription(featureName));
                }
            }
				
			
			//console.log(impactSum);
            
			if (putSpace){
				textToken+=" ";
			}
            
            if (textToken==" "){
                listOfWordsCasing.push({"text":textToken,"score":0,"class":"normal","reason":impactReason});
            }
			if (include){
				listOfWordsCasing.push({"text":token[0],"score":impactScore / Math.abs(impacts[featuresToVisualize[0]]),"class":"normal","reason":impactReason});
			}else{
				listOfWordsCasing.push({"text": token[0],"score":0,"class":"normal","reason":impactReason});
			}
		}
	}
    return(listOfWordsCasing);
}


function showHighlightsSequence(glmDict,targetFeature){
    let listOfWordsSequence = [];
    
	
	for (let iS=0;iS<globalContainer.stylometricInterpretation.length;++iS){
		let sentence=globalContainer.stylometricInterpretation[iS];
		let symbols=[];
		for (let iT=0;iT<sentence.length;++iT){
			let token=sentence[iT];
			let symbol="";
            
            let putSpace=true;
            let textToken = " ";
			if (((iS==0)&&(iT==0))||(iT>0 && sentence[iT-1][1]==-1) || token[1]==1){
				putSpace=false;
                textToken = "";
			}
            let impactSum=0;
            let impactScore=0;
            let include = false;
            let impactReason=[];
            let symbolObject={"text": textToken + token[0], "score": 0, "class": "normal","reason":[]};
			for (let tag of token[3]){
				let tag2="TAG_"+tag;
				//if (tag2 in glmDict && (glmDict[tag2]>IMPACT_THRS_TAG || glmDict[tag2]<-IMPACT_THRS_TAG)){
                 
                if (targetFeature!=null){
                    if (tag2==targetFeature){
                        let tagLen=(tag.match(/_/g) || []).length+1;
                        symbol=tag;
                        symbolObject["score"]+= impacts[tag2]; 
                        symbolObject["reason"].push("TAG_" + tag+"&rarr; "+featureDescription("TAG_" + tag));
                        if (tagLen>=2){
                            symbols[iT-1]=tag;
                            listOfWordsSequence[listOfWordsSequence.length-1]["score"] +=impacts[tag2];
                            listOfWordsSequence[listOfWordsSequence.length-1]["reason"].push("TAG_" + tag+"&rarr; "+featureDescription("TAG_" + tag));
                            if (tagLen>=3){
                                symbols[iT-2]=tag;
                                listOfWordsSequence[listOfWordsSequence.length-2]["score"] +=impacts[tag2];
                                listOfWordsSequence[listOfWordsSequence.length-2]["reason"].push("TAG_" + tag+"&rarr; "+featureDescription("TAG_" + tag));
                            }
                        }
                    }
                }
                else{
                    if ((featuresToVisualize.slice(0,intObj.featuresToShow-1)).includes(tag2)){
                        let tagLen=(tag.match(/_/g) || []).length+1;
                        symbol=tag;
                        symbolObject["score"]+= impacts[tag2]; 
                        symbolObject["reason"].push("TAG_" + tag+"&rarr; "+featureDescription("TAG_" + tag));
                        if (tagLen>=2){
                            symbols[iT-1]=tag;
                            listOfWordsSequence[listOfWordsSequence.length-1]["score"] +=impacts[tag2];
                            listOfWordsSequence[listOfWordsSequence.length-1]["reason"].push("TAG_" + tag+"&rarr; "+featureDescription("TAG_" + tag));
                            if (tagLen>=3){
                                symbols[iT-2]=tag;
                                listOfWordsSequence[listOfWordsSequence.length-2]["score"] +=impacts[tag2];
                                listOfWordsSequence[listOfWordsSequence.length-2]["reason"].push("TAG_" + tag+"&rarr; "+featureDescription("TAG_" + tag));
                            }
                        }
                    }
                }
			}
			symbols.push(symbol);
            listOfWordsSequence.push(symbolObject);
		}
	}
    return listOfWordsSequence;
}

