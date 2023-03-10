var flag = false;
let finished = false;
var WIDTH = d3.select("#kmeans")[0][0].offsetWidth - 20;
var HEIGHT = Math.max(300, WIDTH * .7);
var manualPlacement = false;
var placingFinished = false;
var drawCentroids = false;
var svg = d3.select("#kmeans svg")
.attr('width', WIDTH)
.attr('height', HEIGHT)
.style('padding', '10px')
.style('background', 'white')
.style('cursor', 'pointer')
.style('-webkit-user-select', 'none')
.style('-khtml-user-select', 'none')
.style('-moz-user-select', 'none')
.style('-ms-user-select', 'none')
.style('user-select', 'none')
.style('box-sizing', 'content-box')
.style('margin','0px')
.style('padding','0px')
.style('border-color','grey')
.style('border-width','2px')
.style('border-style','solid')

.on('click', function() {
    d3.event.preventDefault();
    if (!manualPlacement || placingFinished) {
        step();
    }
});

d3.selectAll("#kmeans button")
.style('padding', '.5em .8em');

d3.selectAll("#kmeans label")
.style('display', 'inline-block')
.style('width', '15em');

var lineg = svg.append('g');
var dotg = svg.append('g');
var centerg = svg.append('g');
d3
d3.select("#step")
.on('click', function() { 
    step(); draw(); 
});
d3.select("#run").
on('click', function() { startRun(); });
d3.select("#restart")
.on('click', function() { restart(); draw(); });
d3.select("#reset")
.on('click', function() { init(); draw(); });
var groups_old = [];
var groups = [], dots = [];
firstRun = true;
var inter;
function startRun() {
    $("#run").prop("disabled", true);
    $("#step").prop("disabled", true);
    step();
    inter = setInterval(step, 750);
}
function centroids(cb) {
    drawCentroids = (cb.checked);
}
function manual(cb) {
    manualPlacement = (cb.checked);
    init();
}
function draw_regions(){
    var voronoi = new Voronoi();
    var bbox = {xl: 0, xr: WIDTH, yt: 0, yb: HEIGHT};
    var sites = groups.map(g=>g.center)

    var diagram = voronoi.compute(sites, bbox);
    //draw edges
    let cells = diagram.cells;
    let polygons = [];
    cells.forEach(cell=>{
        let polygon = '';//'"';
        let fillcolor = "white";
        let polypoints = [];
        //get fill color
        for(let i=0;i<groups.length;i++){
            if(cell.site.x==groups[i].center.x){
                if(cell.site.y==groups[i].center.y){
                    fillcolor = groups[i].color;
                    break;
                }
            }//end if
        }//end for
        //

        let segments = cell.halfedges.map(edge => edge.getEndpoint());
        let vpath = segments.map(seg=>[seg.x,seg.y]);

        polygons.push(vpath);
        let svg_polys = svg.selectAll("polygon").data(polygons);
        svg_polys.enter().append("polygon")
            .attr("points",vpath)
            .attr('fill',fillcolor)
            .attr('opacity',"0.1")
            .attr("stroke-opacity","1")
            .attr("stroke","black")
            .attr("stroke-width","2px");
    });

}
function step() {
    d3.select("#restart").attr("disabled", null);
    if(finished) return;
    svg.selectAll("polygon").remove();
    if (flag) {
        moveCenter();
        draw();
    } else {
        updateGroups();
        draw();
    }
    flag = !flag;
}
function place(i, K, x1, y1) {
    var g = {
        dots: [],
        color: 'hsl(' + (i * 360 / K) + ',100%,50%)',
        center: {
            x: x1,
            y: y1 
        },
        init: {
                  center: {}
              }
    };
    g.init.center = {
        x: g.center.x,
        y: g.center.y
    };
    return g;
}
var placed = 0;
function init() {
    svg.selectAll("polygon").remove();
    finished = false;
    $("#step").prop("disabled", manualPlacement);
    $("#run").prop("disabled", manualPlacement);
    clearInterval(inter);
    firstRun = true;
    placed = 0;
    d3.select("#restart").attr("disabled", "disabled");

    var N = parseInt(d3.select('#N')[0][0].value, 10);
    var K = parseInt(d3.select('#K')[0][0].value, 10);
    groups = [];

    if (!manualPlacement) {
        for (var i = 0; i < K; i++) {
            groups.push(place(i, K, WIDTH*0.02 + Math.random() * WIDTH*0.96, HEIGHT*0.02 + Math.random() * HEIGHT*0.96));
        }
    } else {
        d3.select("#kmeans svg").on("click", function() {
            if (placed < K && manualPlacement) {
                coords = d3.mouse(this);
                groups.push(place(placed, K, coords[0], coords[1]));
                draw();
                placed++;
                if (placed == (K)) {
                    $("#run").prop("disabled", false);
                    $("#step").prop("disabled", false);
                }
            } else {
                step();
                draw();
            }
        });
    }
    dots = [];
    flag = false;
    dots = drawCentroids ? pushCentroids(N, K) : pushRands(N) 
    draw();
}
function pushRands(N) {
    dots = []
    for (i = 0; i < N; i++) {
            var dot = {
                x: WIDTH*0.02 + Math.random() * WIDTH*0.96,
                y: HEIGHT*0.02 + Math.random() * HEIGHT*0.96,
                group: undefined
            };
            dot.init = {
                x: dot.x,
                y: dot.y,
                group: dot.group
            };
            dots.push(dot);
        }
    return dots;
}

function pushCentroids(N, K) {
    dots = [];
    for (i = 0; i < K; i++) {
        var cX = WIDTH*0.02 + Math.random() * WIDTH*0.96
        var cY = HEIGHT*0.02 + Math.random() * HEIGHT*0.96;
        var cW = getRandomArbitrary(50,125);
        var cH = getRandomArbitrary(50,125);
        for (j = 0; j < N/K; j++) {
                rX = Math.random() * cW;
                x = cX + ((cX + rX < WIDTH) ? rX : -1 * rX);
                rY = Math.random() * cH;
                y = cY + ((cY + rY < HEIGHT) ? rY : -1 * rY);
            var dot = {
                x: x,/*(Math.random() * WIDTH/K) + cX,*/
                y: y, /*(Math.random() * HEIGHT/K) + cY,*/
                group: undefined
            };
            dot.init = {
                x: dot.x,
                y: dot.y,
                group: dot.group
            };
            dots.push(dot);
        }
    }
    return dots;
}
/* from Mozilla Developer Center */
function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}
function restart() {
    svg.selectAll("polygon").remove();
    finished = false;
    $("#step").prop("disabled", false);
    $("#run").prop("disabled", false);
    clearInterval(inter);
    firstRun = true;
    flag = false;
    d3.select("#restart").attr("disabled", "disabled");
    groups.forEach(function(g) {
        g.dots = [];
        g.center.x = g.init.center.x;
        g.center.y = g.init.center.y;
    });

    for (var i = 0; i < dots.length; i++) {
        var dot = dots[i];
        dots[i] = {
            x: dot.init.x,
            y: dot.init.y,
            group: undefined,
            init: dot.init
        };
    }
}


function draw() {
    var circles = dotg.selectAll('circle')
        .data(dots);
    circles.enter()
        .append('circle');
    circles.exit().remove();
    circles
        .transition()
        .duration(500)
        .attr('cx', function(d) { return d.x; })
        .attr('cy', function(d) { return d.y; })
        .attr('fill', function(d) { return d.group ? d.group.color : '#ffffff'; })
        .attr('r', 3);

    if (dots[0].group) {
        var l = lineg.selectAll('line')
            .data(dots);
        var updateLine = function(lines) {
            lines
                .attr('x1', function(d) { return d.x; })
                .attr('y1', function(d) { return d.y; })
                .attr('x2', function(d) { return d.group.center.x; })
                .attr('y2', function(d) { return d.group.center.y; })
                .attr('stroke', function(d) { return d.group.color; });
        };
        updateLine(l.enter().append('line'));
        updateLine(l.transition().duration(500));
        l.exit().remove();
    } else {
        lineg.selectAll('line').remove();
    }

    var c = centerg.selectAll('path')
        .data(groups);
    var updateCenters = function(centers) {
        centers
            .attr('transform', function(d) { return "translate(" + d.center.x + "," + d.center.y + ") rotate(45)";})
            .attr('fill', function(d,i) { return d.color; })
            .attr('stroke', '#aabbcc');
    };
    c.exit().remove();
    updateCenters(c.enter()
            .append('path')
            .attr('d', d3.svg.symbol().type('cross'))
            .attr('stroke', '#aabbcc'));
    updateCenters(c
            .transition()
            .duration(500));}

    function moveCenter() {
        let centroids = groups.map(g=>g.center);
        groups.forEach(function(group, i) {
            if (group.dots.length == 0) return;

            // get center of gravity
            var x = 0, y = 0;
            group.dots.forEach(function(dot) {
                x += dot.x;
                y += dot.y;
            });

            group.center = {
                x: x / group.dots.length,
            y: y / group.dots.length
            };
        });
        let dif = false
        for(let i=0;i<centroids.length;i++){
            if(centroids[i].x != groups[i].center.x){
                dif = true;break;
            }
             if(centroids[i].y != groups[i].center.y){
                dif = true;break;
            }           
        }//end for
        finished = !dif;
        if(finished){
            draw_regions();
        }
    }

function updateGroups() {
    groups.forEach(function(g) { g.dots = []; });
    dots.forEach(function(dot) {
        // find the nearest group
        var min = Infinity;
        var group;
        groups.forEach(function(g) {
            var d = Math.pow(g.center.x - dot.x, 2) + Math.pow(g.center.y - dot.y, 2);
            if (d < min) {
                min = d;
                group = g;
            }
        });

        // update group
        group.dots.push(dot);
        dot.group = group;
    });
}

init(); draw();
