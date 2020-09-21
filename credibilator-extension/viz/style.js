(function (window, undefined) {

    var stylePanel = function(selectorDiv){
        //interface variables
        
        //id for the textual area
        this.container = selectorDiv;
        
        
    }
    
    stylePanel.prototype.setHeaderAndRows = function(listOfValuesAllRows,selectionDOM,mainPanelObj){
        var thisObject = this;
        this.mainPanelObj = mainPanelObj;
        this.listOfValuesAllRows = listOfValuesAllRows
        
        var margin = {top: 40, right: 12, bottom: 4, left: 20, secondLeft: 240},
            //width = 580 - margin.left - margin.right,
            width = ($("#thirdMainCol")[0].getBoundingClientRect().right - ($("#thirdMainCol")[0].getBoundingClientRect().left + margin.left + margin.right)),
            height = 400 - margin.top - margin.bottom;
        
        this.width = width;
        this.height = height;
        //In case we want to do it through a selector
        /*this.addSelector(selectionDOM, Object.keys(listOfValuesAllRows), listOfValuesAllRows);*/
        
        //header feature contribution
        var insertedDiv = d3.select(selectionDOM).selectAll(".sentenceTitleDiv").data([1]);
        
        insertedDiv.enter().append("div")
        .attr("class","featDistribTitleDiv")
        .text("Feature distribution");
        
        
        var svg = d3.select(selectionDOM).append("svg")
            .attr("width", width - margin.left - margin.right)
            .attr("height", height + margin.top + margin.bottom)
            
        //header non-credible
        svg.append("text")
        .attr("x",width/4 - (margin.left+margin.right))
        .attr("y",20)
        .style("text-anchor","middle")
        .text("Non-credible news");
        
        //header credible
        svg.append("text")
        .attr("x",3*width/4 - (margin.left+margin.right))
        .attr("y",20)
        .style("text-anchor","middle")
        .text("Credible news");
        
        
        //assign visuals to each row
        Object.keys(listOfValuesAllRows).forEach(function(d,i,a){
            
            //Create row group
            var selectionForRow = svg.append("g")
            .attr("class","groupInRow")
            .attr("transform", "translate(10,"  + (margin.top + i *  (height/a.length))+ ")");
            
            /*idThisDocument = mainPanelObj.getTargetTextProperty(d, listOfValuesAllRows[d].map(function(d){return d.valuesX}));
            thisObject.setTwoColumnBarChart(d, selectionForRow);
            */
        });
        
    }
    
    stylePanel.prototype.reDrawFirstRow = function(featureLabel){
        
        /*var valuesXExtracted = thisObject.listOfValuesAllRows[d].map(function(d){return d.valuesX});
        
        idThisDocument = this.mainPanelObj.getTargetTextProperty(d, valuesXExtracted);*/
        
        sp.setTwoColumnBarChart(featureLabel, d3.select(".groupInRow"));
    }
    
    stylePanel.prototype.addSelector = function(container,elements){
        var thisObject = this;
        
        var selector = d3.select(container)
                            .append("select")
                            .attr("id","dropdown")
                            .on("change", function(d){
                                selection = document.getElementById("dropdown");
                                
                                thisObject.reDrawFirstRow(selection.value, thisObject)
                                

                             });

        selector.selectAll("option")
          .data(elements)
          .enter().append("option")
          .attr("value", function(d){
            return d;
          })
          .text(function(d){
            return d;
          })
    }
    
    stylePanel.prototype.setTwoColumnBarChart = function(rowHeader,container){
        //
        
        var margin = {top: 40, right: 12, bottom: 4, left: 20, secondLeft: this.width/2 };//240};
            /*width = 480 - margin.left - margin.right,
            height = 190 - margin.top - margin.bottom;
        
        var svg = d3.select(selectionDOM).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        */
        //Create two columns
        var gToAdd = container.selectAll("g").data([0,1]);
        
        gToAdd.enter().append("g")
            .attr("class",function(d){
                if (d==0){
                    return "leftGroupInRow";
                }
                else{
                    return "rightGroupInRow";
                }
            })
            .attr("transform", function(d){
                if (d==0){
                    return "translate(" + margin.left + "," + margin.top + ")"
                }
                else{
                    return "translate(" + margin.secondLeft + "," + margin.top + ")";
                }
            });
            
            
        
        //Append row header
        var headersToAdd = container.selectAll(".rowHeader").data([0])
        .text(rowHeader);
        
                        
        container.select(".featureDescription")
                        .text(featureDescription(rowHeader));
        
        var headerAdded = headersToAdd.enter().append("text")
        .attr("class","rowHeader")
        .attr("x",margin.secondLeft - margin.left)
        .attr("y",220+10)
        .style("text-anchor", "middle")
        .text(rowHeader);
        
        headersToAdd.enter().append("text")
        .attr("x",margin.secondLeft - margin.left)
        .attr("y",220+30)
        .style("text-anchor", "middle")
        .attr("class","featureDescription")
        .text(featureDescription(rowHeader));
        
        
        //prepare data
        var idNonCredible = 0;
        listOfValuesNonCredible = histNonCredible[rowHeader].percentiles.map(function(d,i,arr){
            //delete d.valuesYCredible;
            //d.valuesY = d.valuesYNonCredible;
            //delete d.valuesYNonCredible;
            if ((d <= globalContainer.stylometricFeatures[rowHeader])&&((i+1)<(arr.length))&&(arr[i+1]>globalContainer.stylometricFeatures[rowHeader])){
                idNonCredible = i
                return {"valuesX":"(this doc) " + (i*10)+"-"+((i+1)*10)+"%","valuesY":histNonCredible[rowHeader].freqs[i]/totalNonCredibleDocs};
                
            }
            else{
                return {"valuesX":  (i*10)+"-"+((i+1)*10)+"%","valuesY":histNonCredible[rowHeader].freqs[i]/totalNonCredibleDocs};
            }
        });
        listOfValuesNonCredible.pop();
        var idCredible=0;
        listOfValuesCredible = histNonCredible[rowHeader].percentiles.map(function(d,i,arr){
            //delete d.valuesYNonCredible;
            //d.valuesY = d.valuesYCredible;
            //delete d.valuesYCredible;
            if ((d <= globalContainer.stylometricFeatures[rowHeader])&&((i+1)<(arr.length))&&(arr[i+1]>globalContainer.stylometricFeatures[rowHeader])){
                idCredible = i;
                return {"valuesX":"(this doc) " + (i*10)+"-"+((i+1)*10)+"%","valuesY":histCredible[rowHeader].freqs[i]/totalCredibleDocs};
            }
            else{
                return {"valuesX": (i*10)+"-"+((i+1)*10)+"%","valuesY": histCredible[rowHeader].freqs[i]/totalCredibleDocs};
            }
        })
        listOfValuesCredible.pop();
        //set the two bar charts
        let maxFreqNonCred = d3.max(listOfValuesNonCredible, function(d){
                            return +d.valuesY;
                          });
        let maxFreqCred = d3.max(listOfValuesCredible, function(d){
                            return +d.valuesY;
                          });
        let maxMax = d3.max([maxFreqCred,maxFreqNonCred]);
        this.setSingleBarChart(listOfValuesNonCredible, container.select(".leftGroupInRow"), idNonCredible, maxMax);
        this.setSingleBarChart(listOfValuesCredible, container.select(".rightGroupInRow"), idCredible, maxMax);
        
    }
    
    stylePanel.prototype.setSingleBarChart = function(listOfValues,selectionDOM, idThisDocument, maxMax){
                
        var margin = {top: 20, right: 45, bottom: 20, left: 45},
            width = this.width/2 - margin.left - margin.right,
            height = 125 - margin.top - margin.bottom;
        var barGap = 1;
                
        //define the scales
        var y = d3.scaleLinear()
                .domain([0, maxMax])
                .range([height, 0]);

        var x = d3.scaleBand()
                .domain(listOfValues.map(function(d){ return d.valuesX;}))
                .range([0, width]);

        //define the axis
        var xAxis = d3.axisBottom(x);
            //.tickFormat(function(d){ return d.valuesX;});

        var yAxis = d3.axisLeft(y);
        
        //append the tick labels
        var xAxisToAdd = selectionDOM.selectAll(".x.axis").data([0]);
        
        xAxisToAdd.enter().append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .selectAll("text")
            .style("font-size", "9px")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", "-.55em")
            .attr("transform", "rotate(-60)" );
        
        xAxisToAdd.transition().call(xAxis)
        .selectAll("text")
        .style("font-size", "9px")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", "-.55em")
        .attr("transform", "rotate(-60)" );;

        var yAxisToAdd = selectionDOM.selectAll(".y.axis").data([0]);
                                    
        
        yAxisToAdd.enter().append("g")
            .attr("class", "y axis")
            .call(yAxis);
            
        yAxisToAdd.transition().ease(d3.easeLinear).call(yAxis);

        var rectanglesToAdd = selectionDOM.selectAll("rect")
                                        .data(listOfValues);
        
        rectanglesToAdd.attr("class",function(d,i){
                                    if (i == idThisDocument){
                                        return "thisBar"
                                    }
                                    else{
                                        return "normalBar"
                                    }
                                })
                        .transition()
                        .attr("height", function(d){
                            return height - y(+d.valuesY);
                        })
                        .attr("x", function(d, i){
                            return (width / listOfValues.length) * i ;
                        })
                        .attr("y", function(d){
                            return y(+d.valuesY);
                        })
                        .ease(d3.easeLinear)
                        .select("title")
                        .text(function(d){
                            return d.valuesX + " : " + d.valuesY.toFixed(2);
                        });
        
        rectanglesToAdd.enter()
            .append("rect")
            .attr("width", width/listOfValues.length - barGap)
            .attr("height", function(d){
                return height - y(+d.valuesY);
            })
            .attr("x", function(d, i){
                return (width / listOfValues.length) * i ;
            })
            .attr("y", function(d){
                return y(+d.valuesY);
            })
            .attr("class",function(d,i){
                if (i == idThisDocument){
                    return "thisBar"
                }
                else{
                    return "normalBar"
                }
            })
            .append("title")
            .text(function(d){
                return d.valuesX + " : " + d.valuesY.toFixed(2);
            });
            
        rectanglesToAdd.exit().remove();
    }
    
    

// List functions you want other scripts to access
    window.stylePanel = {
        stylePanel: stylePanel
    };
})(window)


