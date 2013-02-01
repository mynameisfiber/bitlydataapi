
function make_graph(data) {
    var graph = [];
    var url_to_keyword = Object();
    for (_keyword in data) {
        var keyword = data[_keyword].phrase;
        var node = Object();
        node.name = keyword;
        node.id = keyword;
        graph = graph.concat(node);

        for (var _url in data[_keyword].urls) {
            var url = data[_keyword].urls[_url].aggregate_url;
            if (url_to_keyword[url] == null) { url_to_keyword[url] = []; }
            url_to_keyword[url] = url_to_keyword[url].concat(keyword)
        }
    }
    var links = [];
    for (url in url_to_keyword) {
        var phrases= url_to_keyword[url];
        for (var _p1 in phrases) {
            for (var _p2 in phrases) {
                if (_p1 != _p2) {
                    var link = Object();
                    link.sourceId = phrases[_p1];
                    link.targetId = phrases[_p2];
                    link.linkName = "coLink";
                    link.weight = 1;
                    links = links.concat(link);
                }
            }
        }
    }
    return [graph, links]
}


function show_awesome(ACCESS_TOKEN) {
    d3.json("https://api-ssl.bitly.com/v3/realtime/bursting_phrases?access_token=" + ACCESS_TOKEN, 
        function(data) {
            var graph = make_graph(data.data.phrases);
            var nodeSet = graph[0];
            var linkSet = graph[1];
    
            var width = 760,
                height = 700,
                nodeSize = 10;
                colorScale = d3.scale.category20();
    
            var svgCanvas = d3.select("#chart").append("svg:svg")
                .attr("width", width)
                .attr("height", height);
    
            var node_hash = [];
            var type_hash = [];
    
            // Create a hash that allows access to each node by its id
            nodeSet.forEach(function(d, i) {
              node_hash[d.id] = d;
              type_hash[d.type] = d.type;
            });
            
            // Append the source object node and the target object node to each link
            linkSet.forEach(function(d, i) {
              d.source = node_hash[d.sourceId];
              d.target = node_hash[d.targetId];
              d.direction = "IN";
            });
    
            var force = d3.layout.force()
                .charge(-300)
                .nodes(nodeSet)
                .links(linkSet)
                .size([width, height])
                .linkDistance( function(d) { if (width < height) { return width*1/4; } else { return height*1/4 } } ) // Controls edge length
                .on("tick", tick)
                .start();
            
            // Draw lines for Links between Nodes
            var link = svgCanvas.selectAll(".gLink")
                .data(force.links())
              .enter().append("g")
            .attr("class", "gLink")
              .append("line")
                .attr("class", "link")
                .style("stroke", "#ccc")
                .attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });
            
            // Create Nodes
            var node = svgCanvas.selectAll(".node")
                .data(force.nodes())
                .enter().append("g")
                .attr("class", "node")
                .attr("id", function(d) { return d.id; })
                .on("mouseover", nodeMouseover)
                .on("mouseout", nodeMouseout)
                .on("mousedown", showInfo)
                .call(force.drag);
            
            // Append circles to Nodes
            node.append("circle")
                .attr("x", function(d) { return d.x; })
                .attr("y", function(d) { return d.y; })
                .attr("r", nodeSize ) // Node radius
                .attr("id", function(d) { return d.id; })
                .style("fill", "White") // Make the nodes hollow looking
                .style("stroke-width", 5) // Give the node strokes some thickness
                .style("stroke", function(d, i) { colorVal = colorScale(i); return colorVal; } ) // Node stroke colors
                .on("mousedown", showInfo)
                .call(force.drag);
            
            // Append text to Nodes
            node.append("a")
                .attr("xlink:href", function(d) { return d.hlink; })
                .append("text")
                    .attr("x", 20)
                    .attr("y", -10)
                    .attr("text-anchor", "start")
                    .attr("font-family", "Arial, Helvetica, sans-serif")
                    .style("font", "normal 16px Arial")
                    .attr("fill", "Blue")
                    .attr("dy", ".35em")
                    .text(function(d) { return d.name; });
    
            function showInfo() {
                var id = this.id;
                d3.json("https://api-ssl.bitly.com/v3/search?access_token=" + ACCESS_TOKEN + "&query=" + id + "&limit=5&fields=title%2Curl%2csummaryText%2ckeywords",
                    function(data) {
                        var html = "<shead>" + id + "</shead><br>";
                        data.data.results.forEach(
                            function(d, i) {
                                html += "<a href='" + d.url + "'><stitle>" + d.title + "</stitle></a><br>";
                                if (d.keywords != null) {
                                    html += "<skeyword>" + d.keywords + "</skeyword><br>";
                                }
                                html += "<ssummary>" + d.summaryText + "</ssummary><hr width=25%>";
                            }
                        );
                        $("#info").html(html);
                    }
                );
            }
    
            function tick() {
                    link
                      .attr("x1", function(d) { return d.source.x; })
                      .attr("y1", function(d) { return d.source.y; })
                      .attr("x2", function(d) { return d.target.x; })
                      .attr("y2", function(d) { return d.target.y; });
                  
                    node
                      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
            }
    
            function nodeMouseover() {
                d3.select(this).select("circle").transition()
                    .duration(250)
        	        .attr("r", 15);
    
        	    d3.select(this).select("text").transition()
                    .duration(250)
        	        .style("font", "bold 20px Arial")
        	        .attr("fill", "Blue");
            }
        
            function nodeMouseout() {
                d3.select(this).select("circle").transition()
                    .duration(250)
        	        .attr("r", nodeSize);
    
        	    d3.select(this).select("text").transition()
                    .duration(250)
        	        .style("font", "normal 16px Arial")
        	        .attr("fill", "Blue");
            }
        }
    )
}

