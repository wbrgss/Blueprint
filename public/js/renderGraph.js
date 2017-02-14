//SETTINGS

// API Key for read-only data
var API_KEY = "bM0m3C6DBipbAVWbd6EcBy9INiShTN_t";

//default program
var program = "Bachelor of Science (B.Sc.) - Major Computer Science (63 credits)"

//listed program requirements global variable
var courses = {};

//course history
var coursesTaken = {};

//graph layout algo
var rank = "tight-tree"

//initialize (get data, draw graph)
function init() {

  getCourses(program);
  getPreqs(courses);
  drawGraph();

  //set zoom view level
  zoomOut();

  //loading done
  $('#spin1').hide();
}

// a new program is selected
// fetch new data 
function newProgram() {

  zoomIn();

  init();

  $('#spin2').hide();

}

// new graph view is selected
// same data, new render
function newRank() {

  zoomIn();

  drawGraph();

  zoomOut();

  $('#spin2').hide();

}


// get program courses and course history
function getCourses(program) {

  // loading
  $('#spin1').show();

  // mongo db MLab API query
  var query = "{\"programs\":{\"$in\":[\"" + program + "\"]}}"

  // get listed requirements for requested program
  $.ajax({
    // don't want to asyncronously render graph without data
    async: false,
    dataType: "json",
    url: "https://api.mlab.com/api/1/databases/bluetest/collections/courses3?q=" + query + "&apiKey=" + API_KEY,
    success: function(progCourses) {
      //singles = data;
      courses = progCourses;
    }
  });

  // get user course history
  // TODO: user minerva API
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

// recursively get dependencies (prerequisites)
function getPreqs(nodes) {

  // all prereqs
  var ids = $.map(nodes, function(val) { return val.preqs; });
  // unique prereqs in JSON
  var uids = JSON.stringify(_.uniq(ids));

  // course IDS
  var cids = _.map(courses, 'cid');
  var ucids = JSON.stringify(_.uniq(cids));

  // base case
  if (_.isEmpty(nodes)) {
    return "done";
  }
  else {
    var ids = $.map(nodes, function(val) { return val.preqs; });
    var uids = JSON.stringify(_.uniq(ids));

    var cids = _.map(courses, 'cid');
    var ucids = JSON.stringify(_.uniq(cids));

    // MLab query: union of unique prereqs and other courses in DB
    var query = "{ $and: [{\"cid\":{\"$in\":" + uids + "} }, {\"cid\":{\"$nin\":" + ucids + "}} ] }"

    // get courses with query
    $.ajax({
    async: false,
    dataType: "json",
    url: "https://api.mlab.com/api/1/databases/bluetest/collections/courses3?q=" + query + "&apiKey=" + API_KEY,
    success: function(preqs) {
           nodes = preqs;
        }
    });

    // add to global var nodes
    courses = courses.concat(nodes);

    // recurse
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
      // TODO: change the link to a url param return from scraper (i.e. add to scraper)
      var sclass = "l-" + courses[k].code.charAt(0) + "00";

      // add course history
      for(var t in coursesTaken) {
        if(courses[k].subject == coursesTaken[t].subject && courses[k].code == coursesTaken[t].code) {

          var grade = coursesTaken[t].grade;
          // change +/- format
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

      //set metadata
      g.setNode(courses[k].cid,  { label: "<a href=https://www.mcgill.ca/study/2016-2017/courses/" + courses[k].subject + "-" + courses[k].code + " target=\"_blank\">" + courses[k].cid + "</a>", labelType: "html",class: sclass , rx: 5, ry: 5, title: courses[k].title, cid: courses[k].cid, terms: courses[k].terms, instructors: courses[k].instructors, credits: courses[k].credits });
    }
  }

  svg = d3.select("svg"),
      inner = svg.select("g");

  // Set up edges
  for(var k in courses) {
    if (courses[k].preqs.length !== 0) {
      for (var j in courses[k].preqs) {
        // if prereqs exist in scope, render edge
        if (_.some(courses, ['cid', courses[k].preqs[j]])) {
          g.setEdge(courses[k].preqs[j],courses[k].cid, { class:"l-" + courses[k].code.charAt(0) + "00"})
        }
      }
    }
  }


  // Create the renderer
  var render = new dagreD3.render();

  // Run the renderer
  render(inner, g);

  //set zoom funtionality
  zoom = d3.behavior.zoom().on("zoom", function() {
    inner.attr("transform", "translate(" + d3.event.translate + ")" + "scale(" + d3.event.scale + ")");
  });
  svg.call(zoom);

  // Tipsy tooltip styling
  var styleTooltip = function(title, cid, terms, instructors, credits) {
    return '<div class="popup"><p class="title">  <span>Title</span> : ' + title + '</p><p class="cid">  <span>Code</span> : ' + cid + '</p><p class="terms">  <span>Terms</span> : ' + terms + '</p><p class="instructors">  <span>Instructors</span> : ' + instructors + '</p><p class="credits">  <span>Credits</span> : ' + credits + '</p><div>';
  };

  inner.selectAll("g.node")
    .attr("title", function(v) { return styleTooltip(g.node(v).title, g.node(v).cid, g.node(v).terms, g.node(v).instructors, g.node(v).credits) })
    .each(function(v) { $(this).tipsy({ gravity: "w", opacity: 1, html: true }); });

}

function zoomIn () {

    $('#spin2').show();

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

// detect select change
$('.majors').on('change', function(event) {
  $('#spin2').show();
  program = this.value;
  newProgram();
});

$('.ranks').on('change', function(event) {
  $('#spin2').show();
  rank = this.value;
  newRank();
});

init();