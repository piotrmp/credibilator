(function (window, undefined) {

    var mainPanel = function(selectorText, selectorBar){
        //interface variables
        var thisObject = this;
        //id for the textual area
        this.textContainerId = selectorText;
        //id for the credibility bar
        this.barContainerId = selectorBar;
        
        //variables for the credibility bar        
        this.credibleBarWidth = 100
        this.credibleBarLeftMargin = 100
        this.scaleCredibleIndicatorSize = d3.scaleLinear().domain([0,1]).range([1,this.credibleBarWidth]);
        this.scaleCredibleIndicatorColor = d3.scaleLinear().domain([0,1]).range(["lightblue","red"]);
        
        //variables for the textual area
        this.scaleNonCredibleTextHighlightColor = d3.scaleLinear().domain([0,1]).range([intObj.neutralColor,intObj.nonCredibleColor]);
        this.scaleCredibleTextHighlightColor = d3.scaleLinear().domain([0,1]).range([intObj.neutralColor, intObj.credibleColor]);
        
        this.currentConfidence = "sentence";
        this.currentView = "human";
        this.currentHighlighting = "category";
            
        $('#switchSentenceScore').on('change', function (event) {      thisObject.switchConfidence();
        }); 
        $('#switchMachineView').on('change', function (event) {      thisObject.switchMachineView();
        }); 
        $('#switchSequenceView').on('change', function (event) {      thisObject.switchTagging();
        }); 
        
        this.neighborsToRetrieve = 10;
        
        this.divTooltip = d3.select(selectorText).append("div")	
                    .attr("class", "tooltip")				
                    .style("opacity", 0);
    }
    
    mainPanel.prototype.setSentenceConfidence = function(value){
        this.sentenceConfidence = value;
    }
    
    mainPanel.prototype.setDocumentConfidence = function(value){
        this.documentConfidence = value;
    }
    
    mainPanel.prototype.switchConfidence = function(){
        if (this.currentConfidence=="document"){
            this.currentConfidence="sentence";
            this.setCredibleBar(this.sentenceConfidence);
            intObj.hideDocVis();
            intObj.showSentenceVis();
            mp.setText(listOfSentences);
            if (this.currentView=="machine"){
                this.setMachineView();
            }
            else{
                this.setHumanView();
            }
        }
        else{
            this.currentConfidence = "document";
            this.setCredibleBar(this.documentConfidence);
            intObj.hideSentenceVis();
            intObj.showDocVis();
            if (this.currentHighlighting=="category"){
                this.setText(listOfCategories);
            }
            else{
                this.setText(listOfSequences);
            }
        }
    }
    
    mainPanel.prototype.switchMachineView = function(){
        if (this.currentView=="machine"){
            this.currentView="human";
            this.setHumanView();
        }
        else{
            this.currentView = "machine";
            this.setMachineView();
        }
    }
    
    mainPanel.prototype.switchTagging = function(){
        if (this.currentHighlighting=="category"){
            this.currentHighlighting="sequence";
            this.setText(listOfSequences);
        }
        else{
            this.currentHighlighting = "category";
            this.setText(listOfCategories);
        }
    }
    
    
    mainPanel.prototype.setMachineView = function(){
        d3.selectAll(".UNK").style("color","transparent").style("text-shadow","0 0 8px #000");
    }
    mainPanel.prototype.setHumanView = function(){
        d3.selectAll(".UNK").style("color","black").style("text-shadow","None");
    }
        
    mainPanel.prototype.changeCredibleBar = function(){
        
    }
    
    mainPanel.prototype.setMapObject = function(mapObj){
        this.mapObject = mapObj;
    }
    
    mainPanel.prototype.setMapDocsObject = function(mapObj){
        this.mapDocsObject = mapObj;
    }
    
    
    mainPanel.prototype.setText = function(listOfText){
        //This function sets text in the textual area
        
        //listOfText is a list of tokenized spans with class and text keys
        //The text would go as text span and the class as class spans
        //score is the sentence score
        var thisObject = this;
        var selectedSpan = d3.select(thisObject.textContainerId)
        .selectAll("span")
        .filter(function(d){
            return (d!=undefined);
        })
        .data(listOfText);
        
        aux = selectedSpan.enter().append("span")
        .merge(selectedSpan)
        .attr("class", function(d){
            return d.class;})
        .style("background-color",function(d){
            if (d.score>0){
                return thisObject.scaleNonCredibleTextHighlightColor(d.score);
            }
            else{
                return thisObject.scaleCredibleTextHighlightColor(Math.abs(d.score));
            }
        })
        .html(function(d){
            if (d.html!=null){
                return d.html;
            }
            else{
                return d.text;
            }
        })
        .on("mouseover", function(d,i){
            //reset any previous hovering
            //thisObject.mapObject.resetAllNeighbors();
            $("span").css({"outline": "0px solid blue", "padding" : ".0em .0em"});
            
            //actions on hovering
            //thisObject.mapObject.showNeighbors(thisObject.getkNN(d,3));
            $(this).css({"outline": "1px solid blue", "padding" : ".2em .4em"});
            
            //show tooltip
            if (thisObject.currentConfidence=="document"){
                var div = mp.divTooltip;
                div.transition()
                        .duration(200)
                        .style("opacity", .9);
                div.html(d.reason.join("<br/>"))
                        .style("left", (d3.event.pageX + 20) + "px")
                        .style("top", (d3.event.pageY - 28) + "px");	
            }
        })
        .on("mouseout", function(d,i){
            if (thisObject.currentConfidence=="document"){
                //hide tooltip
                var div = mp.divTooltip;
                div.transition()		
                    .duration(500)		
                    .style("opacity", 0);
            }
        })
        .on("mousedown",function(d,i){
            mp.getkNN(d,mp.neighborsToRetrieve)
        });
        
        selectedSpan.exit().remove();
    }
    
    mainPanel.prototype.getkNN = function(datum, k){
        mapPanelObj.resetAllNeighbors();
        dataToPass = {"n": k , "query": datum.origVector};
        bec.backendCall(bec.fakelandDataURLkNeigh,dataToPass,bec.returnKNeighbors);
    }
    
    mainPanel.prototype.getkNNDocs = function(k,featureValues){
        mapPanelDocsObj.resetAllNeighbors();
        
        dataToPass = {"n": k , "query": featureValues};
        bec.backendCall(bec.fakelandDataURLkNeighDocs,dataToPass,bec.returnKNeighbors);
    }
    
    mainPanel.prototype.setCredibleBar = function(score){
        var topOfOutline = 10;
        
        //insert svg (first time only)
        var thisObject = this;
        var selectedSVG = d3.select(thisObject.barContainerId)
        .selectAll("svg")
        .data([1]);
        
        //insert group (first time only)
        var insertedGroup = selectedSVG.enter().append("svg")
        .attr("height", 40)
        .attr("width", 200)
        .append("g")
        .attr("id","credibleBarGroup");
        
        //insert indicator of width 1 (first time only to allow transitions)
        insertedGroup.append("rect")
        .attr("class","credibleRect")
        .attr("x", thisObject.credibleBarLeftMargin)
        .attr("y", topOfOutline)
        .style("fill","white")
        .attr("height", 8)
        .attr("width", 1)
        .style("stroke","black")
        .style("stroke-width",0.5);
        
        //Add label at the same level of bar (first time only)
        insertedGroup.append("text")
        .attr("class","labelAtIndicator")
        .attr("x", thisObject.credibleBarLeftMargin - 5)
        .style("text-anchor", "end")
        .attr("y", 18)
        .style("fill","green")
        .style("font-size","11px")    
        .text(function(d){return "Credibility";});
        
        //Add reference lines (first time only)
        insertedGroup.append("line")
        .attr("class","leftLine")
        .attr("x1", thisObject.credibleBarLeftMargin)
        .attr("y1", topOfOutline+3)
        .attr("x2", thisObject.credibleBarLeftMargin)
        .attr("y2", topOfOutline+8)
        .style("fill","none")
        .style("stroke","black")
        .style("stroke-width",0.5);        
        
        insertedGroup.append("line")
        .attr("class","bottomLine")
        .attr("x1", thisObject.credibleBarLeftMargin)
	    .attr("y1", topOfOutline+8)
        .attr("x2", thisObject.credibleBarLeftMargin + thisObject.scaleCredibleIndicatorSize.range()[1])
	    .attr("y2", topOfOutline+8)
        .style("fill","none")
        .style("stroke","black")
        .style("stroke-width",0.5)
	    .attr("height", 8)
	    .attr("width", this.scaleCredibleIndicatorSize.range()[1]*2);
        
        insertedGroup.append("line")
		.attr("class","rightLine")
        .attr("x1", thisObject.credibleBarLeftMargin + this.scaleCredibleIndicatorSize.range()[1])
	    .attr("y1", topOfOutline+3)
        .attr("x2", thisObject.credibleBarLeftMargin + this.scaleCredibleIndicatorSize.range()[1])
	    .attr("y2", topOfOutline+8)
        .style("fill","none")
        .style("stroke","black")
        .style("stroke-width",0.5);
        
        insertedGroup.append("line")
		.attr("class","middleLine")
        .attr("x1", thisObject.credibleBarLeftMargin + this.scaleCredibleIndicatorSize(0.5))
	    .attr("y1", topOfOutline+5)
        .attr("x2", thisObject.credibleBarLeftMargin + this.scaleCredibleIndicatorSize(0.5))
	    .attr("y2", topOfOutline+8)
        .style("fill","none")
        .style("stroke","black")
        .style("stroke-width",0.5);
        
        //add reference text (first time only)
        insertedGroup.append("text")
		.attr("class","refLabelPos")
        .attr("x", thisObject.credibleBarLeftMargin + this.scaleCredibleIndicatorSize.range()[1])
	    .attr("y", topOfOutline + 21)
        //.style("fill","green")
        .style("font-size","11px")
        .style("text-anchor", "end")
	    .text("100%");
        
         //Add the transitions of frequency strength
        d3.select("#credibleBarGroup").selectAll(".credibleRect")
        .data([score])
        .transition()
        .delay(500)
        .duration(1000)
        .style("fill",function(d,i){
            return thisObject.scaleCredibleIndicatorColor(d);
        })
        .attr("width", function(d,i){
            return thisObject.scaleCredibleIndicatorSize(Math.abs(d));
        });
        
        
    }
    
    mainPanel.prototype.getTargetTextProperty = function(propertyName,listOfValues){
        


        /*var value;
        
        if (propertyName == ''){
            value = 99;
        }
        listOfValues.find(d => d>=value);*/
        return getRandomInt(listOfValues.length);
    }

// List functions you want other scripts to access
    window.mainPanel = {
        mainPanel: mainPanel
    };
})(window)


