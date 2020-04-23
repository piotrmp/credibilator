(function (window, undefined) {

    var sentencePanel = function(selectorDiv){
        //interface variables
        
        //id for the textual area
        this.container = selectorDiv;
        
        d3.select(selectorDiv)
        .style("height", ($(window).height() - 500)+"px")
        .style("overflow","auto");
        
        var insertedDiv = d3.select(selectorDiv).selectAll(".sentenceTitleDiv").data([1]);
        
        insertedDiv.enter().append("div")
        .attr("class","sentenceTitleDiv")
        .text("Explore similar sentences");
        
        insertedDiv.enter().append("div")
        .attr("class","sentenceSubTitleDiv")
        .text("Click on a sentence in the main panel to find other similar sentences");
        
        insertedDiv.enter().append("input")
        .attr("class","form-check-input")
        .attr("type","checkbox")
        .attr("value","")        
        .attr("id","sentenceCheckbox");
        
        insertedDiv.enter().append("label")        
        .attr("class","form-check-label")
        .attr("for","sentenceCheckbox")
        .style("padding-left","1em")
        .text("  Show non-credible sentences only");
        
        
        
    }
    
    sentencePanel.prototype.setKNearestSentences = function(listOfKSenteces){
        //the list has one sentence per element and keys: text, source and label
        var thisObject = this;
        
        var selectedDivs = d3.select(thisObject.container).selectAll(".sentenceDiv")
        .data(listOfKSenteces);
        
        selectedDivs.enter().append("div")
        .merge(selectedDivs)
        .attr("class","sentenceDiv")
        .html(function(d,i){
            var spanTextClass = (d.label=="credible")? "credibleSentenceSpan" : "nonCredibleSentenceSpan";
            var spanText = '<span class="' + spanTextClass + '">'+ i.toString() +'- "'+ d.text + '"</span>';
            var spanSourceClass = (d.label=="credible")? "credibleSourceSpan" : "nonCredibleSourceSpan";
            var spanSource = '<span class="' + spanSourceClass + '">'+ d.source + '</span>';
            return spanText+'<!--br-->'+spanSource;
        })
        
        
    }
    
    
    
    

// List functions you want other scripts to access
    window.sentencePanel = {
        sentencePanel: sentencePanel
    };
})(window)


