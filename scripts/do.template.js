/** dokieli templating
 *
 * Amy Guy http://rhiaro.co.uk#i
 * http://www.apache.org/licenses/LICENSE-2.0.html Apache License, Version 2.0
 * https://github.com/linkeddata/dokieli
**/

var SimpleRDF = ld.SimpleRDF;
var TPL = {
  
  getLastModified: function(){
    return document.getElementById('template-modified').getAttribute('datetime');
  },
  
  getLastBuilt: function(){
    return document.getElementById('template-built').getAttribute('datetime');
  },
  
  setLastBuilt: function(time){
    if(!time){
      time = new Date();
      time = time.toUTCString();
    }
    document.getElementById('template-built').setAttribute('datetime', time);
    document.getElementById('template-built').textContent = time;
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
              // TODO: find a less horrendously verbose way to get a DOM tree from an html string. Maybe DO.U.getDocument could offer this..?
              var template_html = DO.U.getDocument();
              var template = document.createElement('html');
              template.innerHTML = template_html;
              var dom = document.createElement('html');
              dom.innerHTML = result.xhr.response;
              var normalised_html = DO.U.getDocument(dom);
              var contents = document.createElement('html');
              contents.innerHTML = normalised_html;
              // * get stuff to put into template
              var pageMain = contents.querySelector('main');
              var pageTitle = contents.querySelector('title');
              // * replace put into template
              template.querySelector('#do-template-script').remove();
              template.querySelector('main').innerHTML = pageMain.innerHTML;
              template.querySelector('title').textContent = pageTitle.textContent;
              return resolve({url: result.xhr.responseURL, html: template.outerHTML}); // TODO: get links from headers.. wait do/should I do this? does this get overwritten by server anyway?
          });
      };
      var update_list = function(url, message, time){
          var li = document.querySelector('[href="' + url + '"]').parentNode;
          if(time){
              time = new Date();
              time = time.toUTCString();
              li.querySelector('time').textContent = ' (' + time + ')';
              li.querySelector('time').setAttribute('datetime', time);
          }
          li.insertAdjacentHTML('beforeEnd', ' <strong class="do">' + message + '</strong>');
      };
    
      var pages = document.querySelectorAll('main ul a');
      if(pages.length > 0){
          for(var i = 0; i < pages.length; i++){
              console.log(pages[i].href);
              update_list(pages[i].href, "...building...");
              TPL.getContent(pages[i].href).then(build).then(
                  function(response){
                      console.log('build response');
                      console.log(response)
                      // * PUT that back to content page URL
                      DO.U.putResource(response.url, response.html).then(
                          function(r){
                              console.log(r);
                              update_list(r.xhr.responseURL, "Built successfully", true);
                          },
                          function(r){
                              console.log(r);
                              var error = "";
                              switch(r.status){
                                  default:
                                      error += "for unknown reasons ("+r.status+")";
                                      break;
                                  case 405:
                                      error += "not writeable";
                                      break;
                                  case 404:
                                      error += "not found";
                                      break;
                                  case 401: case 403:
                                      error += "not authorised";
                                      break;
                              }
                              update_list(r.xhr.responseURL, "Failed ("+error+")");
                          }
                      );
                  },
                  function(reason){
                      update_list(pages[i].href, "Failed ("+reason+")");
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
    var menu = '<menu class="do on" id="template-menu"><h2>Template</h2><div><p>This is a template</p><p><button id="build-template">Build now</button></p><ul id="template-building"></ul></section></div></aside>';
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