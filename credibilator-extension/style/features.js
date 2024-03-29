
// extract features
function generateFeatures(tagged){
	let sentencesNo=0;
	let wordsNo=0;
	let charsNo=0;
	let casedNo=[0,0,0,0];
	let dictWordsNo=0;
	let categoryWordsNo={};
	let tagNgramsNo={};
	let interpAll=[];
	for (sentence of tagged){
		sentencesNo++;
		let prevTag=null
		let prevprevTag=null
		let interpSen=[];
		for (item of sentence){
			// basic counter features
			wordsNo++;
			token=item[0]
			lemmas=lemmatizer.only_lemmas(item[1])
			tags=item[2]
			charsNo+=token.length
			// interpret features
			let interpDict=[];
			let interpPOS=[];
			// casing features
			if (tags!=null && token.length>1){
				casing=getCasing(token);
				casedNo[casing]++;
			}
			// dict features
			let allDictCategories=new Set();
			let lemmma;
			for (lemma of lemmas){
				dictCategories=queryGIDict(lemma)
				if (dictCategories!=null){
					for (category of dictCategories){
						allDictCategories.add(category)
					}
					interpDict.push([lemma,dictCategories]);
				}
			}
			if (allDictCategories.size>0){
				dictWordsNo++;
			}
			for (category of allDictCategories){
				increment(categoryWordsNo,category);
			}							
			// tag features
			let thisTag=getPOSTag(tags);
			increment(tagNgramsNo,thisTag);
			interpPOS.push(thisTag);
			if (prevTag!=null){
				let fID=prevTag+"_"+thisTag;
				increment(tagNgramsNo,fID)
				interpPOS.push(fID)
				if (prevprevTag!=null){
					let fID=prevprevTag+"_"+prevTag+"_"+thisTag;
					increment(tagNgramsNo,fID);
					interpPOS.push(fID)
				}
			}
			// bookkeeping
			prevprevTag=prevTag;
			prevTag=thisTag;
			interpSen.push([item[0],item[3],interpDict,interpPOS]);
		}
		interpAll.push(interpSen);
	}
	let resultFeatures={}
	resultFeatures["sentences"]=sentencesNo;
	if (sentencesNo==0){
		sentencesNo=1
	}
	resultFeatures["meanSentenceLength"]=wordsNo/sentencesNo;
	if (wordsNo==0){
		wordsNo=1
	}
	resultFeatures["meanWordLength"]=charsNo/wordsNo
	let casedTotal=casedNo[0]+casedNo[1]+casedNo[2]+casedNo[3]
	if (casedTotal==0){
		casedTotal=1
	}
	resultFeatures["wordscased"]=casedNo[0]/casedTotal;
	resultFeatures["wordsCASED"]=casedNo[1]/casedTotal;
	resultFeatures["wordsCased"]=casedNo[2]/casedTotal;
	resultFeatures["wordsCaSeD"]=casedNo[3]/casedTotal;
	resultFeatures["totalGI"]=dictWordsNo/wordsNo;
	if (dictWordsNo==0){
		dictWordsNo=1
	}
	for (category in categoryWordsNo){
		resultFeatures["catGI"+category]=categoryWordsNo[category]/dictWordsNo;
	}
	for (tagNgram in tagNgramsNo){
		resultFeatures["TAG_"+tagNgram]=tagNgramsNo[tagNgram]/wordsNo;
	}
	//resultFeatures=randomise(resultFeatures)
	return([resultFeatures,interpAll])
}

function randomise(dict){
	let keys=Object.keys(dict)
	let result={}
	for (key of keys){
		fakeKey=keys[Math.floor(Math.random() * keys.length)]
		result[key]=dict[fakeKey]
	}
	return result;
}
function increment(dict,value){
	if (!(value in dict)){
		dict[value]=0
	}
	dict[value]++
}

function getCasing(token){
	if (token.toLowerCase()==token){
		return 0;
	}else if (token.toUpperCase()==token){
		return 1;
	}else if (token.substring(1).toLowerCase()==token.substring(1)){
		return 2;
	}else{
		return 3;
	}
}

