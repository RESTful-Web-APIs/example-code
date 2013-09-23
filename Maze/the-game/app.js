/* RWA 
 * app.js - static file server
 * 2012-10- (mca)
 */

var fs = require('fs');
var url = require('url');
var http = require('http');
var path = require('path');
var mime = require('mime');

var basePath = './';
var port = (process.env.PORT||3000);

function handler(req, res) {
  var rs, fi;

  // reject anything but GET
  if (req.method !== 'GET') {
    res.writeHead(405);
    res.end();
    return;
  }

  // determine requested file
  if(req.url==='/') {
    fi = basePath + 'index.html';
  }
  else {
    fi = path.join(basePath, url.parse(req.url).pathname);
  }

  // stream to caller
  rs = fs.createReadStream(fi);
  rs.on('error', function () {
    res.writeHead(404);
    res.end();
  });
  rs.once('fd', function () {
    res.writeHead(200, {'Content-Type' : mime.lookup(fi)});
  });
  rs.pipe(res);
}

// listen for requests
http.createServer(handler).listen(port);
