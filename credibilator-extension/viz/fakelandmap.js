(function (window, undefined) {

    var mapPanel = function(selectorDiv,bec){
        //interface variables
        
        //id for the textual area
        this.container = selectorDiv;
        
        this.nonCredibleColor = "red";
        this.credibleColor = "green";
        this.backendObj = bec;
        
        
        //get data asap
        this.getData("random",5000,null);
    }
    
    
    
    mapPanel.prototype.setHeaderAndMap = function(data,selectionDOM,mapObj){
        var thisObj = this;
        this.mapObj = mapObj;
        
        //data = this.mapObj.getData(baseProjectionData);
        
        //set margins
        var margin = { top: 20, right: 20, bottom: 30, left: 30 };
        width = 900 - margin.left - margin.right,
        height = 480 - margin.top - margin.bottom;
        
        //create SVG
        var svg = d3.select(selectionDOM).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        
        //set the div for thee tooltip
        var div = d3.select(selectionDOM).append("div")	
                    .attr("class", "tooltip")				
                    .style("opacity", 0);
        
        //set scales
        this.x = d3.scaleLinear().range([0, width]);//.nice();
        this.y = d3.scaleLinear().range([height, 0]);
        
        //set domain for scales
        var xExtent = d3.extent(data, function (d) { return d.projection[0]; });
        var yExtent = d3.extent(data, function (d) { return d.projection[1]; });
        //to avoid points at the edge of the graph
        xExtent[0] = xExtent[0] -10; xExtent[1] = xExtent[1] + 10;
        yExtent[0] = yExtent[0] -10; yExtent[1] = yExtent[1] + 10;
        
        this.x.domain(xExtent);//.nice();
        this.y.domain(yExtent);//.nice();
        
        this.sentenceCredibleColors = d3.scaleLinear()
                                       .domain([0, 0.5, 1])
                                       .range([thisObj.credibleColor, "white", thisObj.nonCredibleColor])
        
        //set axis
        var xAxis = d3.axisBottom(mapPanelObj.x).ticks(12);
        var yAxis = d3.axisLeft(mapPanelObj.y).ticks(12 * height / width);
        
        // x axis
        svg.append("g")
           .attr("class", "x axis")
           .attr('id', "axis--x")
           .attr("transform", "translate(0," + height + ")")
           .call(xAxis);

        /*svg.append("text")
         .style("text-anchor", "end")
            .attr("x", width)
            .attr("y", height - 8)
         .text("X Label");*/

        // y axis
        svg.append("g")
            .attr("class", "y axis")
            .attr('id', "axis--y")
            .call(yAxis);

        /*svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", "1em")
            .style("text-anchor", "end")
            .text("Y Label");*/
        
        
        
        //set brushing vars
        var brush = d3.brush().extent([[0, 0], [width, height]]).on("end", brushended),
        idleTimeout,
        idleDelay = 350;
        
        //set clip-path
        var clip = svg.append("defs").append("svg:clipPath")
            .attr("id", "clip")
            .append("svg:rect")
            .attr("width", width )
            .attr("height", height )
            .attr("x", 0) 
            .attr("y", 0);
        
        //set clip to svg
        var scatter = svg.append("g")
             .attr("id", "scatterplot")
             .attr("clip-path", "url(#clip)");
             
        //Make the scatterplot brushable
        scatter.append("g")
            .attr("class", "brush")
            .call(brush);
            
        //set dots
        scatter.selectAll(".dot")
            .data(data)
            .enter().append("circle")
            .attr("fill", function (d){
                return mapPanelObj.sentenceCredibleColors(d.predictedSentence);
            })
            .attr("stroke-width","2px" )
            .attr("stroke", function (d){
                if (d.documentLabel<=0.5){
                    return thisObj.credibleColor
                }
                else{
                    return thisObj.nonCredibleColor
                }
            })
            .attr("r", 4)
            .attr("cx", function (d) { return mapPanelObj.x(d.projection[0]); })
            .attr("cy", function (d) { return mapPanelObj.y(d.projection[1]); })
            .attr("opacity", 0.5)
            .on("mouseover", function(d) {		
                div.transition()		
                    .duration(200)		
                    .style("opacity", .9);		
                div.html(d.docId +": " + d.text + "<br/>"  + d.source)	
                    .style("left", (d3.event.pageX + 20) + "px")		
                    .style("top", (d3.event.pageY - 28) + "px");	
                })					
            .on("mouseout", function(d) {		
                div.transition()		
                    .duration(500)		
                    .style("opacity", 0);	
            });
            
        
        
        this.data = data;
        
        function brushended() {

            var s = d3.event.selection;
            if (!s) {
                if (!idleTimeout) return idleTimeout = setTimeout(idled, idleDelay);
                mapPanelObj.x.domain(d3.extent(data, function (d) { return d.projection[0]; })).nice();
                mapPanelObj.y.domain(d3.extent(data, function (d) { return d.projection[0]; })).nice();
            } else {
                
                mapPanelObj.x.domain([s[0][0], s[1][0]].map(mapPanelObj.x.invert, mapPanelObj.x));
                mapPanelObj.y.domain([s[1][1], s[0][1]].map(mapPanelObj.y.invert, mapPanelObj.y));
                scatter.select(".brush").call(brush.move, null);
            }
            zoom();
        }

        function idled() {
            idleTimeout = null;
        }

        function zoom() {
            

            
            var t = scatter.transition().duration(750);
            svg.select("#axis--x").transition(t).call(xAxis);
            svg.select("#axis--y").transition(t).call(yAxis);
            scatter.selectAll("circle").transition(t)
            .attr("cx", function (d) { return mapPanelObj.x(d.projection[0]); })
            .attr("cy", function (d) { return mapPanelObj.y(d.projection[1]); });
            
            dataToPass = {"sampling": "random" , "nSamples": 5000, "range":[[mapPanelObj.x.domain()[0],mapPanelObj.y.domain()[0]],[mapPanelObj.x.domain()[1],mapPanelObj.y.domain()[1]]]};
            thisObj.backendObj.backendCall(thisObj.backendObj.fakelandDataURL,dataToPass,thisObj.backendObj.returnZoomedData);
        }

    
    }
    
    mapPanel.prototype.drawZoomedData = function(zoomData){
        
        zoomData.filter(function(d){
            return mapPanelObj.data.includes(d.docId);
        })
        
        var div = d3.select(".tooltip");
        d3.select("#scatterplot").selectAll(".zoomedDots")
            .data(zoomData)
            .enter().append("circle")
            .attr("fill", function (d){
                return mapPanelObj.sentenceCredibleColors(d.predictedSentence);
                //return "black"
            })
            .attr("stroke-width","2px" )
            .attr("stroke", function (d){
                if (d.documentLabel<=0.5){
                    return mapPanelObj.credibleColor
                }
                else{
                    return mapPanelObj.nonCredibleColor
                }
            })
            .attr("r", 4)
            .attr("cx", function (d) { return mapPanelObj.x(d.projection[0]); })
            .attr("cy", function (d) { return mapPanelObj.y(d.projection[1]); })
            .attr("opacity", 0.5)
            .on("mouseover", function(d) {		
                div.transition()		
                    .duration(200)		
                    .style("opacity", .9);		
                div.html(d.docId +": " + d.text + "<br/>"  + d.source)	
                    .style("left", (d3.event.pageX + 20) + "px")		
                    .style("top", (d3.event.pageY - 28) + "px");	
                })					
            .on("mouseout", function(d) {		
                div.transition()		
                    .duration(500)		
                    .style("opacity", 0);	
            });
    }
    
    mapPanel.prototype.getData = function(sampling, nSamples, range){
        function randomData(samples) {
            function getRandomInt(max) {
                return Math.floor(Math.random() * Math.floor(max));
            }
            var data = [],
                random = d3.randomNormal();                
                
            for (i = 0; i < samples; i++) {
                data.push({
                    x: random(),
                    y: random(),
                    id: i,
                    text: "Random piece of news",
                    source: "Random source",
                    label: getRandomInt(2)==0? 'credible': 'non-credible'
                    
                });
            }
            return data;
        }

        //return randomData(300);
        var thisObj = this;
        dataToPass = {"sampling": sampling , "nSamples": nSamples, "range":range};
        this.backendObj.backendCall(thisObj.backendObj.fakelandDataURL,dataToPass,thisObj.backendObj.returnData)
        
    }
    
    mapPanel.prototype.showNeighbors = function(indexNeighbors){
        d3.select(this.container).selectAll("circle")
        .select(function(d,i){
            if (indexNeighbors.includes(i)){
                return this
            }
            else{
                return null
            }
        })
        .attr("r", 6)
        .attr("stroke", "black")
        .attr("stroke-width", "3px")
        .attr("fill", "yellow");
    }
    
    mapPanel.prototype.resetAllNeighbors = function(){
        var thisObj = this;
        
        d3.select(this.container).selectAll("circle")        
        .attr("r", 4)
        .attr("stroke", "black")
        .attr("stroke-width", "0px")
        .attr("fill", function (d){
                if (d.label=="credible"){
                    return thisObj.credibleColor
                }
                else{
                    return thisObj.nonCredibleColor
                }
            });
    }
    mapPanel.prototype.resetNeighbors = function(indexNeighbors){
        var thisObj = this;
        
        d3.select(this.container).selectAll("circle")
        .select(function(d,i){
            if (indexNeighbors.includes(i)){
                return this
            }
            else{
                return null
            }
        })
        .attr("r", 4)
        .attr("stroke", "black")
        .attr("stroke-width", "0px")
        .attr("fill", function (d){
                if (d.label=="credible"){
                    return thisObj.credibleColor
                }
                else{
                    return thisObj.nonCredibleColor
                }
            });
    }
    
    

// List functions you want other scripts to access
    window.mapPanel = {
        mapPanel: mapPanel
    };
})(window)