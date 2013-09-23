/* RESTful Web APIs - 2013 */
/* Maze+XML server implementation */

var http = require('http');
var mazes = require('./mazes.js');

var port = (process.env.PORT||1337);
var root = '';

// add support for CORS
var headers = {
    'Content-Type' : 'application/xml',
    'Access-Control-Allow-Origin' : '*',
    'Access-Control-Allow-Methods' : '*',
    'Access-Control-Allow-Headers' : '*'
};

// document model for responses
var template = {};
template.mazeStart = '<maze version="1.0">';
template.mazeEnd = '</maze>';
template.collectionStart = '<collection href="{l}/">';
template.collectionEnd = '</collection>';
template.itemStart = '<item href="{l}" title="{t}">';
template.itemEnd = '</item>';
template.cellStart = '<cell href="{l}" rel="current" title="{t}">';
template.cellEnd = '</cell>';
template.link = '<link href="{l}" rel="{d}"/>';
template.titleLink = '<link href="{l}" rel="{d}" title="{t}" />';
template.error = '<error><title>{t}</title></error>';

// handle request
function handler(req, res) {
    var segments, i, x, parts;

    // set global var
    root = 'http://'+req.headers.host;

    // simple routing
    parts = [];
    segments = req.url.split('/');
    for(i=0,x=segments.length;i<x;i++) {
        if(segments[i]!=='') {
            parts.push(segments[i]);
        }
    }

    // ignore thes requests
    if(req.url==='/favicon.ico') {
        return;
    }

    // handle CORS OPTIONS call
    if(req.method==='OPTIONS') {
        var body = JSON.stringify(headers);
        showResponse(req, res, body, 200);
    }

    // only accept GETs
    if(req.method!=='GET') {
        showError(req, res, 'Method Not Allowed', 405);
    }
    else {
        // route to handle requests
        switch(parts.length) {
            case 0:
                showCollection(req, res);
                break;
            case 1:
                showMaze(req, res, parts[0]);
                break;
            case 2:
                showCell(req, res, parts[0], parts[1]);
                break;
            default:
                showError(req, res, 'Not Found', 404);
                break;
        }
    }
}

// show list of available mazes
function showCollection(req, res) {
    var body, list, i, x;
    
    body = '';
    body += template.mazeStart;
    body += template.collectionStart.replace('{l}',root);
    
    list = mazes('list');
    if(list!==undefined) {
        for(i=0,x=list.length;i<x;i++) {
            body += template.titleLink.replace('{l}',root+'/'+list[i].link).replace('{d}','maze').replace('{t}',list[i].title);
        }
    }
    
    body += template.collectionEnd;
    body += template.mazeEnd;

    showResponse(req, res, body, 200);
}

// response for a single maze
function showMaze(req, res, maze) {
    var body, data;
   
    // make sure it exists before crafting response
    data = mazes('maze',maze);
    if(data!==undefined) {
        body = '';
        body += template.mazeStart;
        body += template.itemStart.replace('{l}',root+'/'+maze).replace('{t}',data.title);
        body += template.link.replace('{l}',root+'/'+maze+'/0').replace('{d}','start');
        body += template.itemEnd;
        body += template.mazeEnd;

        showResponse(req, res, body, 200);
    }
    else {
        showError(req, res, 'Maze Not Found', 404);
    }
}

// response for a cell within the maze
function showCell(req, res, maze, cell) {
    var body, data, rel, mov, mz, sq, ex, z, t;

    // validate the maze
    mz = mazes('maze',maze);
    if(mz===undefined) {
        showError(req, res, 'Maze Not Found', 404);
        return;
    }

    // compute state and set up possible moves
    z = parseInt(cell, 10);
    t = Object.keys(mz.cells).length;
    sq = Math.sqrt(t);
    ex = t-1;

    rel = ['north', 'west', 'south', 'east'];
    mov = [z-1, z+(sq*-1), z+1, z+sq]
    
    // get cell details
    if(z===999) {
        data = {"title":"The Exit",doors:[1,1,1,1]};
    }
    else {
        data = mazes('cell', maze, cell);
    }
    
    // if we have details, craft representation
    if(data!==undefined) {
        body = '';
        body += template.mazeStart;
        body += template.cellStart.replace('{l}',root+'/'+maze+'/'+cell).replace('{t}',data.title);

        // add doors
        for(i=0,x=data.doors.length;i<x;i++) {
            if(data.doors[i]===0) {
                body += template.link.replace('{l}',root+'/'+maze+'/'+mov[i]).replace('{d}',rel[i]);
            }
        }

        // hack to add up/down for demo
        // body += template.link.replace('{l}',root+'/'+maze+'/'+mov[i-1]).replace('{d}','up');
        // body += template.link.replace('{l}',root+'/'+maze+'/'+mov[i-1]).replace('{d}','down');

        // if there is an exit, add it
        if(z===ex) {
            body += template.link.replace('{l}',root+'/'+maze+'/999').replace('{d}','exit').replace('{t}',data.title);
        }

        // add link to start of the maze and the entire collection
        body += template.titleLink.replace('{l}',root+'/'+maze).replace('{d}','maze').replace('{t}',mz.title);
        body += template.link.replace('{l}',root).replace('{d}', 'collection');
        
        body += template.cellEnd;
        body += template.mazeEnd;
    
        showResponse(req, res, body, 200);
    }
    else {
        showError(req, res, 'Cell Not Found', 404);
    }
}

// unexpected request
function showError(req, res, title, code) {
    var body = template.mazeStart
        + template.error.replace('{t}',title)
        + template.mazeEnd;
    showResponse(req, res, body, code);
}

// return response to caller
function showResponse(req, res, body, code) {
    res.writeHead(code,headers);
    res.end(body);
}

// wait for someone to call
http.createServer(handler).listen(port);
