function doGET(path, callback,process) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            // The request is done; did it work?
            if (xhr.status == 200 || (xhr.responseURL.startsWith("file://") && xhr.status==0)) {
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


