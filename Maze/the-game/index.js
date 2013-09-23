/* index.js 
 * RWA (2013)
 * 2012-10 (mca)
 */

var thisPage = function() {

    var g = {};
    g.title = '';
    g.collection = 0;
    g.mode = 'server'; // server, collection, maze
    g.moves = 0;
    g.links = [];
    g.mediaType = "application/vnd.amundsen.maze+xml";
    g.startLink = ''; //"http://localhost:1337/";
    g.sorryMsg = 'Sorry, I don\'t understand what you want to do.';
    g.successMsg = 'Congratulations! you\'ve made it out of the maze!';
      
    function init() {
        var elm;
    
        elm = document.getElementById('interface');
        if(elm) {
            elm.onsubmit = function(){return move();};
        }

        elm = document.getElementById('select-server');
        if(elm) {
            elm.onsubmit = function(){return load();};
        }

        elm = document.getElementById('select-maze');
        if(elm) {
            elm.onsubmit = function(){return getSelectedMaze();};
        }
        if(g.startLink!=='') {
            loadFromDefaultServer();
        }
        else {
            toggleDisplay();
        }
    }

    function loadFromDefaultServer() {
        var elm;

        elm = document.getElementsByName('server')[0];
        if(elm) {
            elm.value = g.startLink;
            load();
        }
    }

    function getSelectedMaze() {
        var elm, val, href;

        val = '';
        elm = document.getElementsByName('maze-number')[0];
        if(elm) {
            val = elm.value.replace(/^\s+|\s+$/g, "");
        }

        if(val!=='') {
            elm = document.getElementById('maze-'+val);
            if(elm) {
                href = elm.getAttribute('data-href');
                if(href && href!=='') {
                    getDocument(href);
                }
                else {
                    alert('No address for that maze!');
                }
            }
            else {
                alert('Unable to load that maze!');
            }
        }

        return false;
    }

    function setFocus() {
        var elm;

        elm = document.getElementsByName('move')[0];
        if(elm) {
            elm.value = '';
            elm.focus();
        }  
    }

    function toggleDisplay() {
        var elm, srv, sblock,cblock,mblock;
    
        sblock = false;
        cblock = false;
        mblock = false;

        switch(g.mode) {
            case 'server':
                sblock = true;
                break;
            case 'collection':
                cblock = true;
                break;
            case 'maze':
                mblock = true;
                break;
            default:
                break;
        }
        elm = document.getElementsByName('server')[0];
        if(elm) {
            srv = elm.value;
        }
  
        elm = document.getElementById('history');
        if(elm) {
            elm.style.display = (mblock?'block':'none');
        }
        elm = document.getElementById('display');
        if(elm) {
            elm.style.display = (mblock?'block':'none');
        }
        elm = document.getElementById('interface');
        if(elm) {
            elm.style.display = (mblock?'block':'none');
        }
        elm = document.getElementById('select-server');
        if(elm) {
            elm.style.display = (sblock?'block':'none');
        }
        elm = document.getElementById('show-mazes');
        if(elm) {
            elm.style.display = (cblock?'block':'none');
        }
    }

    function load() {
        var elm;
    
        elm = document.getElementsByName('server')[0];
        if(elm) {
            g.startLink = elm.value;
            clearList();
            clearMaze();
            if(g.startLink!=='') {
                getDocument(g.startLink);
            }
        }
        return false;
    }

    function clearList() {
        var elm;

        elm = document.getElementById('maze-list');
        if(elm) {
            elm.innerHTML = '';
        }
    }

    function clearMaze() {
        var elm;

        elm = document.getElementsByClassName('options')[0];
        if(elm) {
            elm.innerHTML = '';
        }

        elm = document.getElementsByClassName('room')[0];
        if(elm) {
            elm.innerHTML = '';
        }
    }
    
    function move() {
        var elm, mv, href;
    
        elm = document.getElementsByName('move')[0];
        if(elm) {
            mv = elm.value;
            if(mv === 'clear') {
                reload();
            }
            else {
                href = getLinkElement(mv);
                if(href) {
                    updateHistory(mv);
                    getDocument(href);
                }
                else {
                    alert(g.sorryMsg);
                }
            }
            setFocus();
        }
        return false;
    }

    function reload() {
        history.go(0);
    }  
    
    function getLinkElement(key) {
        var i, x, rtn;
    
        for(i = 0, x = g.links.length; i < x; i++) {
            if(g.links[i].rel === key) {
                rtn = g.links[i].href;
                break;
            } 
        }
        return rtn || '';
    }

    function updateHistory(mv) {
        var elm, txt;
    
        elm = document.getElementById('history');
        if(elm) {
            txt = elm.innerHTML;
            g.moves++;
            if(mv==='exit') {
                txt = g.moves +': ' + g.successMsg + '<br />' + txt; 
            }
            else {
                txt = g.moves + ':' + mv + '<br />' + txt;      
            }
            elm.innerHTML = txt;
        }
    }
  
    function processLinks(ajax) {
        var xml, link, i, x, y, j, rels, href;
    
        // handle links
        g.links = [];
        xml = ajax.responseXML.selectNodes('//link');
        for(i = 0, x = xml.length; i < x; i++) {
            href = xml[i].getAttribute('href');
            rels = xml[i].getAttribute('rel').split(' ');
            title = xml[i].getAttribute('title');
            for(j = 0, y = rels.length; j < y; j++) {
                link = {'rel' : rels[j], 'href' : href, 'title' : title};
                g.links[g.links.length] = link;
            }
        }     

        // handle titles
        g.title = '';
        xml = ajax.responseXML.selectNodes('//item');
        for(i = 0, x = xml.length; i < x; i++) {
            g.title = xml[i].getAttribute('title');
        }

        xml = ajax.responseXML.selectNodes('//cell');
        for(i = 0, x = xml.length; i < x; i++) {
            g.title = xml[i].getAttribute('title');
        }

        // handle display settings
        g.collection = 0;
        xml = ajax.responseXML.selectNodes('//collection');
        for(i = 0, x = xml.length; i < x; i++) {
            g.collection++;
        }

        if(g.collection>0) {
            g.mode = 'collection';
            showList();
            g.collection = 0;
        }
        else {
            g.mode = 'maze';
            showLocation();
            showOptions();
        }

        toggleDisplay();
        setFocus();
    }

    function showList() {
        var elm, li, a, i, x;

        elm = document.getElementById('maze-list');
        if(elm) {
            for(i = 0, x = g.links.length; i < x; i++) {
                li = document.createElement('li');
                li.id = 'maze-'+(parseInt(i)+1).toString();
                li.setAttribute('data-href',g.links[i].href);
                li.appendChild(document.createTextNode(g.links[i].title));
                elm.appendChild(li);
            }
        }
    }
    
    function getMaze(e) {
        var elm;

        e = e || event; 
        elm = e.target || e.srcElement;
        getDocument(elm.href);

        return false;
    }

    function showLocation() {
        var elm;

        elm = document.getElementsByClassName('room')[0];
        if(elm) {
            elm.innerHTML = g.title;
        }
    }

    function showOptions() {
        var elm, i, x, txt;
    
        txt = '';    
        elm = document.getElementsByClassName('options')[0];
        if(elm) {
            for(i = 0, x = g.links.length; i < x; i++) {
                if(i>0){
                    txt += ', ';
                }
                if(g.links[i].rel === 'collection') {
                    txt += 'clear';
                }
                else {
                    txt += g.links[i].rel;        
                }
            }
            elm.innerHTML = txt;
        }    
    }
    
    // make a server request
    function getDocument(url) {
        var ajax;

        ajax=new XMLHttpRequest();
        if(ajax) {
            ajax.onreadystatechange = function() {
                if(ajax.readyState==4 || ajax.readyState=='complete') {
                    processLinks(ajax);
                }
            };
              
            ajax.open('get', url, true); 
            ajax.setRequestHeader('accept', g.mediaType);
            ajax.send(null);
        }

        return false;
    }

    // publish methods  
    var that = {};
    that.init = init;
  
    return that;
};

window.onload = function() {
    var pg = thisPage();
    pg.init();
};
