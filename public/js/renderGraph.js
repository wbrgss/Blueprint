
//SETTINGS

var API_KEY = "bM0m3C6DBipbAVWbd6EcBy9INiShTN_t";
// we can make the db account read only
// or just do this in rails


var program = "Bachelor of Science (B.Sc.) - Major Computer Science (63 credits)"
var courses = {};

var rank = "tight-tree"

function init() {

  getCourses(program);
  getPreqs(courses);
  drawGraph();

  zoomOut();

}

function newProgram() {

  zoomIn();

  init();

}

function newRank() {
  zoomIn();

  drawGraph();

  zoomOut();

}


function getCourses(program) {

  var query = "{\"programs\":{\"$in\":[\"" + program + "\"]}}"

  $.ajax({
  async: false,
  dataType: "json",
  url: "https://api.mlab.com/api/1/databases/bluetest/collections/courses2?q=" + query + "&apiKey=" + API_KEY,
  success: function(progCourses) {
         //singles = data;
         courses = progCourses;
      }
  });

}


function getPreqs(nodes) {

  var ids = $.map(nodes, function(val) { return val.preqs; });
  var uids = JSON.stringify(_.uniq(ids));

  var cids = _.map(courses, 'cid');
  var ucids = JSON.stringify(_.uniq(cids));

  if (_.isEmpty(nodes)) {
    return "done";
  }

  else {
    var ids = $.map(nodes, function(val) { return val.preqs; });
    var uids = JSON.stringify(_.uniq(ids));

    var cids = _.map(courses, 'cid');
    var ucids = JSON.stringify(_.uniq(cids));

    var query = "{ $and: [{\"cid\":{\"$in\":" + uids + "} }, {\"cid\":{\"$nin\":" + ucids + "}} ] }"

    $.ajax({
    async: false,
    dataType: "json",
    url: "https://api.mlab.com/api/1/databases/bluetest/collections/courses2?q=" + query + "&apiKey=" + API_KEY,
    success: function(preqs) {
           //singles = data;
           nodes = preqs;
        }
    });

    courses = courses.concat(nodes);

    return getPreqs(nodes);

  }

}

function drawGraph() {

// Create a new directed graph
g = new dagreD3.graphlib.Graph()
  .setGraph({rankdir: 'LR', align: 'DL', nodesep: 50, ranksep: 200, ranker: rank})
  .setDefaultEdgeLabel(function() { return {}; });

for(var k in courses) {
  if (courses[k] !== undefined) {
   console.log(courses[k]);
   //change the link to a url param return from scraper (i.e. add to scraper)
   g.setNode(courses[k].cid,  { label: "<a href=http://www.mcgill.ca/study/2016-2017/courses/" + courses[k].subject + "-" + courses[k].code + " target=\"_blank\">" + courses[k].cid + "</a>", labelType: "html",         class: "l-" + courses[k].code.charAt(0) + "00" });
 }
}


g.nodes().forEach(function(v) {
  var node = g.node(v);
  // Round the corners of the nodes
  node.rx = node.ry = 5;
});

svg = d3.select("svg"),
    inner = svg.select("g");

// Set up edges, no special attributes.
for(var k in courses) {
  if (courses[k].preqs.length !== 0) {
    //console.log(roots[k].preqs);
    for (var j in courses[k].preqs) {
      if (_.some(courses, ['cid', courses[k].preqs[j]])) {
        console.log(courses[k].preqs[j]);
        console.log(courses[k].cid + " requires " + courses[k].preqs[j]);
        g.setEdge(courses[k].preqs[j],courses[k].cid, { class:"l-" + courses[k].code.charAt(0) + "00"})
    }
   //g.setNode(roots[k].cid,  { label: roots[k].cid,        class: "type-NP" });
 }
}
}


// Create the renderer
var render = new dagreD3.render();

// Run the renderer. This is what draws the final graph.
render(inner, g);

zoom = d3.behavior.zoom().on("zoom", function() {
        inner.attr("transform", "translate(" + d3.event.translate + ")" +
                                    "scale(" + d3.event.scale + ")");
      });
  svg.call(zoom);


}

function zoomIn () {
  // Center the graph up
  var initialScale = 1;
  zoom
    .translate([(svg.attr("width") - g.graph().width * initialScale) / 2, 20])
    .scale(initialScale)
    .event(svg);
  svg.attr('height', g.graph().height * initialScale + 40);

}

function zoomOut () {

  // Center the graph down
  var initialScale = 0.75;
  zoom
    .translate([(svg.attr("width") - g.graph().width * initialScale) / 2, 20])
    .scale(initialScale)
    .event(svg);
  svg.attr('height', g.graph().height * initialScale + 40);

}