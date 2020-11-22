const drag = simulation => {
  function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }
  
  function dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }
  
  function dragended(event) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }
  
  return d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);
};

const renderNodelink = (nodes, links, max) => {
  const svg = d3.select('#svg1');
  const width = +svg.attr('width');
  const height = +svg.attr('height');
    
  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id))
    .force("charge", d3.forceManyBody().distanceMax(250))
    .force("center", d3.forceCenter(width / 2, height / 2));

  const link = svg.append('g')
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .style("stroke-opacity", 0.3)
    .attr("id", d => `E${d.source.id}-${d.target.id}`);

  const node = svg.append("g")
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("stroke", "white")
    .attr("stroke-width", 1.5)
    .attr("r", d => d.group + 4)
    .attr("fill", d => d3.schemeCategory10[d.group - 1])
    .attr("id", d => `N${d.id}`)
    .call(drag(simulation))
    .on("mouseover", n => {
      var id = n.path[0].id.replace('N', '');
      for(var i = 1; i <= max; i++) {
        d3.select(`#E${i}-${id}`)
          .attr("stroke-width", 2)
          .attr("stroke", "red")
          .style("stroke-opacity", 1);
        d3.select(`#E${id}-${i}`)
          .attr("stroke-width", 2)
          .attr("stroke", "red")
          .style("stroke-opacity", 1);
      }
      d3.selectAll(".row text").classed("active", function(d, i) { return i == id - 1; });
      d3.selectAll(".column text").classed("active", function(d, i) { return i == id - 1; });
      d3.select("#row" + (id - 1))
        .append("rect")
        .attr("class", "highlight")
        .attr("width", width)
        .attr("height", x.bandwidth());
      d3.select("#col" + (id - 1))
        .append("rect")
        .attr("class", "highlight")
        .attr("x", -width)
        .attr("width", width)
        .attr("height", x.bandwidth());
    })
    .on("mouseout", function() {
      d3.selectAll("line")
        .attr("stroke-width", 1)
        .attr("stroke", "black")
        .style("stroke-opacity", 0.3);
      d3.selectAll("rect")
        .attr("stroke-width", 1)
        .attr("stroke", "white")
      d3.selectAll("text").classed("active", false);
      d3.select(this).select("title").remove();
      d3.selectAll(".highlight").remove();
    });

  node.append("title").text(d => d.id);

  function zoomFunct({ transform }) {
    link.attr('transform', transform);
    node.attr('transform', transform);
  }
  
  d3.select('svg').call(
    d3.zoom()
    .extent([[0, 0],[450, 600],])
    .scaleExtent([1, 8])
    .on('zoom', zoomFunct)
  );

  simulation.on("tick", () => { 
    link.attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);
    node.attr("cx", d => d.x)
        .attr("cy", d => d.y);
  });
  return svg.node();
};

d3.csv('http://vis.lab.djosix.com:2020/data/infect-dublin.edges').then((data) => {
  var max = 0;
  var min = 9999;
  var links = [];
  var countLinks = [];
  for (var i = 0; i <= 1000; i++) {
    countLinks.push(0);
  }
  var key = Object.keys(data[0])[0];
  links.push({
    source: key.split(' ')[0],
    target: key.split(' ')[1],
    value: 1,
  });
  data.forEach((d) => {
    key = Object.keys(d);
    var tmp = d[Object.keys(d)].split(' ');
    delete d[Object.keys(d)];
    d.source = tmp[0];
    d.target = tmp[1];
    d.value = 1;
    if (parseInt(tmp[0], 10) > max) max = d.source;
    if (parseInt(tmp[1], 10) > max) max = d.target;
    if (parseInt(tmp[0], 10) < min) min = d.source;
    if (parseInt(tmp[1], 10) < min) min = d.target;
    links.push({
      source: tmp[0],
      target: tmp[1],
      value: 1,
    });
    countLinks[parseInt(tmp[0], 10)] += 1;
    countLinks[parseInt(tmp[1], 10)] += 1;
  });

  var nodes = [];
  for (var i = min; i <= max; i++) {
    nodes.push({
      id: String(i),
      group: Math.ceil(countLinks[i] / 10),
    });
  }
  var edgeHash = {};
  links.forEach((d) => {
    var id = d.source + '-' + d.target;
    edgeHash[id] = 1;
    var id = d.target + '-' + d.source;
    edgeHash[id] = 1;
  });
  renderNodelink(nodes, links, max);
});