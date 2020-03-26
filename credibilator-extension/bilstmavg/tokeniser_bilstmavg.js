const simpleCompromise = function(doc) {
	let everything=[]
	doc.list.forEach(p => {
		//console.log(p.text())
		let terms = p.cache.terms || p.terms()
		let termsPlain=[]
		terms.forEach(t => {
			//console.log(t)
			let pre = t.pre.trim()
			// What if text is null?
			let implicit = '';
			if (t.implicit!=null){
				implicit=t.implicit.trim();
			}
			let text = t.text.trim();
			let post = t.post.trim();
			if (pre.length!=0){
				termsPlain.push(pre);
			}
			if (implicit.length!=0){
				if (implicit=='have'){
					implicit='’ve';
				}
				termsPlain.push(implicit);
			}else if (text.length!=0){
				if (t.tags.NumericValue){
					text='0';
				}
				termsPlain.push(text);
			}
			if (post.length!=0){
				termsPlain.push(post);
			}
		})
		//console.log(termsPlain)
		everything.push(termsPlain)
	})
	//console.log(everything)
	return(everything);
}


function tokenise_bilstmavg(text){
	// remove newlines to avoid compromise splitting sentences on them (CoreNLP doesn't)
	text=text.replace(/\n/g," ");
	// hide hyphens
	text=text.replace(/(\S)-(\S)/g,"$1___$2")
	let doc=nlp(text);
	let simple=simpleCompromise(doc)
	// recover hyphens
	for(let i=0;i<simple.length;i++){
		for(let j=0;j<simple[i].length;j++){
			if (simple[i][j].includes("___")){
				//console.log(simple[i]);
				simple[i][j]=simple[i][j].replace(/___/g,"-");
			}
		}
	}
	return(simple)
}
