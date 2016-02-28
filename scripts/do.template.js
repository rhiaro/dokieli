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
                  // does this contain headers if any are returned? make sure they are passed along
                  return resolve({xhr: this});
              }
              // this always gets returned??? even though above if gets triggered (offline tho)
              //return reject({status: this.status, xhr: this});
          };
          http.send();
      });
  },
  
  
  
  buildContent: function(){
      
      var build = function(result){
          return new Promise(function(resolve, reject){
              var template = document.documentElement.cloneNode(true);
              console.log(result);
              contents = document.createElement('html');
              contents.innerHTML = result.xhr.response;
              // * get stuff to put into template
              var pageMain = contents.querySelector('main');
              var pageTitle = contents.querySelector('title');
              // * replace put into template
              template.querySelector('main').innerHTML = pageMain.innerHTML;
              template.querySelector('title').textContent = pageTitle.textContent;
              return resolve({url: result.xhr.responseURL, html: template}); // TODO: get links from headers.. wait do/should I do this? does this get overwritten by server anyway?
          });
      };
    
    var pages = document.querySelectorAll('main ul a');
    if(pages.length > 0){
      for(var i = 0; i < pages.length; i++){
          // TODO:
          // * GET page DOM
          TPL.getContent(pages[i].href).then(build).then(
              function(response){
                  // * PUT that back to content page URL
                  DO.U.putResource(response.url, response.html); // HERENOW... do 'then' with this?
                  document.getElementById('template-building').insertAdjacentHTML('beforeEnd', '<li>'+url+'</li>');
              },
              function(reason){
                  console.log('failed to put: ' + reason);
                  document.getElementById('template-building').insertAdjacentHTML('beforeEnd', '<li><strong>FAIL: </strong>'+url+'</li>');
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