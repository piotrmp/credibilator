var giDict

function loadGIDict(path,callback){
	doGET(path, callback,buildGIDict);
}

function buildGIDict(fileData) {
	if (!fileData) {
		return null;
	}
	let result={};
	let lines=fileData.split('\n');
	let line;
	for (line of lines){
		let parts=line.split('\t')
		let category=parts[0];
		let i;
		for (i=1;i<parts.length;++i){
			let word='_'+parts[i];
			if (!(word in result)){
				result[word]=[]
			}
			result[word].push(category)
		}
	}
	giDict=result
	return(result)
}

function queryGIDict(word){
	if (typeof(word)!='string'){
		return null;
	}
	let word2='_'+word
	if (!(word2 in giDict)){
		return null;
	}else{
		return giDict[word2];
	}
}

