//SETTINGS

var API_KEY = "bM0m3C6DBipbAVWbd6EcBy9INiShTN_t";
// we can make the db account read only

//
var program = "Bachelor of Science (B.Sc.) - Major Computer Science (63 credits)"
var courses = {};
var coursesTaken = {};

var rank = "tight-tree"

function init() {

  getCourses(program);
  getPreqs(courses);
  drawGraph();

  zoomOut();


  $( ".spinner" ).hide();
}

function newProgram() {

  $('.spinner').show();

  zoomIn();

  init();

}

function newRank() {

  $( ".spinner" ).show();
  zoomIn();

  drawGraph();

  zoomOut();

  $( ".spinner" ).hide();

}


function getCourses(program) {

  $('.spinner').show();

  var query = "{\"programs\":{\"$in\":[\"" + program + "\"]}}"

  $.ajax({
    async: false,
    dataType: "json",
    url: "https://api.mlab.com/api/1/databases/bluetest/collections/courses3?q=" + query + "&apiKey=" + API_KEY,
    success: function(progCourses) {
      //singles = data;
      courses = progCourses;
    }
  });

    $.ajax({
      async: false,
      global: false,
      dataType: "json",
      url: "user_details/user-1.json",
      success: function(userCourses) {
        coursesTaken = userCourses;
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
    url: "https://api.mlab.com/api/1/databases/bluetest/collections/courses3?q=" + query + "&apiKey=" + API_KEY,
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
    .setGraph({rankdir: 'LR', align: 'DL', nodesep: 25, ranksep: 150, ranker: rank})
    .setDefaultEdgeLabel(function() { return {}; });

  for(var k in courses) {
    if (courses[k] !== undefined) {
      console.log(courses[k]);
      //change the link to a url param return from scraper (i.e. add to scraper)

      var sclass = "l-" + courses[k].code.charAt(0) + "00";
      for(var t in coursesTaken) {
        if(courses[k].subject == coursesTaken[t].subject && courses[k].code == coursesTaken[t].code) {
          //console.log('course taken: ');
          //console.log(coursesTaken[t]);

          var grade = coursesTaken[t].grade;
          if( grade == 'A-' )
            grade = 'Aminus';
          else if(grade == 'B+')
            grade = 'Bplus';
          else if(grade == 'B-')
            grade = 'Bminus';
          else if(grade == 'C+')
            grade = 'Cplus';

          sclass +=  " taken-" + grade;
          break;
        }
      }

      g.setNode(courses[k].cid,  { label: "<a href=https://www.mcgill.ca/study/2016-2017/courses/" + courses[k].subject + "-" + courses[k].code + " target=\"_blank\">" + courses[k].cid + "</a>", labelType: "html",class: sclass , rx: 5, ry: 5, title: courses[k].title, cid: courses[k].cid, terms: courses[k].terms, instructors: courses[k].instructors, credits: courses[k].credits });
    }
  }

  svg = d3.select("svg"),
      inner = svg.select("g");

  // Set up edges, no special attributes.
  for(var k in courses) {
    if (courses[k].preqs.length !== 0) {
      //console.log(roots[k].preqs);
      for (var j in courses[k].preqs) {
        if (_.some(courses, ['cid', courses[k].preqs[j]])) {
          //console.log(courses[k].preqs[j]);
          //console.log(courses[k].cid + " requires " + courses[k].preqs[j]);
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
    inner.attr("transform", "translate(" + d3.event.translate + ")" + "scale(" + d3.event.scale + ")");
  });
  svg.call(zoom);

  // Simple function to style the tooltip for the given node.
  var styleTooltip = function(title, cid, terms, instructors, credits) {
    return '<div class="popup"><p class="title">  <span>Title</span> : ' + title + '</p><p class="cid">  <span>Code</span> : ' + cid + '</p><p class="terms">  <span>Terms</span> : ' + terms + '</p><p class="instructors">  <span>Instructors</span> : ' + instructors + '</p><p class="credits">  <span>Credits</span> : ' + credits + '</p><div>';
  };

  inner.selectAll("g.node")
    .attr("title", function(v) { return styleTooltip(g.node(v).title, g.node(v).cid, g.node(v).terms, g.node(v).instructors, g.node(v).credits) })
    .each(function(v) { $(this).tipsy({ gravity: "w", opacity: 1, html: true }); });

}

function zoomIn () {
  // Center the graph up
  var initialScale = 1;
  zoom
    .translate([100, 20])
    .scale(initialScale)
    .event(svg);
  svg.attr('height', g.graph().height * initialScale + 40);

}

function zoomOut () {

  // Center the graph down
  var initialScale = 1;
  zoom
    .translate([100, 20])
    .scale(initialScale)
    .event(svg);
  svg.attr('height', g.graph().height * initialScale + 40);

}

$('.majors').on('change', function(event) {
  program = this.value;
  newProgram();
});

$('.ranks').on('change', function(event) {
  rank = this.value;
  newProgram();
});

init();