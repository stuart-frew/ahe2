const width = 928;
const height = 600;

axios
  .get("src/main/resources/data/locations.json")
  .then((response) => {
    const board = response.data;

    const locationNodes = board.neighborhoods.flatMap((n) =>
      n.locations.map((d) => {
        return {
          id: d.name,
          neighborhood: n.name,
          type: "location",
        };
      }),
    );

    const neighbourhoodNodes = board.neighborhoods.map((n) => {
      return {
        id: n.name,
        type: "neighborhood",
      };
    });

    const nodes = locationNodes.concat(neighbourhoodNodes);

    const links = board.neighborhoods.flatMap((n) => {
      return n.locations.map((l) => {
        return {
          source: l.name,
          target: n.name,
        };
      });
    });

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Create a simulation with several forces.
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3.forceLink(links).id((d) => d.id),
      )
      .force("charge", d3.forceManyBody())
      .force("x", d3.forceX())
      .force("y", d3.forceY());

    // Create the SVG container.
    const svg = d3
      .create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr("style", "max-width: 100%; height: auto;");

    // Add a line for each link, and a circle for each node.
    const link = svg
      .append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", (d) => Math.sqrt(d.value));

    const node = svg
      .append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", 5)
      .attr("fill", (d) => color(getColorIndex(d, board)));

    node.append("title").text((d) => d.id);

    // Add a drag behavior.
    node.call(
      d3
        .drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended),
    );

    // Set the position attributes of links and nodes each time the simulation ticks.
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
    });

    document.getElementById("board").appendChild(svg.node());
  })
  .catch((e) => console.log("error", e));

// Reheat the simulation when drag starts, and fix the subject position.
function dragstarted(event) {
  if (!event.active) simulation.alphaTarget(0.3).restart();
  event.subject.fx = event.subject.x;
  event.subject.fy = event.subject.y;
}

// Update the subject (dragged node) position during drag.
function dragged(event) {
  event.subject.fx = event.x;
  event.subject.fy = event.y;
}

// Restore the target alpha so the simulation cools after dragging ends.
// Unfix the subject position now that it’s no longer being dragged.
function dragended(event) {
  if (!event.active) simulation.alphaTarget(0);
  event.subject.fx = null;
  event.subject.fy = null;
}

function getColorIndex(node, board) {
  board.neighborhoods.findIndex((n) => {
    if (n.type == "location") {
      return n.neighborhood == node.id;
    } else {
      return n.name == node.id;
    }
  });
}
// When this cell is re-run, stop the previous simulation. (This doesn’t
// really matter since the target alpha is zero and the simulation will
// stop naturally, but it’s a good practice.)
//invalidation.then(() => simulation.stop());
