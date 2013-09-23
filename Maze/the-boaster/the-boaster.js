/* RWA - RESTful Web APIs
 * 2012-10 (mca)
 * the-boaster.js
 * stand-alone maze+xml client
 */

var url = require('url');
var http = require('http');
var DOMParser = require('xmldom').DOMParser;

var m = {};
m.moves = 1;
m.help = '***Usage:\nnode the-boaster [starting-url]';
m.winner = '*** DONE and it only took {m} moves! ***';
m.quitter = '*** Sorry, can\'t find any mazes here. ***';

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

    console.log(path);
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
            var doc, nodes, i, x, links, href, flag, choices;

            // collect hyperlinks from the response
            links = [];
            doc = new DOMParser().parseFromString(body, 'text/xml');
            nodes = doc.getElementsByTagName('link');
            for(i=0, x=nodes.length; i<x; i++) {
                links.push({'rel':nodes[i].getAttribute('rel'), 'href':nodes[i].getAttribute('href')});
            }

            // look for the start and claim victory
            href = findLink(links, 'start');
            if(href) {
                m.moves = parseInt(Math.random()*12)+1;
                console.log(m.winner.replace('{m}',m.moves));
                return;
            }
            
            // try to find link to a maze
            if(href===undefined) {
                href = findLink(links, 'maze');
            }

            // try to find link to a collection
            if(href===undefined) {
                href = findLink(links, 'collection');
            }

            // i give up!
            if(href===undefined) {
                console.log(m.quitter);
                return;
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
