function trim(s){ 
  return ( s || '' ).replace( /^\s+|\s+$/g, '' ); 
}

function renderText(element){
	if (element.tagName.toLowerCase()=="script"|| element.tagName.toLowerCase()=="noscript"|| element.tagName.toLowerCase()=="style"){
		return "";
	}else if (element.tagName.toLowerCase()=="br"){
		return "\n";
	}
	let result=""
	let children=element.childNodes
	for (let i=0;i<children.length;i++){
		let child=children[i];
		if (child.nodeType==Node.TEXT_NODE){
			result=result+trim(child.textContent);
		}else if (child.nodeType==Node.ELEMENT_NODE){
			result=result+renderText(child);
		}
	}
	if (element.tagName.toLowerCase()=="li"||element.tagName.toLowerCase()=="p"||element.tagName.toLowerCase()=="div"){
		result="\n"+result+"\n";
	}
	return result.replace(/\n\s*\n/g, '\n');
}

function justText(element){
	if (element.tagName.toLowerCase()=="script"|| element.tagName.toLowerCase()=="noscript"|| element.tagName.toLowerCase()=="style"){
		return "";
	}
	let result=""
	let children=element.childNodes
	for (let i=0;i<children.length;i++){
		let child=children[i];
		if (child.nodeType==Node.TEXT_NODE){
			result=result+child.textContent;
		}else if (child.nodeType==Node.ELEMENT_NODE){
			result=result+justText(child);
		}
	}
	return(result)
}


function findBestElement(element,soFar){
	if (soFar!=null && element.textContent.length<=soFar[1]){
		return null;
	}
	let textHere=renderText(element).length;
	let textBelow=0;
	let children = element.children;
	for (let i = 0; i < children.length; i++) {
		let child = children[i];
		if (renderText(child).length>textBelow){
			textBelow=renderText(child).length
		}
	}
	let gain = textHere - textBelow;
	let result=soFar;
	if (result==null || gain>result[1]){
		result=[element,gain];
	}
	for (let i = 0; i < children.length; i++) {
		let child = children[i];
	  	let bestBelow=findBestElement(child,result);
		if (bestBelow!=null && bestBelow[1]>result[1]){
			result=bestBelow;
		}
	}
	return result;
}

//let content=renderText(findBestElement(document.body,null)[0]);

