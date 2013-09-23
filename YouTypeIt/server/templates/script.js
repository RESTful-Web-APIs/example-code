/*
 * UI enhancement script
 * for YouTypeItWePostIt.com
 * 2012-11 (@mamund)
 * RESTful Web APIs (Richardson/Amundsen)
 */

// uses bootstrap for styling
window.onload = function() {
  var elm, coll, i, x;
  
  // style the body
  elm = document.getElementsByTagName('div')[0];
  if(elm) {elm.className = 'hero-unit';}
  
  // style the nav links
  coll = document.getElementsByTagName('a');
  for(i=0, x=coll.length; i<x;i++) {
    if(coll[i].parentNode.className==='links') {
      coll[i].className = 'btn btn-primary btn-large';
    }
  }
 
  // style the message details
  elm = document.getElementsByTagName('dl')[0];
  if(elm) {elm.className='dl-horizontal'};
  
  // style the input form
  elm = document.getElementsByTagName('form')[0];
  if(elm) {elm.className='form-inline';}
  
  coll = document.getElementsByTagName('input');
  for(i=0, x=coll.length; i<x; i++) {
    if(coll[i].getAttribute('type')==='submit') {
      coll[i].className='btn';
    }
  }
}

