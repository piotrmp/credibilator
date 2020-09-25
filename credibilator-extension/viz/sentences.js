(function (window, undefined) {

    var sentencePanel = function(selectorDiv, title){
        //interface variables
        
        //id for the textual area
        this.container = selectorDiv;
        this.title = title;
        
        d3.select(selectorDiv)
        .style("height", ($(window).height() - ($(selectorDiv)[0].getBoundingClientRect().top + intObj.verticalBottomSpace))+"px")
        .style("overflow","auto");
        
        var insertedDiv = d3.select(selectorDiv).selectAll(".sentenceTitleDiv").data([1]);
        
        insertedDiv.enter().append("div")
        .attr("class","sentenceTitleDiv")
        .text(title=="documents"?"Stylistically similar documents": "Similar sentences");
        
        
        insertedDiv.enter().append("div")
        .attr("class","sentenceSubTitleDiv")
        .text(function(){
            if (title=="sentences"){
                return "Click on a sentence in the main panel to find other similar sentences";
            }
            else{
                return "";
            }
        });
        
        insertedDiv.enter().append("div")
        .attr("id","targetDiv")
        .html(function(){
            if (title=="sentences"){
                return "";
            }
            else{
                return "Similar articles to <span class='quotingTitle'>" + $("#newsTitle").text()+"</span>";
            }
        })
        
        /*insertedDiv.enter().append("input")
        .attr("class","form-check-input")
        .attr("type","checkbox")
        .attr("value","")        
        .attr("id","sentenceCheckbox");
        
        insertedDiv.enter().append("label")        
        .attr("class","form-check-label")
        .attr("for","sentenceCheckbox")
        .style("padding-left","1em")
        .text("Show non-credible sentences only");
        */
        
        //set the div for thee tooltip
        this.divSentenceTooltip = d3.select(selectorDiv).append("div")	
                    .attr("class", "tooltip")				
                    .style("opacity", 0);
    }
    
    sentencePanel.prototype.showTargetSentence = function(sentence){
        var thisObj = this;
        d3.select("#targetDiv")
        .html(function(){
            if (thisObj.title=="sentences"){
                return "Similar sentences to <span class='quotingTitle'>" + sentence +"</span>:";
            }

        });
    }
    
    
    
    sentencePanel.prototype.adjustPanelHeight = function(){
        var thisObject = this;
        
        //Because this cannot be done while hidden it's forced to be done when changing mode
        if (thisObject.title != "sentences"){
            d3.select(thisObject.container)
            .style("height", ($(window).height() - ($(thisObject.container)[0].getBoundingClientRect().top + intObj.verticalBottomSpace))+"px");
        }
    }
        
    sentencePanel.prototype.setKNearestSentences = function(listOfKSenteces){
        //the list has one sentence per element and keys: text, source and label
        var thisObject = this;
        
      
        
        
        var selectedDivs = d3.select(thisObject.container).selectAll(".sentenceDiv")
        .data(listOfKSenteces);
        
        var spanTextClass;
        
        selectedDivs.enter().append("div")
        .merge(selectedDivs)
        .attr("class","sentenceDiv")
        .html(function(d,i){
            if (thisObject.title == "sentences"){
               spanTextClass = "blackSentenceSpan";
               //spanTextClass = (d.documentLabel < 0.5)? "credibleSentenceSpan" : "nonCredibleSentenceSpan";
               //spanTextClass = (d.predictedSentence < 0.5)? "credibleSentenceSpan" : "nonCredibleSentenceSpan";
            }
            else{
                spanTextClass = "blackSentenceSpan";
                //spanTextClass = (d.documentLabel < 0.5)? "credibleSentenceSpan" : "nonCredibleSentenceSpan";
                //spanTextClass = (d.predictedDoc < 0.5)? "credibleSentenceSpan" : "nonCredibleSentenceSpan";
            }
            var spanText = '<span class="' + spanTextClass + '">'+ (i+1).toString() +'- '+ d.text + '</span>';
            var spanSourceClass = (d.documentLabel==0.0)? "credibleSourceSpan" : "nonCredibleSourceSpan";
            var spanSource = '<span class="' + spanSourceClass + '">'+ d.source + '</span>';
            
            return spanText+'<!--br-->'+spanSource;
        })
        
        .on("mouseover", function(d){
            if (thisObject.title=="sentences"){
                mapPanelObj.showNeighbors([d]);
            }
            else{
                mapPanelDocsObj.showNeighbors([d]);
            }
            
            //show tooltip
            thisObject.divSentenceTooltip.transition()		
                    .duration(200)		
                    .style("opacity", .9);		
                
            thisObject.divSentenceTooltip.html(function(){
                if (thisObject.title=="sentences"){
                    return "Published on a " + (d.documentLabel==0.0?"credible":"non-credible")+" source and predicted as "+ (((1-d.predictedSentence)*100).toFixed(2)) + "% credible.";
                }
                else{
                    return "Published on a " + (d.documentLabel==0.0?"credible":"non-credible")+" source and predicted as "+ (((1-d.predictedDoc)*100).toFixed(2)) + "% credible.";
                    //return d.docId +": " + d.text + "<br/>"  + d.source;
                }
            })
            .style("left", (d3.event.pageX + 20) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
            
        })
        .on("mouseout", function(d){
            if (thisObject.title=="sentences"){
                mapPanelObj.resetAllNeighbors();
            }
            else{
                mapPanelDocsObj.resetAllNeighbors();
            }
            thisObject.divSentenceTooltip.transition()		
                    .duration(500)		
                    .style("opacity", 0);	
        })
        .on("mousedown", function(d){
            window.open(d.url,'_blank');
        });
        
        selectedDivs.exit().remove();
        
        
    }
    
    
    
    

// List functions you want other scripts to access
    window.sentencePanel = {
        sentencePanel: sentencePanel
    };
})(window)


