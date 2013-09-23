/*
 * read/write messages module
 * 2012-11 (mamund)
 * RESTful Web APIs (Richardson/Ruby/Amundsen)
 */ 

var fs = require('fs');
var folder = process.cwd()+'/data/';

module.exports = main;

function main(action, arg1, arg2) {
    var rtn;

    switch(action) {
        case 'list':
            rtn = getList();
            break;
        case 'item':
            rtn = getItem(arg1);
            break;
        case 'add':
            rtn = addItem(arg1);
            break;
        case 'update':
            rtn = updateItem(arg1, arg2);
            break;
        case 'remove':
            rtn = removeItem(arg1);
            break;
        default:
            break;
    }
    return rtn;
}

function getList(arg) {
    var coll, item, list, i, x, lastDate;

    lastDate = null;
    coll = [];
    list = fs.readdirSync(folder);
    for(i=0,x=list.length;i<x;i++) {
        item = JSON.parse(fs.readFileSync(folder+list[i]));
        if(arg) {
            if(item.title.indexOf(arg)!=-1) {
                if(lastDate===null || lastDate<new Date(item.date)) {
                    lastDate = new Date(item.date);
                }
                coll.push(item);
            }
        }
        else {
            if(lastDate===null || lastDate<new Date(item.date)) {
                lastDate = new Date(item.date);
            }
            coll.push(item);
        }
    }
    return {list:coll, lastDate:lastDate};
}

function getItem(id) {
    var item, lastDate;

    item = JSON.parse(fs.readFileSync(folder+id));
    lastDate = new Date(item.date);

    return {item:item, lastDate:lastDate};
}

function addItem(item) {
    item.id = makeId();
    item.date = new Date();
    fs.writeFileSync(folder+item.id, JSON.stringify(item));
    return getItem(item.id);
}

function updateItem(id, item) {
    var current;

    current = getItem(id);
    current.message = item.message;
    current.date = new Date();
    fs.writeFileSync(folder+id, JSON.stringify(current));
    return getItem(id);
}
    
function removeItem(id) {
    fs.unlinkSync(folder+id);
    return getList();
}

function makeId() {
    var tmp, rtn;

    tmp = Math.random();
    rtn = String(tmp);
    rtn = rtn.substring(2);
    return rtn;
}
/* eof */

