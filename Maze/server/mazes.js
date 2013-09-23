/*
 * maze file handler
 * 2012-10 (mca)
 */

var fs = require('fs');
var folder = process.cwd()+'/data/';

module.exports = main;

// hande all requests for maze data
function main(cmd, maze, cell) {
    var rtn;

    switch(cmd)
    {
        case 'list':
            rtn = getList();
            break;
        case 'maze':
            rtn = getMaze(maze);
            break;
        case 'cell':
            rtn = getCell(maze, cell);
            break;
        default:
            break;
    }
    return rtn;
}

// read a list of maze files off the disk
function getList() {
    var coll, maze, list, i, x;

    coll = [];
    list = fs.readdirSync(folder);
    for(i=0,x=list.length;i<x;i++) {
        maze = getMaze(list[i].replace('.js',''));
        coll.push({"title":maze.title,"link":list[i].replace('.js','')});
    }
    return coll;
}

// return the contents of a single maze file
function getMaze(m) {
    try {
        return JSON.parse(fs.readFileSync(folder+m+'.js'));
    }
    catch(ex) {
        return undefined;
    }
}

// return a single cell from the specified maze file
function getCell(m, c) {
    try {
        var maze = getMaze(m);
        return maze.cells['cell'+c];
    }
    catch(ex) {
        return undefined;
    }
}
