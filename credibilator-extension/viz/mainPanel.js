(function (window, undefined) {

    var mainPanel = function(selectorText, selectorBar){
        //interface variables
        var thisObject = this;
        //id for the textual area
        this.textContainerId = selectorText;
        //id for the credibility bar
        this.barContainerId = selectorBar;
        
        //variables for the credibility bar        
        this.credibilityBarSVGwidth = 400
        this.credibleBarWidth = 200
        this.credibleBarLeftMargin = 70
        this.scaleCredibleIndicatorSize = d3.scaleLinear().domain([0,1]).range([1,this.credibleBarWidth]);
        //this.scaleCredibleIndicatorColor = d3.scaleLinear().domain([0,1]).range(["lightblue","red"]);
        
        this.scaleCredibleIndicatorColor = d3.scaleLinear()
                                       .domain([0, 0.5, 1])
                                       .range([intObj.nonCredibleColor, intObj.neutralColor, intObj.credibleColor])
        
        //variables for the textual area
        this.scaleNonCredibleTextHighlightColor = d3.scaleLinear().domain([0,1]).range([intObj.neutralColor,intObj.nonCredibleColor]);
        this.scaleCredibleTextHighlightColor = d3.scaleLinear().domain([0,1]).range([intObj.neutralColor, intObj.credibleColor]);
        
        this.currentConfidence = "sentence";
        this.currentView = "human";
        this.currentHighlighting = "category";
            
        $('#switchSentenceScore').on('change', function (event) {      thisObject.switchConfidence();
        }); 
        /*$('#switchMachineView').on('change', function (event) {      thisObject.switchMachineView();
        }); */
        $('#machineViewOff').on("change", function () {

            thisObject.switchMachineView();
        });
        $('#machineViewOn').on("change", function () {

            thisObject.switchMachineView();
        });
        /*$('#switchSequenceView').on('change', function (event) {      thisObject.switchTagging();
        });*/ 
        
        $('#highlightCategory').on("change", function () {

            thisObject.switchTripleTagging("category");
        });
        
        $('#highlightSequence').on("change", function () {
            thisObject.switchTripleTagging("sequence");
        });
        
        $('#highlightCasing').on("change", function () {
            thisObject.switchTripleTagging("casing");
        });
        
        this.neighborsToRetrieve = 10;
        
        this.divTooltip = d3.select(selectorText).append("div")	
                    .attr("class", "tooltip")				
                    .style("opacity", 0);
        this.divTooltipCredScore = d3.select(selectorBar).append("div")	
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
            //No need to blank this one
            //docPanelObj.setKNearestSentences([]);
        }
        else{
            this.currentConfidence = "document";
            this.setCredibleBar(this.documentConfidence);
            intObj.hideSentenceVis();
            intObj.showDocVis();
            docPanelObj.adjustPanelHeight();
            //If we want to show all the highlights at the same time
            /*
            if (this.currentHighlighting=="category"){
                this.setText(listOfCategories);
            }
            else if (this.currentHighlighting=="sequence"){
                this.setText(listOfSequences);
            }
            else if (this.currentHighlighting=="casing"){
                this.setText(listOfCasing);
            }*/
            //with the highlighting based on the clicked feature
            fcp.updateCurrentHighlighting("foo");
            
            sentPanelObj.setKNearestSentences([]);
            sentPanelObj.showTargetSentence("");
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
    
    //Not used since we have three categories
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
    
    mainPanel.prototype.switchTripleTagging = function(newTagging){
        if (this.currentHighlighting!=newTagging){
            if (newTagging=="sequence"){
                this.currentHighlighting="sequence";
                this.setText(listOfSequences);
            }
            if (newTagging=="category"){
                this.currentHighlighting = "category";
                this.setText(listOfCategories);
            }
            if (newTagging=="casing"){
                this.currentHighlighting = "casing";
                this.setText(listOfCasing);
            }            
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
                let c = d3.color(thisObject.scaleNonCredibleTextHighlightColor(d.score))
                c.opacity = 0.8;
                return c;
            }
            else{
                let c = d3.color(thisObject.scaleCredibleTextHighlightColor(Math.abs(d.score)));
                c.opacity = 0.8;
                return c;
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
            
            
            //actions on hovering
            //thisObject.mapObject.showNeighbors(thisObject.getkNN(d,3));
            $(this).css({"outline": "1px solid blue", "padding" : ".2em .0em"});
            
            //show tooltip
            if (!((thisObject.currentConfidence=="document")&&(d.reason.length == 0))){
                var div = mp.divTooltip;
                
                div.transition()
                .duration(200)
                .style("opacity", .9);
            
                div.html(function(){
                    if (thisObject.currentConfidence=="document"){
                        return d.reason.join("<br/>")
                    }
                    else{
                        return "Predicted sentence credibility: " +((1-d.score)*100).toFixed(2) + "%"
                    }
                })
                .style("left", (d3.event.pageX + 20) + "px")
                .style("top", (d3.event.pageY - 28) + "px");	
            }
        })
        .on("mouseout", function(d,i){
            //reset any previous hovering
            //thisObject.mapObject.resetAllNeighbors();
            $("span").css({"outline": "0px solid blue", "padding" : ".0em .0em"});
            
            //hide tooltip
            var div = mp.divTooltip;
            div.transition()		
            .duration(500)		
            .style("opacity", 0);
            
        })
        .on("mousedown",function(d,i){
            if (thisObject.currentConfidence=="sentence"){
                sentPanelObj.showTargetSentence(d.text);
                mp.getkNN(d,mp.neighborsToRetrieve)
            }
        });
        
        selectedSpan.exit().remove();
    }
    
    mainPanel.prototype.getkNN = function(datum, k, listOfIndices){
        mapPanelObj.resetAllNeighbors();
        dataToPass = {"n": k , "query": datum.origVector, "ixs": listOfIndices};
        bec.backendCall(bec.fakelandDataURLkNeigh,dataToPass,bec.returnKNeighbors);
    }
    
    mainPanel.prototype.getkNNDocs = function(k,featureValues){
        function shuffle(array,pronoun) {
            //used for the user study only
          var currentIndex = array.length, temporaryValue, randomIndex;

          // While there remain elements to shuffle...
          while (0 !== currentIndex) {
            

            
            currentIndex -= 1;
            
            if (featureList[currentIndex].slice(0,3)==pronoun){
                
                // Pick a remaining element...
                randomIndex = Math.floor(Math.random() * (currentIndex+1));
                /*while (featureList[randomIndex].slice(0,3)!="TAG"){
                    randomIndex = Math.floor(Math.random() * (currentIndex+1));
                }*/
                if (featureList[randomIndex].slice(0,3)==pronoun){
                
    
                    // And swap it with the current element.
                    temporaryValue = array[currentIndex];
                    array[currentIndex] = array[randomIndex];
                    array[randomIndex] = temporaryValue;
                }
            }
          }

          return array;
        }
        mapPanelDocsObj.resetAllNeighbors();
        if (USERSTUDYMODE &&(modelName == 'random')){
            featureValues_copy = featureValues.slice();
console.log(featureValues)
            shuffle(featureValues_copy,"TAG");
            shuffle(featureValues_copy,"cat");
console.log(featureValues_copy)
            dataToPass = {"n": k , "query": featureValues_copy};
        }
        else{
            dataToPass = {"n": k , "query": featureValues};
        }
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
        .attr("width", thisObject.credibilityBarSVGwidth)
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
        //.style("fill","green")
        .style("font-size","13px")    
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
        /*.style("stroke", function(d){
            if (Math.abs(d)>0.5){
                return intObj.credibleColor;
            }
            else{
                return intObj.nonCredibleColor;
            }
        })*/
        .attr("width", function(d,i){
            return thisObject.scaleCredibleIndicatorSize(Math.abs(d));
        });
        
        d3.select("#credibleBarGroup").selectAll(".credibleRect")
        .on("mouseover", function(d){
            //show tooltip
            
            var div = mp.divTooltipCredScore;
            div.transition()
                    .duration(200)
                    .style("opacity", .9);
                    
            div.html("The text on this article is " + Math.abs(d*100).toFixed(2) + "% credible using a " + ((thisObject.currentConfidence=="document")? "stylometric analyzer":"neural-based analyzer."))
                    .style("left", (d3.event.pageX + 20) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");	
            
        })
        .on("mouseout", function(d){
            //hide tooltip
            var div = mp.divTooltipCredScore;
            div.transition()		
                .duration(500)		
                .style("opacity", 0);
        })
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


