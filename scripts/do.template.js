/** dokieli templating
 *
 * Amy Guy http://rhiaro.co.uk#i
 * http://www.apache.org/licenses/LICENSE-2.0.html Apache License, Version 2.0
 * https://github.com/linkeddata/dokieli
**/

var SimpleRDF = ld.SimpleRDF;
var TPL = {
  
  getLastModified: function(){
    // TODO: get from ETag
    return '?';
  },
  
  getLastBuilt: function(){
    //TODO: not sure where to store this..
    return '?';
  },
  
  setLastBuilt: function(time){
    if(!time){
      time = new Date();
      time = time.toISOString();
    }
    document.getElementById('template-last-built').textContent = time;
  },
  
  getContent: function(url){
      var headers = {};
      headers['Accept'] = 'text/html; charset=utf-8';
      return new Promise(function(resolve, reject) {
          var http = new XMLHttpRequest();
          http.open('GET', url);
          Object.keys(headers).forEach(function(key) {
              http.setRequestHeader(key, headers[key]);
          });
          http.withCredentials = true;
          http.onreadystatechange = function() {
              if (this.readyState == this.DONE) {
                  return resolve({xhr: this});
              }
              // this always gets returned??? (offline tho) fuck it was because of an error in the then jesus christ
              //return reject({status: this.status, xhr: this});
          };
          http.send();
      });
  },
  
  
  
  buildContent: function(){
    var template = document;
    var pages = document.querySelectorAll('main ul a');
    if(pages.length > 0){
      for(var i = 0; i < pages.length; i++){
        // TODO:
        // * GET page DOM
        var url = pages[i].href;
        TPL.getContent(url).then(
            function(result) {
                console.log(result);
                contents = document.createElement('html'); // TODO: fix
                contents.innerHTML = result.xhr.response;
                // * get whats in <main>
                var pageMain = contents.querySelector('main');
                // * replace this template's <main> with content page <main>
                template.querySelector('main').innerHTML = pageMain.innerHTML; // actually do this on a clone probably
                document.getElementById('template-building').insertAdjacentHTML('beforeEnd', '<li>'+url+'</li>'); // HERENOW url getting lost
                // * PUT that back to content page URL
                // ** Update progress template-building list to indicate success or failure of PUT
            },
            function(reason) {
                console.log(reason);
            }
        );
      }
    }else{
      console.log('No pages to build');
    }
  },
  
  showMenu: function(){
    var lastMod = TPL.getLastModified();
    var lastBuilt = TPL.getLastBuilt();
    var menu = '<menu class="do on" id="template-menu"><h2>Template</h2><div><p>This is a template</p><section id="template-modified"><h3>Last modified</h3><p><time id="template-last-modified">' + lastMod + '</time></p></section><section id="template-built"><h3>Last built</h3><p><time id="template-last-built">' + lastBuilt + '</time></p><p><button id="build-template">Build now</button></p><ul id="template-building"></ul></section></div></aside>';
    document.querySelector('body').insertAdjacentHTML('beforeEnd', menu);
    
    var doBuild = document.getElementById('build-template');
    doBuild.addEventListener("click", function(e){
      e.preventDefault();
      TPL.buildContent();
      TPL.setLastBuilt();
    }, false);
  }
  
}

document.addEventListener("DOMContentLoaded", function(event) {
  TPL.showMenu();
});