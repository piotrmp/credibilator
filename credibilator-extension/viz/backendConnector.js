(function (window, undefined) {

    var backendConnector = function(){
        
        
        //These are the URLs with port 80
        
        this.hostName = 'https://cs.uns.edu.ar/';// + window.location.hostname + '/';
        wsgiSuffix = 'credibilator-wsgi';
        
        //this.fakelandDataURL = 'http://192.168.12.18:5000/getData'; 
        this.fakelandDataURL = this.hostName + wsgiSuffix +'/getData'; 
        this.fakelandDataURLDocs = this.hostName + wsgiSuffix +'/getDataDocs'; 
        this.fakelandDataURLkNeigh = this.hostName + wsgiSuffix +'/getANN'; 
        this.fakelandDataURLkNeighDocs = this.hostName + wsgiSuffix +'/getANNDocs'; 
        
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
        mapPanelObj.setHeaderAndMap(data["docs_found"],"#visualizationMap",mapPanelObj)
        
        //let the interface know that the search results are ready
        //intObj.showElasticsearchResultsOnScreen(data);
    }
    
    backendConnector.prototype.returnDataDocs = function (data){
        //Regular results
//console.log(data)
        mapPanelDocsObj.setHeaderAndMap(data["docs_found"],"#visualizationMapDocs",mapPanelDocsObj)
        
        getFeatureList();
        
        //let the interface know that the search results are ready
        //intObj.showElasticsearchResultsOnScreen(data);
    }
    
    backendConnector.prototype.returnZoomedData = function (data){
        //Regular results
//console.log(data)
        if (data["type"]=="sentences"){
            mapPanelObj.drawZoomedData(data["docs_found"],false)
        }
        else{
            mapPanelDocsObj.drawZoomedData(data["docs_found"],false)
        }
        
        //let the interface know that the search results are ready
        //intObj.showElasticsearchResultsOnScreen(data);
    }
    
    //this is used after the user decides to retrieve k closest sentences
    backendConnector.prototype.returnKNeighbors = function (data){
    
//console.log(data)
        if (data["type"]=="sentences"){
            //add k neighbors if not present
            mapPanelObj.drawZoomedData(data["docs_found"],true);
            
            //highlight k neighbors
            //Not used now as we are highlighting from the sentece panel only
            //mapPanelObj.showNeighbors(data["docs_found"]);
            
            //show results on table
            sentPanelObj.setKNearestSentences(data["docs_found"]);
            
            //let the interface know that the search results are ready
            //intObj.showElasticsearchResultsOnScreen(data);
        }
        else{
            //add k neighbors if not present
            mapPanelDocsObj.drawZoomedData(data["docs_found"],true);
            
            //highlight k neighbors
            //mapPanelDocsObj.showNeighbors(data["docs_found"]);
            
            //show results on table
            docPanelObj.setKNearestSentences(data["docs_found"]);
            
        }
    }

// List functions you want other scripts to access
    window.backendConnector = {
        backendConnector: backendConnector
    };
})(window)