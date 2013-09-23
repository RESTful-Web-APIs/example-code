/* RWA - RESTful Web APIs
 * 2012-10 (mca)
 * the-mapmaker.js
 * stand-alone maze+xml client
 * that maps out the entire maze
 */

var url = require('url');
var http = require('http');
var DOMParser = require('xmldom').DOMParser;

var m = {};
m.start = false;
m.moves = 1;
m.help = '***Usage:\nnode the-mapmaker [starting-url]';
m.winner = '*** DONE and it only took {m} moves! ***';
m.quitter = '*** Sorry, I can\'t find any mazes here. ***';

// tracking 
m.map = [];
m.rooms = [];
m.visited = [];
m.nest = 0;

// drawing
m.box = [];
m.box[0] = '+---+'
m.box[1] = '|   |'
m.box[2] = '|   |'
m.box[3] = '|   |'
m.box[4] = '+---+'

// get argument and start process
arg = process.argv[2];
if(arg===undefined) {
    console.log(m.help);
}
else {
    m.nest++;
    makeRequest('GET', arg);
}

// send requests to server
function makeRequest(method, path) {
    var hdrs, options, pUrl;

    pUrl = url.parse(path);
    
    hdrs = {
        'host' : pUrl.host,
        'content-type' : 'application/vnd.amundsen.maze+xml'
    };

    options = {
        host : pUrl.hostname,
        port : pUrl.port,
        path : pUrl.pathname,
        method : method,
        headers : hdrs
    };

    var req = http.request(options, function(res) {
        var body = '';

        res.on('data', function(chunk) {
            body += chunk;
        });

        res.on('end', function() {
            var doc, nodes, i, x, links, href, h, flag, choices, room, maze, cell;

            m.nest--

            // parse incoming response
            doc = new DOMParser().parseFromString(body, 'text/xml');

            // get title of cell/maze
            title = '';
            maze = doc.getElementsByTagName('item')[0];
            if(maze) {
                title = maze.getAttribute('title');
            }
            cell = doc.getElementsByTagName('cell')[0];
            if(cell) {
                title = cell.getAttribute('title');
            }

            // collect hyperlinks from the response
            links = [];
            doc = new DOMParser().parseFromString(body, 'text/xml');
            nodes = doc.getElementsByTagName('link');
            for(i=0, x=nodes.length; i<x; i++) {
                links.push({'rel':nodes[i].getAttribute('rel'), 'href':nodes[i].getAttribute('href')});
            }
            if(cell) {
                links.push({'rel':'current', 'href':cell.getAttribute('href')});
            }

            // check for entrance link
            if(m.start===false) {
                href = findLink(links, 'start');
                if(href) {
                    m.start = true;
                    addRooms([{'rel':'start','href':href}]);
                    addRooms(links);
                    addVisited(path, links, title, 'maze');
                    console.log('Exploring the '+ title + '...');
                }
                // ok, see if we can find a maze link
                if(href===undefined) {
                    href = findLink(links, 'maze');
                }
                // well, is there a collection link?
                if(href===undefined) {
                    href = findLink(links, 'collection');
                }
                // ok, i give up!
                if(href===undefined) {
                    console.log(m.quitter);
                    return;
                }
                m.nest++;
                makeRequest('GET', href);
            }
            
            // ok, check to see if we have some rooms
            if(href===undefined) {
                addRooms(links);
                while(m.rooms.length!==0) {
                    href  = m.rooms.pop();
                    addVisited(path, links, title, 'cell');
                    console.log(m.moves++ + '[In the ' + title +'] I can see:' + href);
                    m.nest++;
                    makeRequest('GET', href);
                }
                    
                // did we finally run out of rooms?
                if(m.nest===0 && m.rooms.length===0) {
                    showMap();
                }
            }
        });
   });

    req.on('error', function(error) {
        console.log(error);
    });

    req.end();
}
 
function showMap() {
    var cell, boxes, output, t, s, i, x, j, y, k, z;
    var dn, ds, dw, de;

    t = (m.map.length)-2;
    s = Math.sqrt(t);
    output = '';
    boxes = [];

    console.log(t + ' : ' + s);

    // build up the boxes
    b = 0;
    for(i=0, x=t; i<x; i++) {
        cell = m.map[i];
        console.log(JSON.stringify(cell, null, 2));
        if(cell.type==='cell') {
            for(j=0, y=5; j<y; j++) {
                de = findLink(cell.links, 'east');
                dw = findLink(cell.links, 'west');
                dn = findLink(cell.links, 'north');
                ds = findLink(cell.links, 'south');

                boxes[b] = [];

                if(dn) {
                    boxes[b][0] = '+- -+';
                }
                else {
                    boxes[b][0] = '+---+';
                }
                
                boxes[b][1] = '|   |';

                boxes[b][2] = '|   |';
                if(dw && de) {
                    boxes[b][2] = '     ';
                
                }
                else {
                    if(dw) {
                        boxes[b][2] = '    |';
                    }
                    if(de) {
                        boxes[b][2] = '|    ';
                    }
                    
                }
                
                boxes[b][3] = '|   |';

                if(ds) {
                    boxes[b][4] = '+- -+';
                }
                else {
                    boxes[b][4] = '+---+';
                }
            }
            b++;
        }
    }

    console.log(b);

    for(i=0, x=boxes.length; i<x; i++) {
        //console.log(i+': '+JSON.stringify(boxes[i], null, 2));
    }
    //console.log(JSON.stringify(boxes, null, 2));

    // draw rows
    output = '';
    for(i=0, x=s; i<x; i++) {
        // draw columns
        for(j=0, y=s; j<y; j++) {
            b = i+(j*s);
            //console.log(b + ': '+JSON.stringify(boxes[b], null, 2));
            if(boxes[b]!==null) {
                for(k=0, z=5; k<z; k++) {
                    //output += boxes[b][k];
                }
            }
        }
    }
    console.log('output');
    console.log(output);

    //console.log(JSON.stringify(m.map, null, 2));

    //messing around for now
    //var coll, i, x, href;
    //for(i=0, x=25; i<x; i++) {
    //    href = 'http://localhost:1337/simple/'+i;
    //   console.log(getMapElement(href));
    //}
}

function getMapElement(href) {
    var i, x, rtn;
    rtn = '';
    for(i=0, x=m.map.length; i<x; i++) {
        if(m.map[i].href===href) {
            rtn = m.map[i].href;
            break;
        }
    }
    return rtn;
}

function findLink(links,rel) {
    var i, x, rtn;

    for(i=0, x=links.length; i<x; i++) {
        if(links[i].rel===rel) {
            rtn = links[i].href;
        }
    }
    return rtn;
}

function addRooms(links) {
    var i, x, coll;

    // scan scrubbed collection of links
    coll = scrub(links);

    for(i=0,x=coll.length;i<x;i++) {
        if(isInArray(m.visited, coll[i].href)===false 
            && 
            isInArray(m.rooms, coll[i].href)===false
            ) {
            m.rooms.push(coll[i].href);
        }
    }
}

function addVisited(href, links, title, type) {
    var i, x;

    if(m.visited.length==0) {
        m.visited.push(href);
        m.map.push({'type':type, 'href':href, 'title':title, 'links':links});
    }
    else {
        for(i=0, x=m.visited.length;i<x;i++) {
            if(isInArray(m.visited, href)===false) {
                m.visited.push(href);
                m.map.push({'type':type, 'href':href, 'title':title, 'links':links});
            }
        }
    }
    //console.log(JSON.stringify(m.map, null, 2));
}

function isInArray(coll,value) {
    var i, x, rtn;

    rtn = false;
    for(i=0, x=coll.length; i<x; i++) {
        if(coll[i]===value) {
            rtn = true;
            break;
        }
    }
    return rtn;
}

function scrub(links) {
    var i, x, coll;

    // drop unwanted links:
    coll=[];
    for(i=0,x=links.length;i<x;i++) {
        if(links[i].rel!=='collection'
            &&
            links[i].rel!=='maze'
            &&
            links[i].rel!=='start')
            coll.push(links[i]);
    }
    return coll;
}

// utility function for array searches
Array.prototype.contains = function(k) {
  for(p in this)
     if(this[p] === k)
        return true;
  return false;
}
