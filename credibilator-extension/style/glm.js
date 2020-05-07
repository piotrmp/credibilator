var glmDict

function loadGLMDict(path,callback){
	doGET(path, callback,buildGLMDict);
}

function buildGLMDict(fileData) {
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
		let coef=parseFloat(parts[1]);
		//console.log(feature)
		//console.log(coef)
		result[feature]=coef
	}
	glmDict=result
	return(result)
}

function loadGLMDictMean(path,callback){
	doGET(path, callback,buildGLMDictMean);
}

function buildGLMDictMean(fileData) {
	if (!fileData) {
		return null;
	}
	let result={};
	let resultMean={};
	let lines=fileData.split('\n');
	let line;
	for (line of lines){
		if (line==""){
			continue;
		}
		let parts=line.split('\t')
		let feature=parts[0];
		let coef=parseFloat(parts[1]);
		let mean=parseFloat(parts[3]);
		//console.log(feature)
		//console.log(coef)
		result[feature]=coef
		resultMean[feature]=mean
	}
	result=[result,resultMean]
	return(result)
}

function scoreGLM(features){
	let sum=glmDict['<INTERCEPT>'];
	let feature;
	for (feature in features){
		if (feature in glmDict){
			sum+=features[feature]*glmDict[feature];
		}
	}
	let score=1/(1+Math.exp(-sum));
	return(score);
}
