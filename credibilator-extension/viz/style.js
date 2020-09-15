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
            width = 580 - margin.left - margin.right,
            height = 490 - margin.top - margin.bottom;
        
        //In case we want to do it through a selector
        /*this.addSelector(selectionDOM, Object.keys(listOfValuesAllRows), listOfValuesAllRows);*/
        
        var svg = d3.select(selectionDOM).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            
        //header non-credible
        svg.append("text")
        .attr("x",margin.left)
        .attr("y",10)        
        .text("Non-credible news");
        
        //header credible
        svg.append("text")
        .attr("x",margin.secondLeft)
        .attr("y",10)        
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
        
        var margin = {top: 40, right: 12, bottom: 4, left: 20, secondLeft: 240};
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
                        .text(rowHeader);;
        
        headersToAdd.enter().append("text")
        .attr("class","rowHeader")
        .attr("x",margin.secondLeft - margin.left)
        .attr("y",10)
        .style("text-anchor", "middle")
        .text(rowHeader);
        
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
        this.setSingleBarChart(listOfValuesNonCredible, container.select(".leftGroupInRow"), idNonCredible);
        this.setSingleBarChart(listOfValuesCredible, container.select(".rightGroupInRow"), idCredible);
        
    }
    
    stylePanel.prototype.setSingleBarChart = function(listOfValues,selectionDOM, idThisDocument){
                
        var margin = {top: 20, right: 45, bottom: 20, left: 45},
            width = 240 - margin.left - margin.right,
            height = 125 - margin.top - margin.bottom;
        var barGap = 1;
                
        //define the scales
        var y = d3.scaleLinear()
                .domain([0, d3.max(listOfValues, function(d){
                    return +d.valuesY;
                })])
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
            .style("font-size", "8px")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", "-.55em")
            .attr("transform", "rotate(-90)" );
        
        xAxisToAdd.transition().call(xAxis)
        .selectAll("text")
        .style("font-size", "8px")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", "-.55em")
        .attr("transform", "rotate(-90)" );;

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
                            return d.valuesX + " : " + d.valuesY;
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
                return d.valuesX + " : " + d.valuesY;
            });
            
        rectanglesToAdd.exit().remove();
    }
    
    

// List functions you want other scripts to access
    window.stylePanel = {
        stylePanel: stylePanel
    };
})(window)


