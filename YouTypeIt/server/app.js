/****************************
 * youtypeitwepostit.com
 * RESTful Web APIs 2013
 * Richardson/Amundsen
 ***************************/

var http = require('http');
var crypto = require('crypto');
var querystring = require('querystring');
var templates = require('./templates.js');
var messages = require('./messages.js');

var port = (process.env.PORT || 1337);
var root = '';

// setup for Web browser requests
var htmlHeaders = {
    'Content-Type' : 'text/html'
};
var reHome = new RegExp('^\/$','i');
var reAbout = new RegExp('^\/about$','i');
var reList = new RegExp('^\/messages$','i');
var reItem = new RegExp('^\/messages\/.*','i');
var reScript = new RegExp('^\/script.js$','i');

// setup for  API requests
var cjHeaders = {
    'Content-type' : 'application/json' //vnd.collection+json'
};
var reAPIList = new RegExp('^\/api\/$', 'i');
var reAPIItem = new RegExp('^\/api\/.*', 'i');

function handler(req, res) {
    var segments, i, x, parts, flg;

    // set root
    root = 'http://'+req.headers.host;

    // parse incoming request URL
    parts = [];
    segments = req.url.split('/');
    for(i=0, x=segments.length; i<x; i++) {
        if(segments[i]!=='') {
            parts.push(segments[i]);
        }
    }

    // handle routing
    flg=false;

    // home
    if(reHome.test(req.url)) {
        flg=true;
        if(req.method==='GET') {
            sendHtmlHome(req, res);
        }
        else {
            sendHtmlError(req, res, 'Method Not Allowed', 405);
        }
    }

    // about
    if(flg===false && reAbout.test(req.url)) {
        flg=true;
        if(req.method==='GET') {
            sendHtmlAbout(req, res);
        }
        else {
            sendHtmlError(req, res, 'Method Not Allowed', 405);
        }
    }

    // list
    if(flg===false && reList.test(req.url)) {
        flg=true;
        switch(req.method) {
            case 'GET':
                sendHtmlList(req, res);
                break;
            case 'POST':
                postHtmlItem(req, res);
                break;
            default:
                sendHtmlError(req, res, 'Method Not Allowed', 405);
                break;
        }
    }

    // item
    if(flg===false && reItem.test(req.url)) {
        flg=true;
        if(req.method==='GET') {
            sendHtmlItem(req, res, parts[1]);
        }
        else {
            sendHtmlError(req, res, 'Method Not Allowed', 405);
        }
    }

    // script file
    if(flg===false && reScript.test(req.url)) {
        flg=true;
        if(req.method==='GET') {
            sendScript(req, res);
        }
        else {
            sendHtmlError(req, res, 'Method Not Allowed', 405);
        }
    }
    
    // API List
    if(flg===false && reAPIList.test(req.url)) {
        flg=true;
        switch(req.method) {
            case 'GET':
                sendAPIList(req, res);
                break;
            case 'POST':
                postAPIItem(req, res);
                break;
            default:
                sendAPIError(req, res, 'Method Not Allowed', 405);
                break;
        }
    }
    
    // API Item
    if(flg===false && reAPIItem.test(req.url)) {
        flg=true;
        switch(req.method) {
            case 'GET':
                sendAPIItem(req, res, parts[1]);
                break;
            case 'PUT':
                updateAPIItem(req, res, parts[1]);
                break;
            case 'DELETE':
                removeAPIItem(req, res, parts[1]);
                break;
            default:
                sendAPIError(req, res, 'Method Not Allowed', 405);
                break;
        }
    }
    
    // not found
    if(flg===false) {
        sendHtmlError(req, res, 'Page Not Found', 404);
    }
}

function sendHtmlHome(req, res) {
    var t;

    try {
        t = templates('home.html');
        t = t.replace(/{@host}/g, root);
        sendHtmlResponse(req, res, t, 200);
    }
    catch (ex) {
        sendHtmlError(req, res, 'Server Error', 500);
    }
}

function sendHtmlAbout(req, res) {
    var t;

    try {
        t = templates('about.html');
        t = t.replace(/{@host}/g, root);
        sendHtmlResponse(req, res, t, 200);
    }
    catch (ex) {
        sendHtmlError(req, res, 'Server Error', 500);
    }
}

function sendHtmlList(req, res) {
    var t, rtn, list, lmDate;

    try {
        rtn = messages('list');
        list = rtn.list;
        lmDate = rtn.lastDate;
        t = templates('list.html');
        t = t.replace(/{@host}/g, root);
        t = t.replace(/{@messages}/g, formatHtmlList(list));
        sendHtmlResponse(req, res, t, 200, new Date(lmDate).toGMTString());
    }
    catch (ex) {
        sendHtmlError(req, res, 'Server Error', 500);
    }
}

function sendHtmlItem(req, res, id) {
    var t, rtn, item, lmDate;

    try {
        rtn = messages('item', id);
        item = rtn.item;
        lmDate = rtn.lastDate;
        t = templates('item.html');
        t = t.replace(/{@host}/g, root);
        t = t.replace(/{@msg}/g, formatHtmlItem(item));
        sendHtmlResponse(req, res, t, 200, new Date(lmDate).toGMTString());
    }
    catch (ex) {
        sendHtmlError(req, res, 'Server Error', 500);
    }
}

function postHtmlItem(req, res) {
    var body, item, rtn, lmDate;

    body = '';
    req.on('data', function(chunk) {
        body += chunk.toString();
    });

    req.on('end', function() {
        try {
            item = messages('add', querystring.parse(body)).item;
            res.writeHead(303,'See Other', {'Location' : root+'/messages/'+item.id});
            res.end();
        }
        catch (ex) {
            sendHtmlError(req, res, 'Server Error', 500);
        }
    });
}

function sendScript(req, res) {
    var t;
  
    try {
        t = templates('script.js');
        t = t.replace(/{@host}/g, root);
        res.writeHead(200, {'Content-Type':'application/javascript'});
        res.end(t);
    }
    catch (ex) {
        sendHtmlError(req, res, 'Server Error', 500);
    }
  
}

function sendAPIList(req, res) {
    var t, rtn, list, lmDate;

    try {
        rtn = messages('list');
        list = rtn.list;
        lmDate = rtn.lastDate;
        
        t = templates('collection.js');
        t = t.replace(/{@host}/g, root);
        t = t.replace(/{@list}/g, formatAPIList(list));
        
        sendAPIResponse(req, res, t, 200, new Date(lmDate).toGMTString());
    }
    catch (ex) {
        sendAPIError(req, res, 'Server Error', 500);
    }
}

function sendAPIItem(req, res, id) {
    var t, rtn, item, lmDate;

    try {
        rtn = messages('item', id);
        item = rtn.item;
        lmDate = rtn.lastDate;

        t = templates('collection.js');
        t = t.replace(/{@host}/g, root);
        t = t.replace(/{@list}/g, formatAPIItem(item));
        
        sendAPIResponse(req, res, t, 200, new Date(lmDate).toGMTString());
    }
    catch(ex) {
        sendAPIError(req, res, 'Server Error', 500);
    }
}

function updateAPIItem(req, res, id) {
    var body, item, msg;

    body = '';
    req.on('data', function(chunk) {
        body += chunk;
    });

    req.on('end', function() {
        try {
            msg = JSON.parse(body);
            item = messages('update', id, {message:msg.template.data[0].value}).item;
            sendAPIItem(req, res, id);
        }
        catch(ex) {
            sendAPIError(req, res, 'Server Error', 500);
        }
    });
}

function removeAPIItem(req, res, id) {
    var t;

    try {
        messages('remove', id);
        t = templates('collection.js');
        t = t.replace(/{@host}/g, root);
        t = t.replace(/{@list}/g, formatAPIList(messages('list')));
        res.writeHead(204, 'No Content', cjHeaders);
        res.end();
    }
    catch(ex) {
        sendAPIError(req, res, 'Server Error', 500);
    }
}

function postAPIItem(req, res) {
    var body, item, msg;

    body = '';
    req.on('data', function(chunk) {
        body += chunk;
    });

    req.on('end', function() {
        try {
            msg = JSON.parse(body);
            item = messages('add', {message:msg.template.data[0].value}).item;
            res.writeHead(201, 'Created', {'Location' : root + '/api/' + item.id});
            res.end();
        }
        catch(ex) {
            sendAPIError(req, res, 'Server Error', 500);
        }
    });
}

function formatHtmlItem(item) {
    var rtn;

    rtn = '<dl>\n';
    rtn += '<dt>ID</dt><dd>'+item.id+'</dd>\n';
    rtn += '<dt>DATE</dt><dd>'+item.date+'</dd>\n';
    rtn += '<dt>MSG</dt><dd>'+item.message+'</dd>';
    rtn += '</dl>\n';

    return rtn;
}

function formatHtmlList(list) {
    var i, x, rtn;

    rtn = '<ul>\n';
    for(i=0,x=list.length;i<x;i++) {
        rtn += '<li>';
        rtn += '<a href="'+root+'/messages/'+list[i].id+'" title="' + list[i].date+'">';
        rtn += list[i].message;
        rtn += '</a></li>\n';
    }
    rtn += '</ul>\n';

    return rtn;
}

function formatAPIList(list) {
    var i, x, rtn, item;

    rtn = [];
    for(i=0,x=list.length; i<x; i++) {
        item = {};
        item.href = root + '/api/' + list[i].id;
        item.data = [];
        item.data.push({name:"text", value:list[i].message});
        item.data.push({name:"date_posted", value:list[i].date});
        rtn.push(item);
    }

    return JSON.stringify(rtn, null, 4);
}

function formatAPIItem(item) {
    var rtn = {};

    rtn.href = root + '/api/' + item.id;
    rtn.data = [];
    rtn.data.push({name:"text", value:item.message});
    rtn.data.push({name:"date_posted", value:item.date});

    return "[" + JSON.stringify(rtn, null, 4) + "]";
}

function sendHtmlError(req, res, title, code) {
    var body = '<h1>' + title + '<h1>';
    sendHtmlResponse(req, res, body, code);
}

function sendHtmlResponse(req, res, body, code, lmDate) {
    res.writeHead(code, 
            {'Content-Type' : 'text/html',
            'ETag' : generateETag(body),
            'Last-Modified' : lmDate});
    res.end(body);
}

function sendAPIResponse(req, res, body, code, lmDate) {
    res.writeHead(code, 
        {"Content-Type" : "application/json", 
        "ETag" : generateETag(body),
        "Last-Modified" : lmDate});
    res.end(body);
}

function sendAPIError(req, res, title, code) {
    var err, t;

    err = {collection : {
                version : "1.0", href : "{@host}/api/",
                error : {title : title, code : code}
            }
        };

    t = JSON.stringify(err);
    t = t.replace(/{@host}/g, root);
    res.writeHead(code, 'Server Error', cjHeaders);
    res.end(t)
}

function generateETag(data) {
    var md5;

    md5 = crypto.createHash('md5');
    md5.update(data);
    return '"'+ md5.digest('hex') + '"';
}

// register listener for requests
http.createServer(handler).listen(port);

