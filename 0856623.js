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
  svg.attr("viewBox", [200, 200, width, height]);
    
  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id))
    .force("charge", d3.forceManyBody())
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
        const row = d3.select(`#T${id}-${i}`);
        if(row.style("fill-opacity") < 1) {
          row.style("fill-opacity", 0.3)
            .style("fill", "yellow");
        } else {
          row.style("fill", "red");
          d3.select(`#E${id}-${i}`)
            .attr("stroke-width", 2)
            .attr("stroke", "red")
            .style("stroke-opacity", 1);
        }
        const col = d3.select(`#T${i}-${id}`);
        if(col.style("fill-opacity") < 1) {
          col.style("fill-opacity", 0.3)
            .style("fill", "yellow");
        } else {
          col.style("fill", "red");
          d3.select(`#E${i}-${id}`)
            .attr("stroke-width", 2)
            .attr("stroke", "red")
            .style("stroke-opacity", 1);
        }
      }
    })
    .on("mouseout", function() {
      d3.selectAll("line")
        .attr("stroke-width", 1)
        .attr("stroke", "black")
        .style("stroke-opacity", 0.3);
      d3.selectAll("rect")
        .style("fill", "black");
      d3.selectAll("rect").filter(function() {
        return d3.select(this).style("fill-opacity") < 1;
      })
        .style("fill-opacity", 0)
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


const renderAdjacency = (matrix, nodes) => {
  const size = 10;
  const svg2 = d3.select('#svg2').append('g')
  matrix.forEach((tile, i) => {
    svg2.append("g")
      .attr("transform", "translate(20,20)")
      .attr("id", "row" + (i + 1))
      .selectAll("rect")
      .data(tile)
      .enter()
      .append("rect")
      .attr("class", "tile")
      .attr("width", size)
      .attr("height", size)
      .attr("x", d => d.x * size)
      .attr("y", d => d.y * size)
      .attr("id", d => `T${d.x + 1}-${d.y + 1}`)
      .style("fill-opacity", d => d.weight)
      .on("mouseover", t => {
        d3.select(`#${t.path[0].id}`)
          .style("fill", "red");
        if(t.path[0].style['fillOpacity'] != "0") {
            var id = t.path[0].id.replace('T', '');
            id = id.split('-');
            d3.select(`#E${id[0]}-${id[1]}`)
              .attr("stroke-width", 2)
              .attr("stroke", "red")
              .style("stroke-opacity", 1);
            d3.select(`#E${id[1]}-${id[0]}`)
              .attr("stroke-width", 2)
              .attr("stroke", "red")
              .style("stroke-opacity", 1);
        }
      })
      .on("mouseout", function() {
        d3.selectAll("rect")
          .style("fill", "black");
        d3.selectAll("line")
          .attr("stroke-width", 1)
          .attr("stroke", "black")
          .style("stroke-opacity", 0.3);
      });
    });
        
    svg2.append("g")
        .attr("transform","translate(20,15)")
        .selectAll("text")
        .data(nodes)
        .enter()
        .append("text")
        .attr("x", (d,i) => i * size + size / 2)
        .text(d => d.id)
        .style("text-anchor", "middle")
        .style("font-size", "8px");

    svg2.append("g").attr("transform","translate(12,23)")
        .selectAll("text")
        .data(nodes)
        .enter()
        .append("text")
        .attr("y", (d,i) => i * size + size / 2)
        .text(d => d.id)
        .style("text-anchor", "middle")
        .style("font-size", "8px");
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
    links.push(d);
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

  var matrix = [];
  for (var y = min; y <= max; y++) {
    var row = [];
    for (var x = min; x <= max; x++) {
      var tile = { x: x - 1, y: y - 1, weight: 0 };
      if (edgeHash[y + '-' + x]) {
        tile.weight = 1;
      }
      row.push(tile);
    }
    matrix.push(row);
  }
  renderNodelink(nodes, links, max);
  renderAdjacency(matrix, nodes);
});