function doGET(path, callback,process) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            // The request is done; did it work?
            if (xhr.status == 200) {
                // ***Yes, use `xhr.responseText` here***
                callback(process(xhr.responseText));
            } else {
                // ***No, tell the callback the call failed***
                callback(process(null));
            }
        }
    };
    xhr.open("GET", path);
    xhr.send();
}

function buildDict(fileData) {
	if (!fileData) {
		return null;
	}
	let result={}
	let parts=fileData.split('\n');
	let i;
	for (i =0;i<parts.length;++i){
		result[parts[i]]=i
	}
	return(result)
}


function readWordCodes(path,callback){
	doGET(path, callback,buildDict);
}
