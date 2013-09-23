/* RWA - RESTful Web APIs
 * 2012-10 (mca)
 * the-bot.js
 * stand-alone maze+xml client
 */

var url = require('url');
var http = require('http');
var DOMParser = require('xmldom').DOMParser;

var m = {};
m.done = false;
m.start = false;
m.facing = 'north';
m.moves = 1;
m.help = '***Usage:\nnode the-bot [starting-url]';
m.winner = '*** I made it out - and it only took {m} moves! ***';
m.quitter = '*** Sorry, I can\'t find any mazes here. ***';
m.rules = {
    'east' : ['south','east','north','west'],
    'south' : ['west','south','east','north'],
    'west' : ['north','west','south','east'],
    'north' : ['east','north','west','south']
};

// get argument and start process
arg = process.argv[2];
if(arg===undefined) {
    console.log(m.help);
}
else {
    makeRequest('GET',arg);
}

// send requests to server
function makeRequest(method, path) {
    var hdrs, options, pUrl;

    pUrl = url.parse(path);
    
    hdrs = {
        'Host' : pUrl.host,
        'Accept' : 'application/vnd.amundsen.maze+xml'
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
            var doc, nodes, i, x, links, href, flag, choices, cell, room;

            //parse incoming response
            doc = new DOMParser().parseFromString(body, 'text/xml');
            
            // get the name of this room (or maze)
            room = '';
            cell = doc.getElementsByTagName('cell')[0];
            if(cell) {
                room = cell.getAttribute('title');
            }
            maze = doc.getElementsByTagName('item')[0];
            if(maze) {
                room = maze.getAttribute('title');
            }
            if(room==='') {
                room = 'No-name Place';
            }
            
            // collect hyperlinks from the response
            links = [];
            nodes = doc.getElementsByTagName('link');
            for(i=0, x=nodes.length; i<x; i++) {
                links.push({'rel':nodes[i].getAttribute('rel'), 'href':nodes[i].getAttribute('href')});
            }

            // check for exit link
            href = findLink(links,'exit');
            if(href) {
                m.done = true;
                console.log(m.winner.replace('{m}',m.moves));
                return;
            }

            // check for entrance link
            if(m.start===false) {
                href = findLink(links, 'start');
                if(href) {
                    flag = true;
                    m.start = true;
                    m.facing = 'north';
                    console.log(m.moves++ + ': I\'m starting the ' + room + '. My first move is:' + href)
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
            }
            
            // ok, try to move to new room
            if(href===undefined) {
                choices = m.rules[m.facing];
                for(i=0, x=choices.length; i<x; i++) {
                    href = findLink(links, choices[i]);
                    if(href) {
                        flag = true;
                        m.facing = choices[i];
                        console.log(m.moves++ + ': I\'m in the ' + room + '. My next move is:' + href);
                        break;
                    }
                }
            }
            makeRequest('GET',href);
        });
    });

    req.on('error', function(error) {
        console.log(error);
    });

    req.end();
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
