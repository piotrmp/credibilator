(function (window, undefined) {

    var featureContributionPanel = function(selectorDiv,intObj){
        //interface variables
        this.title = "Feature contribution";
        
        //div for this panel
        this.container = selectorDiv;
        
        this.intObj = intObj;
        
    }
    
    featureContributionPanel.prototype.setListeners = function(){
        //
        var thisObject = this;
        
        //listener checkboxes
        $('#reduceFeatureButton').click(function() {
            fcp.reduceFeaturesToShow();
            //fcp.updateCurrentHighlighting();
        });
        $('#increaseFeatureButton').click(function() {
            fcp.increaseFeaturesToShow();
            //fcp.updateCurrentHighlighting();
        })
    }
    
    featureContributionPanel.prototype.updateCurrentHighlighting = function(targetFeature){
        
        //if (mp.currentHighlighting=="category"){
        if (targetFeature.substring(0,3)=="cat"){
            listOfCategories = showHighlightsCategory(glmDict,targetFeature);
            mp.setText(listOfCategories);
        }
        //else if (mp.currentHighlighting=="sequence"){
        else if (targetFeature.substring(0,3)=="TAG"){
            listOfSequences = showHighlightsSequence(glmDict,targetFeature);
            mp.setText(listOfSequences);
        }
        //else if (mp.currentHighlighting=="casing"){
        else{
            listOfCasing = showHighlightsCasing(glmDict,targetFeature);
            mp.setText(listOfCasing);
        }
    }
    featureContributionPanel.prototype.setHeaderAndRows = function(listOfValues,selectionDOM,mainPanelObj){
        
        var thisObject = this;
        
        this.mainPanelObj = mainPanelObj;
        this.listOfValuesAllRows = listOfValues
        
        var margin = {top: 30, right: 12, bottom: 4, left: 20},
            //width = 580 - margin.left - margin.right,
            width = ($("#secondMainCol")[0].getBoundingClientRect().right - ($("#secondMainCol")[0].getBoundingClientRect().left + margin.left + margin.right)),
            height = 300 - margin.top - margin.bottom;
        
        
        this.width = width;
         
        //header feature contribution
        var insertedDiv = d3.select(selectionDOM).selectAll(".sentenceTitleDiv").data([1]);
        
        insertedDiv.enter().append("div")
        .attr("class","featContribTitleDiv")
        .text(thisObject.title);
        
        insertedDiv.enter().append("div")
        .attr("class","featContribSubTitleDiv")
        .html("Click +/- to add or remove a feature.<br>Click on a bar to inspect feature distribution.");
        
        let nestedInsertedDiv = insertedDiv.enter().append("div");
        
        nestedInsertedDiv.append("button")
        .attr("id","increaseFeatureButton")
        .attr("class", "btn")
        .style("font-size","x-large")
        .append("i")
        .attr("class", "fa fa-plus-circle");
        
        nestedInsertedDiv.append("button")
        .attr("id","reduceFeatureButton")
        .attr("class", "btn")
        .style("font-size","x-large")
        .append("i")
        .attr("class", "fa fa-minus-circle");
        
        this.setListeners();
        var svg = d3.select(selectionDOM).append("svg")
            .attr("width", width - margin.left - margin.right)
            .attr("height", height + margin.top + margin.bottom);
            
            
        
        /*
        svg.append("text")
        .attr("x",margin.left)
        .attr("y",10)        
        .text(thisObject.title);
        */
        
            
        //Create row group
        let i=0;
        this.selectionForRow = svg.append("g")
        .attr("class","featureContributionRow")
        .attr("transform", "translate(0,"  + (margin.top + i *  (height))+ ")");
        
        
        thisObject.setFlexibleColumnBarChart(listOfValues, this.selectionForRow);
        
        
    }
    
    featureContributionPanel.prototype.setFlexibleColumnBarChart = function(listOfValues,selectionDOM){
                
        var margin = {top: 20, right: 45, bottom: 20, left: 45},
            width = this.width - (margin.right + margin.top),
            totalHeight = 125 - margin.top - margin.bottom;
        var height = totalHeight / 2;
        
        var barGap = 1;
        
        var newLeftMargin = 30;
        
        var thisObj = this;
                
        //define the scales
        var y = d3.scaleLinear()
                .domain([
                    0, 
                    d3.max(listOfValues, function(d){
                        return Math.abs(+d.y);
                    })])
                .range([height, 0]);
                
        var falseY = d3.scaleLinear()
                .domain([
                    d3.min(listOfValues, function(d){
                        return (+d.y);
                    }), 
                    d3.max(listOfValues, function(d){
                        return Math.abs(+d.y);
                    })])
                .range([0, height*2]);

        var x = d3.scaleBand()
                .domain(listOfValues.map(function(d){ return d.label;}))
                .range([newLeftMargin, width]);

                
        //variables for the textual area
        this.featureCredibleColors = d3.scaleLinear()
                                       .domain([-y.domain()[1], 0, y.domain()[1]])
                                       .range([thisObj.intObj.nonCredibleColor, "white", thisObj.intObj.credibleColor])
        
        var thisObj = this;
        //define the axis
        var xAxis = d3.axisBottom(x);
            //.tickFormat(function(d){ return d.valuesX;});

        var yAxis = d3.axisLeft(falseY);
        
        //append the tick labels
        var xAxisToAdd = selectionDOM.selectAll(".x.axis").data([0]);
        
        xAxisToAdd.enter().append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .selectAll("text")
            .style("font-size", "12px")
            .style("text-anchor", "start")
            //.attr("dx", -1*height)//"-.8em")
            //.attr("dy", "-.55em")
            .attr("transform", "translate(0," + (height + 2) + ") rotate(45)" );
        
        xAxisToAdd.transition().call(xAxis)
        .selectAll("text")
        .style("font-size", "12px")
        .style("text-anchor", "start")
        //.attr("dx", -1*height)//"-.8em")
        //.attr("dy", "-.55em")
        .attr("transform", "translate(0," + (height + 2) + ") rotate(45)" );

        var yAxisToAdd = selectionDOM.selectAll(".y.axis").data([0]);
                                    
        
        yAxisToAdd.enter().append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .attr("transform", "translate(" + newLeftMargin + ",0)");
            
        yAxisToAdd.transition().ease(d3.easeLinear).call(yAxis);

        var rectanglesToAdd = selectionDOM.selectAll("rect")
                                        .data(listOfValues);
        
        rectanglesToAdd.attr("class","normalBar")
                        .transition()
                        .attr("width", (width - newLeftMargin)/listOfValues.length - barGap)
                        .attr("height", function(d){
                            if (+d.y>0){
                                return height - y(+d.y);
                            }
                            else{
                                return height - y(Math.abs(+d.y));
                            }
                        })
                        .attr("x", function(d, i){
                            return x(d.label);//30+ (width / listOfValues.length) * i ;
                        })
                        .attr("y", function(d){
                            if (+d.y>0){
                                return y(+d.y);
                            }
                            else{
                                return height;// + y(Math.abs(+d.y))
                            }
                        })
                        .attr("fill",function(d){
                            return thisObj.featureCredibleColors(+d.y);
                        })
                        .ease(d3.easeLinear)
                        .select("title")
                        .text(function(d){
                            return d.label + " : " + (d.y).toFixed(2);
                        });
        
        rectanglesToAdd.enter()
            .append("rect")
            .attr("width", (width- newLeftMargin)/listOfValues.length - barGap)
            .attr("height", function(d){
                if (+d.y>0){
                    return height - y(+d.y);
                }
                else{
                    return height - y(Math.abs(+d.y));
                }
            })
            .attr("x", function(d, i){
                return x(d.label);//30+(width / listOfValues.length) * i ;
            })
            .attr("y", function(d){
                if (+d.y>0){
                    return y(+d.y);
                }
                else{
                    return height;// + y(Math.abs(+d.y))
                }
            })
            .attr("class","normalBar")
            .attr("fill",function(d){
                return thisObj.featureCredibleColors(+d.y);
            })
            .on("mousedown",function(d){
                if (d.label!="OTHER"){
                    sp.reDrawFirstRow(d.label);
                    thisObj.updateCurrentHighlighting(d.label);
                }
            })
            .append("title")
            .text(function(d){
                return d.label + " : " + (d.y).toFixed(2);
            });
            
        rectanglesToAdd.exit().remove();
    }
    
    featureContributionPanel.prototype.reduceFeaturesToShow = function(){
        if (intObj.featuresToShow>1){
            intObj.featuresToShow = intObj.featuresToShow - 1
            getNFeatures(intObj.featuresToShow);        
            this.setFlexibleColumnBarChart(chartData, this.selectionForRow);
        }
    }
    
    featureContributionPanel.prototype.increaseFeaturesToShow = function(){
        intObj.featuresToShow = intObj.featuresToShow + 1
        getNFeatures(intObj.featuresToShow);        
        this.setFlexibleColumnBarChart(chartData, this.selectionForRow);
    }

    // List functions you want other scripts to access
    window.featureContributionPanel = {
        featureContributionPanel: featureContributionPanel
    };
})(window)