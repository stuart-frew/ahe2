const width = "100%";
const height = "100%";

expansions = ["Kingsport", "Dunwich", "Innsmouth"];

axios
  .get("src/main/resources/data/locations.json")
  .then((response) => {
    const container = document.getElementById("board");
    const width = container.clientWidth;
    const height = container.clientHeight;

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
        expansion: n.expansion,
      };
    });

    const nodes = locationNodes.concat(neighbourhoodNodes);

    const locationLinks = board.neighborhoods.flatMap((n) => {
      return n.locations.map((l) => {
        return {
          source: l.name,
          target: n.name,
        };
      });
    });

    const neighborhoodLinks = board.relationships.flatMap((r) => {
      return r.to.map((t) => {
        return {
          source: r.from,
          target: t,
          type: "neighborhood",
        };
      });
    });

    const links = locationLinks.concat(neighborhoodLinks);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Create a simulation with several forces.
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance((d) => {
            if (
              d.source.type == "neighborhood" &&
              d.target.type == "neighborhood"
            ) {
              if (d.source.expansion != d.target.expansion) {
                return 500;
              } else {
                return 100;
              }
            }
            return 50;
          }),
      )
      .force("charge", d3.forceManyBody().strength(-50))
      .force("center", d3.forceCenter(width / 2, height / 2));

    // Create the SVG container.
    const svg = d3
      .create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto; font: 12px sans-serif;");

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
      .selectAll(".node")
      .data(nodes)
      .enter()
      .append("g");

    node
      .append("circle")
      .attr("r", 5)
      .attr("fill", (d) => color(getColorIndex(d, board)));

    node
      .append("text")
      .attr("x", 12) // offset to the right of the circle
      .attr("y", 3) // vertical centering
      .attr("stroke-width", 0.5)
      .text((d) => d.id)
      .attr("stroke", (d) => color(getColorIndex(d, board)))
      .attr("class", "name");

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

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
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
  index = board.neighborhoods.findIndex((n) => {
    if (node.type == "location") {
      return n.locations.find((l) => {
        return l.name == node.id;
      });
    } else {
      return n.name == node.id;
    }
  });
  return index;
}
// When this cell is re-run, stop the previous simulation. (This doesn’t
// really matter since the target alpha is zero and the simulation will
// stop naturally, but it’s a good practice.)
//invalidation.then(() => simulation.stop());
