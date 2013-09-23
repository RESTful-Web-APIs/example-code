/*
 * template file handler
 * 2012-11 (@mamund)
 * RESTful Web APIs (Richardson/Amundsen)
 */

var fs = require('fs');
var folder = process.cwd()+'/templates/';
var encoding = 'utf8';

module.exports = main;

function main(name) {
    
    try {
        return fs.readFileSync(folder+name, encoding);
    }
    catch(ex) {
        return undefined;
    }
}
