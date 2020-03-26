
// extract features
function generateFeatures(tagged,verbose){
	let resultHTML=""
	let sentencesNo=0
	let wordsNo=0
	let charsNo=0
	let casedNo=[0,0,0,0]
	let dictWordsNo=0
	let categoryWordsNo={}
	let tagNgramsNo={}
	for (sentence of tagged){
		sentencesNo++;
		let prevTag=null
		let prevprevTag=null
		for (item of sentence){
			// basic counter features
			wordsNo++;
			token=item[0]
			lemmas=lemmatizer.only_lemmas(item[1])
			tags=item[2]
			charsNo+=token.length
			// casing features
			if (tags!=null && token.length>1){
				casing=getCasing(token,tags);
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
				}
			}
			if (allDictCategories.size>0){
				dictWordsNo++;
			}
			for (category of allDictCategories){
				increment(categoryWordsNo,category);
			}							
			// tag features
			let thisTag=getPOSTag(tags)
			increment(tagNgramsNo,thisTag)
			if (prevTag!=null){
				increment(tagNgramsNo,prevTag+"_"+thisTag)
				if (prevprevTag!=null){
					increment(tagNgramsNo,prevprevTag+"_"+prevTag+"_"+thisTag)
				}
			}
			prevprevTag=prevTag
			prevTag=thisTag
			if (verbose){
				resultHTML=resultHTML+token+" -- "+lemmas+" -- "+tags+"=>"+thisTag+"<br/>\n";
			}
		}
		if (verbose){
			resultHTML=resultHTML+"<hr/>\n";
		}
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
	return([resultFeatures,resultHTML])
}

function increment(dict,value){
	if (!(value in dict)){
		dict[value]=0
	}
	dict[value]++
}

function getCasing(token,tags){
	if (tags.includes("Acronym")){
		return 1;
	}else if (tags.includes("TitleCase")){
		// doesn't work for the first word in document
		return 2;
	}else if (token.toLowerCase()==token){
		return 0;
	}else{
		return 3;
	}
}

