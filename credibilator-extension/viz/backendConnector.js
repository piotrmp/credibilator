(function (window, undefined) {

    var backendConnector = function(){
        //This is with dodgy port 5000 and hardcoded
        
        
        
        //These are the URLs with port 80
        
        this.hostName = 'https://cs.uns.edu.ar/';// + window.location.hostname + '/';
        wsgiSuffix = 'credibilator-wsgi';
        
        //this.fakelandDataURL = 'http://192.168.12.18:5000/getData'; 
        this.fakelandDataURL = this.hostName + wsgiSuffix +'/getData'; 
        
    }
    
    backendConnector.prototype.backendCall = function(callURL,dataToPass,callback){
        var thisObject = this;
        $.ajax({
            url: callURL,
            type: 'POST',
            contentType: 'application/json',
            //dataType: 'jsonp',
            data: JSON.stringify(dataToPass),
            //data: thisObject.body,
            //jsonp: 'json.wrf',
            success: callback,
            error: function(request,error){
                alert("Credibilator could not reach the server. Try again or check network connection settings.");
                //alert("Request: " + JSON.stringify(request));
            }
        });

        
	}
    
    backendConnector.prototype.returnData = function (data){
        //Regular results
//console.log(data)
        mapPanelObj.setHeaderAndMap(data["docs_found"],"#visualizationMap",mapPanel)
        
        
        //let the interface know that the search results are ready
        //intObj.showElasticsearchResultsOnScreen(data);
    }
    
    backendConnector.prototype.returnZoomedData = function (data){
        //Regular results
//console.log(data)
        mapPanelObj.drawZoomedData(data["docs_found"])
        
        
        //let the interface know that the search results are ready
        //intObj.showElasticsearchResultsOnScreen(data);
    }

// List functions you want other scripts to access
    window.backendConnector = {
        backendConnector: backendConnector
    };
})(window)