(function ($) {

AjaxSolr.ResultWidget = AjaxSolr.AbstractWidget.extend({
  start: 0,

  beforeRequest: function () {
    $(this.target).html($('<img>').attr('src', 'images/ajax-loader.gif'));
    //$(this.target).html($('<img>').attr('src', 'fileadmin/misc/ajax-solr_repositoryB/images/ajax-loader.gif'));
  },

  facetLinks: function (facet_field, facet_values) {
    var links = [];
    if (facet_values) {
      for (var i = 0, l = facet_values.length; i < l; i++) {
        if (facet_values[i] !== undefined) {
          links.push(
            $('<a href="#"></a>')
            .text(facet_values[i])
            .click(this.facetHandler(facet_field, facet_values[i]))
          );
        }
        else {
          links.push('no items found in current selection');
        }
      }
    }
    return links;
  },

  facetHandler: function (facet_field, facet_value) {
    var self = this;
    return function () {
      self.manager.store.remove('fq');
      self.manager.store.addByValue('fq', facet_field + ':' + AjaxSolr.Parameter.escapeValue(facet_value));
      self.doRequest(0);
      return false;
    };
  },

  afterRequest: function () {
    $(this.target).empty();
    for (var i = 0, l = this.manager.response.response.docs.length; i < l; i++) {
      var doc = this.manager.response.response.docs[i];
      $(this.target).append(this.template(doc));

      var items = [];
      /*items = items.concat(this.facetLinks('topics', doc.topics));
      items = items.concat(this.facetLinks('organisations', doc.organisations));
      items = items.concat(this.facetLinks('exchanges', doc.exchanges));*/

      //var $links = $('#links_' + doc.id);
      /*$links.empty();
      for (var j = 0, m = items.length; j < m; j++) {
           $links.append($('<li></li>').append(items[j]));
         }*/
    }
  },

    getDocSnippets: function(highlighting, doc) {

        var id_val = doc['id']; //Change if your documents have different ID field name
        var cur_doc_highlighting = highlighting[id_val];
        var all_snippets_arr = [];
        if (typeof cur_doc_highlighting != 'undefined') {
            for (var snip_k in cur_doc_highlighting) {
                var cur_snippets = cur_doc_highlighting[snip_k];
                for (var snip_i=0; snip_i < cur_snippets.length; snip_i++) {
                    var cur_snippet_txt = cur_snippets[snip_i];
                    all_snippets_arr.push(cur_snippet_txt);
                }
            }
        }
        var cur_doc_snippets_txt =  all_snippets_arr.join('');
        return(cur_doc_snippets_txt);
    },

  template: function (doc,highlighting) {

      var snippet = '';
      var cur_doc_highlighting_txt;
      if (this.highlighting && highlighting) {
          cur_doc_highlighting_txt = this.getDocSnippets(highlighting,doc);
      }
      var output2 =doc.book_id;
      var url2 =  this.manager.solrUrl+"select?fq=hasModel:Book&q=hasModel:Book%20and%20book_id:"+output2+"&wt=json&json.wrf=?&callback=?";
      //var url2 =  this.manager.solrUrl+"select?q=hasModel:Book%20AND%20book_id:"+output2+"&wt=json&json.wrf=?&callback=?";
      var url3 = this.manager.solrUrl+"select?fq=book_id="+doc.page_id+"&q=hasModel:Page&wt=json&json.wrf=?&callback=?";
      //var url3 = this.manager.solrUrl+"select?fq=book_id="+doc.page_id+"&q=hasModel:Page&wt=json&rows=0&json.wrf=?&callback=?";
      var titles = "";
      var titles2 = "";
      var data="";
      var data2 ="";
      var str = "link";
      var id = doc.id;
      var rmbb= 'rmbb';
      var locgaz = 'loc_gaz';
      var xuxiu ="Diaolong_xuxiu";
      if (doc.id.indexOf(rmbb)){
          data = "1";
      } else if  (doc.id.indexOf(loc_gaz)) {
          data = "1";
      } else if  (doc.id.indexOf(xuxiu)) {
          data = "1";
      }
      else {
          data = "1";
      }

      if (doc.hasModel=="Page") {
          $.when($.getJSON(url2), $.getJSON(url3)).then(function(data,data2){
              if (data[0].response.docs[0].collection=="Local Gazetteer"){
                  var test = data[0].response;
                  if (data[0].response.docs[0].date!=0) {
                      data =  $('#titles').append('<h4>'+ data[0].response.docs[0].title +" ,"+ data[0].response.docs[0].author + '.  ' + data[0].response.docs[0].date+  ',  p.'+doc.position+'</h4>');
                  } else {
                      data =  $('#titles').append('<h4>'+ data[0].response.docs[0].title + " ,"+ data[0].response.docs[0].author +'.  ' +  ',  p.'+doc.position+'</h4>');
                  }

                  var str = '<svg data-v-114fcf88="" version="1.1" role="presentation" width="13.714285714285714" height="16" viewBox="0 0 1536 1792" class="fa-icon"><path d="M768 768q237 0 443-43t325-127v170q0 69-103 128t-280 93.5-385 34.5-385-34.5-280-93.5-103-128v-170q119 84 325 127t443 43zM768 1536q237 0 443-43t325-127v170q0 69-103 128t-280 93.5-385 34.5-385-34.5-280-93.5-103-128v-170q119 84 325 127t443 43zM768 1152q237 0 443-43t325-127v170q0 69-103 128t-280 93.5-385 34.5-385-34.5-280-93.5-103-128v-170q119 84 325 127t443 43zM768 0q208 0 385 34.5t280 93.5 103 128v128q0 69-103 128t-280 93.5-385 34.5-385-34.5-280-93.5-103-128v-128q0-69 103-128t280-93.5 385-34.5z"></path>';
                  var link = str.link("http://erf.sbb.spk-berlin.de/han/fangzhiku/");
                  if (doc.text && doc.text.length > 300) {
                      if (doc.text!=null) {
                          data2 += $('#titles').append(doc.text.substring(0, 300));
                          //data2 += $('#titles').append(doc.text.substring(0, 300)+cur_doc_highlighting_txt);
                          data2 += $('#titles').append('<span style="display:none;">' + doc.text.substring(300));

                          data2 += $('#titles').append('</span> <a href="#" class="more"> ... more</a>');
                          data2 += $('#titles').append('</br><b>' +'collection: </b>'+ doc.collection);
                          data2 += $('#titles').append('</br>'+'<p id="link">' + link + '</p>');
                          data2 += $('#titles').append('</br>'+'<p id="link">' + link + '</p>');
                          data2 += $('#titles').append(doc.score);
                      }
                  } else {
                      data2 = $('#titles').append(doc.text);
                      data2 += $('#titles').append('</br><b>' +'collection: </b>'+ doc.collection);
                      data2 += $('#titles').append('</br>'+'<p id="link">' + link + '</p>');
                      data2 += $('#titles').append(doc.score);
                  }

              }
              else if (data[0].response.docs[0].collection=="Adam Matthew FO China"){
                  if (data[0].response.docs[0].date!=null) {
                      data =  $('#titles').append('<h4>'+ data[0].response.docs[0].title + '.  ' + data[0].response.docs[0].date+  ',  p.'+doc.position+'</h4>');
                  } else {
                      data =  $('#titles').append('<h4>'+ data[0].response.docs[0].title + '.  ' + ',  p.'+doc.position+'</h4>');
                  }
                  var str = '<svg data-v-114fcf88="" version="1.1" role="presentation" width="14.857142857142858" height="16" viewBox="0 0 1664 1792" class="fa-icon"><path d="M1639 478q40 57 18 129l-275 906q-19 64-76.5 107.5t-122.5 43.5h-923q-77 0-148.5-53.5t-99.5-131.5q-24-67-2-127 0-4 3-27t4-37q1-8-3-21.5t-3-19.5q2-11 8-21t16.5-23.5 16.5-23.5q23-38 45-91.5t30-91.5q3-10 0.5-30t-0.5-28q3-11 17-28t17-23q21-36 42-92t25-90q1-9-2.5-32t0.5-28q4-13 22-30.5t22-22.5q19-26 42.5-84.5t27.5-96.5q1-8-3-25.5t-2-26.5q2-8 9-18t18-23 17-21q8-12 16.5-30.5t15-35 16-36 19.5-32 26.5-23.5 36-11.5 47.5 5.5l-1 3q38-9 51-9h761q74 0 114 56t18 130l-274 906q-36 119-71.5 153.5t-128.5 34.5h-869q-27 0-38 15-11 16-1 43 24 70 144 70h923q29 0 56-15.5t35-41.5l300-987q7-22 5-57 38 15 59 43zM575 480q-4 13 2 22.5t20 9.5h608q13 0 25.5-9.5t16.5-22.5l21-64q4-13-2-22.5t-20-9.5h-608q-13 0-25.5 9.5t-16.5 22.5zM492 736q-4 13 2 22.5t20 9.5h608q13 0 25.5-9.5t16.5-22.5l21-64q4-13-2-22.5t-20-9.5h-608q-13 0-25.5 9.5t-16.5 22.5z"></path>  <!----></svg>';
                  var link = str.link(doc.image_url).replace("http://www.archivesdirect.amdigital.co.uk/Documents/Images/","http://www.archivesdirect.amdigital.co.uk.officefileschina.erf.sbb.spk-berlin.de/Documents/Images/");
                  if (doc.text && doc.text.length > 300) {
                      if (doc.text!=null) {
                         data2 += $('#titles').append(doc.text.substring(0, 300));
                              //data2 += $('#titles').append(doc.text.substring(0, 300)+cur_doc_highlighting_txt);
                         data2 += $('#titles').append('<span style="display:none;">' + doc.text.substring(300));
                         data2 += $('#titles').append('</span> <a href="#" class="more"> ... more</a>');
                         data2 += $('#titles').append('</br><b>' +'collection: </b>'+ doc.collection);
                         data2 += $('#titles').append('</br>'+'<p id="link">' + link + '</p>');
                         data2 += $('#titles').append(doc.score);
                      }
                  } else {
                          data2 = $('#titles').append(doc.text);
                          data2 += $('#titles').append('</br><b>' +'collection: </b>'+ doc.collection);
                          data2 += $('#titles').append(doc.score);
                  }

              }
              else if (data[0].response.docs[0].collection=="Airiti") {
                  var page = parseInt(doc.position);
                  var combineLink = '&GoToPage='+page;
                  var str = '<svg data-v-114fcf88="" version="1.1" role="presentation" width="14.857142857142858" height="16" viewBox="0 0 1664 1792" class="fa-icon"><path d="M1639 478q40 57 18 129l-275 906q-19 64-76.5 107.5t-122.5 43.5h-923q-77 0-148.5-53.5t-99.5-131.5q-24-67-2-127 0-4 3-27t4-37q1-8-3-21.5t-3-19.5q2-11 8-21t16.5-23.5 16.5-23.5q23-38 45-91.5t30-91.5q3-10 0.5-30t-0.5-28q3-11 17-28t17-23q21-36 42-92t25-90q1-9-2.5-32t0.5-28q4-13 22-30.5t22-22.5q19-26 42.5-84.5t27.5-96.5q1-8-3-25.5t-2-26.5q2-8 9-18t18-23 17-21q8-12 16.5-30.5t15-35 16-36 19.5-32 26.5-23.5 36-11.5 47.5 5.5l-1 3q38-9 51-9h761q74 0 114 56t18 130l-274 906q-36 119-71.5 153.5t-128.5 34.5h-869q-27 0-38 15-11 16-1 43 24 70 144 70h923q29 0 56-15.5t35-41.5l300-987q7-22 5-57 38 15 59 43zM575 480q-4 13 2 22.5t20 9.5h608q13 0 25.5-9.5t16.5-22.5l21-64q4-13-2-22.5t-20-9.5h-608q-13 0-25.5 9.5t-16.5 22.5zM492 736q-4 13 2 22.5t20 9.5h608q13 0 25.5-9.5t16.5-22.5l21-64q4-13-2-22.5t-20-9.5h-608q-13 0-25.5 9.5t-16.5 22.5z"></path>  <!----></svg>';
                  var link2 = (data[0].response.docs[0].identifier).toString();
                  var newLink=link2.replace('http://www.airitibooks.com/detail.aspx?','http://www.airitibooks.com.airiti.erf.sbb.spk-berlin.de/pdfViewer/index.aspx?');
                  var link = str.link(newLink+combineLink);
                  data =  $('#titles').append('<h4>'+
                      data[0].response.docs[0].title + '.  ' + data[0].response.docs[0].date+  ',  p.'+doc.position+'</h4>');

                  if (doc.text && doc.text.length > 300) {
                      if (doc.text!=null) {
                          data2 += $('#titles').append(doc.text.substring(0, 300));
                          data2 += $('#titles').append('<span style="display:none;">' + doc.text.substring(300));
                          data2 += $('#titles').append('</span> <a href="#" class="more"> ... more</a>');
                          data2 += $('#titles').append('</br><b>' +'collection: </b>'+ doc.collection);
                          data2 += $('#titles').append('</br>'+'<p id="link">' + link + '</p>');
                          data2 += $('#titles').append('<br>'+doc.score);
                      }
                  } else {
                      data2 += $('#titles').append(doc.text);
                      data2 += $('#titles').append('</br><b>' +'collection: </b>'+ doc.collection);
                      data2 += $('#titles').append('</br>'+'<p id="link">' + link + '</p>');
                      data2 += $('#titles').append('<br>'+doc.score);
                  }

              }
              else if(data[0].response.docs[0].collection=="Xuxiu") {
                  data =  $('#titles').append('<h4>'+ data[0].response.docs[0].title + '.  ' +   ',  p.'+doc.position+'</h4>');
                  var str = '<svg data-v-114fcf88="" version="1.1" role="presentation" width="14.857142857142858" height="16" viewBox="0 0 1664 1792" class="fa-icon"><path d="M1639 478q40 57 18 129l-275 906q-19 64-76.5 107.5t-122.5 43.5h-923q-77 0-148.5-53.5t-99.5-131.5q-24-67-2-127 0-4 3-27t4-37q1-8-3-21.5t-3-19.5q2-11 8-21t16.5-23.5 16.5-23.5q23-38 45-91.5t30-91.5q3-10 0.5-30t-0.5-28q3-11 17-28t17-23q21-36 42-92t25-90q1-9-2.5-32t0.5-28q4-13 22-30.5t22-22.5q19-26 42.5-84.5t27.5-96.5q1-8-3-25.5t-2-26.5q2-8 9-18t18-23 17-21q8-12 16.5-30.5t15-35 16-36 19.5-32 26.5-23.5 36-11.5 47.5 5.5l-1 3q38-9 51-9h761q74 0 114 56t18 130l-274 906q-36 119-71.5 153.5t-128.5 34.5h-869q-27 0-38 15-11 16-1 43 24 70 144 70h923q29 0 56-15.5t35-41.5l300-987q7-22 5-57 38 15 59 43zM575 480q-4 13 2 22.5t20 9.5h608q13 0 25.5-9.5t16.5-22.5l21-64q4-13-2-22.5t-20-9.5h-608q-13 0-25.5 9.5t-16.5 22.5zM492 736q-4 13 2 22.5t20 9.5h608q13 0 25.5-9.5t16.5-22.5l21-64q4-13-2-22.5t-20-9.5h-608q-13 0-25.5 9.5t-16.5 22.5z"></path>  <!----></svg>';
                  /*var test = data[0].response;
                  var test2 =data2[0].response;
                  var vor_link1 = (data[0].response.docs[0].identifier[0]).replace("type=\"CrossAsia Link\" ","");
                  var vor_link2 = (data[0].response.docs[0].identifier[1]).replace("type=\"CrossAsia Link\" ","");
                  var http="type=\"CrossAsia Link\" http://erf.sbb.spk-berlin.de/han/xuxiu/hunteq.com/ancientc/ancientkm?!!";*/

                  if (doc.text && doc.text.length > 300) {
                      if (doc.text!=null) {
                          data2 += $('#titles').append(doc.text.substring(0, 300));
                          //data2 += $('#titles').append(doc.text.substring(0, 300)+cur_doc_highlighting_txt);
                          data2 += $('#titles').append('<span style="display:none;">' + doc.text.substring(300));
                          data2 += $('#titles').append('</span> <a href="#" class="more"> ... more</a>');
                          data2 += $('#titles').append('</br><b>' +'collection: </b>'+ doc.collection);
                          data2 += $('#titles').append('<br>'+doc.score);

                      }
                  } else {
                      data2 = $('#titles').append(doc.text);
                      data2 += $('#titles').append('</br><b>' +'collection: </b>'+ doc.collection);
                      data2 += $('#titles').append('<br>'+doc.score);
                  }
              }
              else {
                  data =  $('#titles').append('<h4>'+
                      data[0].response.docs[0].title + '.  ' +  ',  p.'+doc.position+'</h4>');
              }
          });
          var output = '<div><span><span id="titles"></span></br>';
      }
      else if (doc.hasModel=='Article') {
          var rightDate = moment(doc.wholeDate.toString()).format("DD.MM.YYYY");
          //var output = '<div><h4>'  + doc.title + ",  "+rightDate+'</h4>';
          var output = '<div><h4>'  +"Title: "+ doc.title + ",  p."+doc.page+'</h4>';
          var str = '<svg data-v-114fcf88="" version="1.1" role="presentation" width="13.714285714285714" height="16" viewBox="0 0 1536 1792" class="fa-icon"><path d="M768 768q237 0 443-43t325-127v170q0 69-103 128t-280 93.5-385 34.5-385-34.5-280-93.5-103-128v-170q119 84 325 127t443 43zM768 1536q237 0 443-43t325-127v170q0 69-103 128t-280 93.5-385 34.5-385-34.5-280-93.5-103-128v-170q119 84 325 127t443 43zM768 1152q237 0 443-43t325-127v170q0 69-103 128t-280 93.5-385 34.5-385-34.5-280-93.5-103-128v-170q119 84 325 127t443 43zM768 0q208 0 385 34.5t280 93.5 103 128v128q0 69-103 128t-280 93.5-385 34.5-385-34.5-280-93.5-103-128v-128q0-69 103-128t280-93.5 385-34.5z"></path>';
          var link = str.link("http://erf.sbb.spk-berlin.de/han/RenminRibao1/");
          if (doc.text!=null && doc.text.length > 300) {
              //output += (doc.text.substring(0, 300)+cur_doc_highlighting_txt);

              if (doc.author!==undefined) {
                  output += ("author: "+doc.author+"</br>");
              }
              output += ("date: "+rightDate+"</br>");
              if (doc.description!==undefined) {
                  output += ("note: " + doc.description + "</br>");
              }
              output += ("collection: "+doc.collection+"</br></br>");
              output += (doc.text.substring(0, 300));
              output += ('<span style="display:none;">' + doc.text.substring(300));
              output += ('</span> <a href="#" class="more"> ... more</a>');
              output += ('</br>'+'<p id="link">' + link + "</p>");
              output += (doc.score);
          } else if (doc.text!=null && doc.text.length < 300) {
              //output += (doc.text+cur_doc_highlighting_txt);
              if (doc.author!==undefined) {
                  output += ("author: "+doc.author+"</br>");
              }
              output += ("date: "+rightDate+"</br>");
              if (doc.description!==undefined) {
                  output += ("note: " + doc.description + "</br>");
              }
              output += ("collection: "+doc.collection+"</br></br>");
              output += (doc.text);
              output += ('</br>'+'<p id="link">' + link + '</p>');
              output += (doc.score);
          }

      }
      else if (doc.hasModel=='Book') {
          if (doc.responsibility!==undefined) {
              var output = '<div><h4>Title: ' + doc.title + ", " + doc.responsibility + '</h4>';
          }else {
              var output = '<div><h4>Title: ' + doc.title   + '</h4>';
          }
          if (doc.collection=="Local Gazetteer"){
              if (doc.author!=null) {
                  snippet +=  '<b>'+'author: </b>' + doc.author; +'<br>'}

              if (doc.publisher!=null) {snippet +=  ' <b>' +'publisher: </b>'+ doc.publisher;}

              if (doc.publication_name!=null) {snippet +=  ','+ doc.publication_name;}
              if (doc.edition!==undefined) {snippet +=  '<br><b> edition: </b>' + doc.edition;}
              //if (doc.source!=null) {snippet +=  ' <br><b>' +'Source = </b>'+ doc.source;}
              //if (doc.issued!=null) {snippet +=  '<br><b> IssueNumber = </b>' + doc.issued;}
              if (doc.date!=null) {snippet +=  '<br><b> date: </b>' + doc.date;
                  if (doc.issued!=null) {snippet +=  '/' + doc.issued;}
              }
              if (doc.date==null) {
                  if (doc.issued!=null) {snippet += '<br><b> Date = </b>' + doc.issued;}
              }

              /*if (doc.responsibility!=null) {
                  snippet +=  ' <br><b>' +'Note = </b>'+ doc.responsibility;
              }*/

              if (doc.series_title!=null) { snippet += ' <br><b>' +'series: </b>'+ doc.series_title;
                  if (doc.source!=null) {snippet +=  ' ,'+ doc.source;}
              }

              if (doc.series_title==null) {
                  if (doc.source!=null) {snippet +=   ' <br><b>' +'note: </b>'+ doc.source;}
              }


              snippet +=   ' <br><b>' +'collection: </b>'+ doc.collection;
              if (doc.url!=null) {

                  var str = '<svg data-v-114fcf88="" version="1.1" role="presentation" width="13.714285714285714" height="16" viewBox="0 0 1536 1792" class="fa-icon"><path d="M768 768q237 0 443-43t325-127v170q0 69-103 128t-280 93.5-385 34.5-385-34.5-280-93.5-103-128v-170q119 84 325 127t443 43zM768 1536q237 0 443-43t325-127v170q0 69-103 128t-280 93.5-385 34.5-385-34.5-280-93.5-103-128v-170q119 84 325 127t443 43zM768 1152q237 0 443-43t325-127v170q0 69-103 128t-280 93.5-385 34.5-385-34.5-280-93.5-103-128v-170q119 84 325 127t443 43zM768 0q208 0 385 34.5t280 93.5 103 128v128q0 69-103 128t-280 93.5-385 34.5-385-34.5-280-93.5-103-128v-128q0-69 103-128t280-93.5 385-34.5z"></path>';
                  var link = str.link("http://erf.sbb.spk-berlin.de/han/fangzhiku");
                  snippet +=  ' <br>'+ '<span id="link">'+ link+'</span>';
              }

              if (doc.identifier!=null) {
                  var str = '<svg data-v-114fcf88="" version="1.1" role="presentation" width="13.714285714285714" height="16" viewBox="0 0 1536 1792" class="fa-icon"><path d="M768 768q237 0 443-43t325-127v170q0 69-103 128t-280 93.5-385 34.5-385-34.5-280-93.5-103-128v-170q119 84 325 127t443 43zM768 1536q237 0 443-43t325-127v170q0 69-103 128t-280 93.5-385 34.5-385-34.5-280-93.5-103-128v-170q119 84 325 127t443 43zM768 1152q237 0 443-43t325-127v170q0 69-103 128t-280 93.5-385 34.5-385-34.5-280-93.5-103-128v-170q119 84 325 127t443 43zM768 0q208 0 385 34.5t280 93.5 103 128v128q0 69-103 128t-280 93.5-385 34.5-385-34.5-280-93.5-103-128v-128q0-69 103-128t280-93.5 385-34.5z"></path>';
                  var link = str.link("http://erf.sbb.spk-berlin.de/han/fangzhiku");
                  snippet +=  ' <br>'+ '<span id="link">'+ link+'</span>';
              }
          }
          else if (doc.collection=="Xuxiu") {
              if (doc.author!=null) {
                  snippet +=  '<b>'+'author: </b>' + doc.author; +'<br>'}

              if (doc.publisher!=null) {snippet +=  ' <b>' +'edition: </b>'+ doc.publisher;}
              if (doc.publication_name!=null) {snippet +=  ','+ doc.publication_name;}
              if (doc.edition!=null) {snippet +=  ','+ doc.edition;}
              //if (doc.source!=null) {snippet +=  ' <br><b>' +'Source = </b>'+ doc.source;}
              //if (doc.issued!=null) {snippet +=  '<br><b> IssueNumber = </b>' + doc.issued;}
              if (doc.date!=null) {snippet +=  '<br><b> date: </b>' + doc.date;
                  if (doc.issued!=null) {snippet +=  '/' + doc.issued;}
              }
              if (doc.date==null) {
                  if (doc.issued!=null) {snippet += '<br><b> date: </b>' + doc.issued;}
              }

              /*if (doc.responsibility!=null) {
                  snippet +=  ' <br><b>' +'note: </b>'+ doc.responsibility;
              }*/

              if (doc.series_title!=null) { snippet += ' <br><b>' +'note: </b>'+ doc.series_title;
                  if (doc.source!=null) {snippet +=  ' ,'+ doc.source;}
              }

              if (doc.series_title==null) {
                  if (doc.source!=null) {snippet +=   ' <br><b>' +'note: </b>'+ doc.source;}
              }

              snippet +=   ' <br><b>' +'collection: </b>'+ doc.collection;

              if (doc.url!=null) {

                  var link = str.link(doc.url);
                  snippet +=  ' <br>'+ '<span id="link">'+ link+'</span>';

              }

              if (doc.identifier!=null) {
                  var str = '<svg data-v-114fcf88="" version="1.1" role="presentation" width="14.857142857142858" height="16" viewBox="0 0 1664 1792" class="fa-icon"><path d="M1639 478q40 57 18 129l-275 906q-19 64-76.5 107.5t-122.5 43.5h-923q-77 0-148.5-53.5t-99.5-131.5q-24-67-2-127 0-4 3-27t4-37q1-8-3-21.5t-3-19.5q2-11 8-21t16.5-23.5 16.5-23.5q23-38 45-91.5t30-91.5q3-10 0.5-30t-0.5-28q3-11 17-28t17-23q21-36 42-92t25-90q1-9-2.5-32t0.5-28q4-13 22-30.5t22-22.5q19-26 42.5-84.5t27.5-96.5q1-8-3-25.5t-2-26.5q2-8 9-18t18-23 17-21q8-12 16.5-30.5t15-35 16-36 19.5-32 26.5-23.5 36-11.5 47.5 5.5l-1 3q38-9 51-9h761q74 0 114 56t18 130l-274 906q-36 119-71.5 153.5t-128.5 34.5h-869q-27 0-38 15-11 16-1 43 24 70 144 70h923q29 0 56-15.5t35-41.5l300-987q7-22 5-57 38 15 59 43zM575 480q-4 13 2 22.5t20 9.5h608q13 0 25.5-9.5t16.5-22.5l21-64q4-13-2-22.5t-20-9.5h-608q-13 0-25.5 9.5t-16.5 22.5zM492 736q-4 13 2 22.5t20 9.5h608q13 0 25.5-9.5t16.5-22.5l21-64q4-13-2-22.5t-20-9.5h-608q-13 0-25.5 9.5t-16.5 22.5z"></path>  <!----></svg>';
                  var vor_link1 = doc.identifier[0];
                  var vor_link2 = doc.identifier[1];
                  var http="type=\"CrossAsia Link\" http://erf.sbb.spk-berlin.de/han/xuxiu/hunteq.com/ancientc/ancientkm?!!";
                  if (vor_link1.includes(http)) {
                      var link_replace = vor_link1.replace("type=\"CrossAsia Link\" ","");
                      var link = str.link(link_replace);
                      snippet +=  ' <br>'+ '<span id="link">'+ link+'</span>';
                  } else if (vor_link2.includes(http)) {
                      var link_replace = vor_link2.replace("type=\"CrossAsia Link\" ","");
                      var link = str.link(link_replace);
                      snippet +=  ' <br>'+ '<span id="link">'+ link+'</span>';
                  }
              }

          }
          else if (doc.collection=="Adam Matthew FO China") {
              if (doc.author!=null) {
                  snippet +=  '<b>'+'author: </b>' + doc.author; +'<br>'}

              if (doc.publisher!=null) {snippet +=  ' <b>' +'edition: </b>'+ doc.publisher;}
              if (doc.publication_name!=null) {snippet +=  ','+ doc.publication_name;}
              if (doc.edition!=null) {snippet +=  ','+ doc.edition;}
              //if (doc.source!=null) {snippet +=  ' <br><b>' +'Source = </b>'+ doc.source;}
              //if (doc.issued!=null) {snippet +=  '<br><b> IssueNumber = </b>' + doc.issued;}
              if (doc.date!=null) {snippet +=  '<br><b> date: </b>' + doc.date;
                  if (doc.issued!=null) {snippet +=  '/' + doc.issued;}
              }
              if (doc.date==null) {
                  if (doc.issued!=null) {snippet += '<br><b> date: </b>' + doc.issued;}
              }

              if (doc.responsibility!=null) {
                  snippet +=  ' <br><b>' +'note: </b>'+ doc.responsibility;
              }

              if (doc.series_title!=null) { snippet += ' <br><b>' +'note: </b>'+ doc.series_title;
                  if (doc.source!=null) {snippet +=  ' ,'+ doc.source;}
              }

              if (doc.series_title==null) {
                  if (doc.source!=null) {snippet +=   ' <br><b>' +'note: </b>'+ doc.source;}
              }

              snippet +=   ' <br><b>' +'collection: </b>'+ doc.collection;

              if (doc.url!=null) {
                  var str = '<svg data-v-114fcf88="" version="1.1" role="presentation" width="14.857142857142858" height="16" viewBox="0 0 1664 1792" class="fa-icon"><path d="M1639 478q40 57 18 129l-275 906q-19 64-76.5 107.5t-122.5 43.5h-923q-77 0-148.5-53.5t-99.5-131.5q-24-67-2-127 0-4 3-27t4-37q1-8-3-21.5t-3-19.5q2-11 8-21t16.5-23.5 16.5-23.5q23-38 45-91.5t30-91.5q3-10 0.5-30t-0.5-28q3-11 17-28t17-23q21-36 42-92t25-90q1-9-2.5-32t0.5-28q4-13 22-30.5t22-22.5q19-26 42.5-84.5t27.5-96.5q1-8-3-25.5t-2-26.5q2-8 9-18t18-23 17-21q8-12 16.5-30.5t15-35 16-36 19.5-32 26.5-23.5 36-11.5 47.5 5.5l-1 3q38-9 51-9h761q74 0 114 56t18 130l-274 906q-36 119-71.5 153.5t-128.5 34.5h-869q-27 0-38 15-11 16-1 43 24 70 144 70h923q29 0 56-15.5t35-41.5l300-987q7-22 5-57 38 15 59 43zM575 480q-4 13 2 22.5t20 9.5h608q13 0 25.5-9.5t16.5-22.5l21-64q4-13-2-22.5t-20-9.5h-608q-13 0-25.5 9.5t-16.5 22.5zM492 736q-4 13 2 22.5t20 9.5h608q13 0 25.5-9.5t16.5-22.5l21-64q4-13-2-22.5t-20-9.5h-608q-13 0-25.5 9.5t-16.5 22.5z"></path>  <!----></svg>';
                  var link = str.link(doc.url);
                  snippet +=  ' <br>'+ '<span id="link">'+ link+'</span>';
              }

              if (doc.identifier!=null) {
                  var str = '<svg data-v-114fcf88="" version="1.1" role="presentation" width="14.857142857142858" height="16" viewBox="0 0 1664 1792" class="fa-icon"><path d="M1639 478q40 57 18 129l-275 906q-19 64-76.5 107.5t-122.5 43.5h-923q-77 0-148.5-53.5t-99.5-131.5q-24-67-2-127 0-4 3-27t4-37q1-8-3-21.5t-3-19.5q2-11 8-21t16.5-23.5 16.5-23.5q23-38 45-91.5t30-91.5q3-10 0.5-30t-0.5-28q3-11 17-28t17-23q21-36 42-92t25-90q1-9-2.5-32t0.5-28q4-13 22-30.5t22-22.5q19-26 42.5-84.5t27.5-96.5q1-8-3-25.5t-2-26.5q2-8 9-18t18-23 17-21q8-12 16.5-30.5t15-35 16-36 19.5-32 26.5-23.5 36-11.5 47.5 5.5l-1 3q38-9 51-9h761q74 0 114 56t18 130l-274 906q-36 119-71.5 153.5t-128.5 34.5h-869q-27 0-38 15-11 16-1 43 24 70 144 70h923q29 0 56-15.5t35-41.5l300-987q7-22 5-57 38 15 59 43zM575 480q-4 13 2 22.5t20 9.5h608q13 0 25.5-9.5t16.5-22.5l21-64q4-13-2-22.5t-20-9.5h-608q-13 0-25.5 9.5t-16.5 22.5zM492 736q-4 13 2 22.5t20 9.5h608q13 0 25.5-9.5t16.5-22.5l21-64q4-13-2-22.5t-20-9.5h-608q-13 0-25.5 9.5t-16.5 22.5z"></path>  <!----></svg>';
                  var link = str.link(doc.identifier).replace("http://www.archivesdirect.amdigital.co.uk/Documents/Details/","http://www.archivesdirect.amdigital.co.uk.officefileschina.erf.sbb.spk-berlin.de/Documents/Details/");
                  //var link = str.link(doc.identifier).replace("http://www.airitibooks.com/detail.aspx?","http://erf.sbb.spk-berlin.de/han/airiti/www.airitibooks.com/Detail/Detail?");
                  snippet +=  ' <br>'+ '<span id="link">'+ link+'</span>';
              }

          }
          else if (doc.collection=="Airiti") {
              if (doc.author!=null) {
                  snippet +=  '<b>'+'author: </b>' + doc.author; +"</br></br>"}

              if (doc.publisher!=null) {
                  snippet +=  '"</br><b>' +'edition: </b>'+ doc.publisher;}
              if (doc.publication_name!=null) {snippet +=  ','+ doc.publication_name;}
              if (doc.edition!=null) {snippet +=  ','+ doc.edition;}
              //if (doc.source!=null) {snippet +=  ' <br><b>' +'Source = </b>'+ doc.source;}
              //if (doc.issued!=null) {snippet +=  '<br><b> IssueNumber = </b>' + doc.issued;}
              if (doc.date!=null) {snippet +=  '<br><b> date: </b>' + doc.date;
                  if (doc.issued!=null) {snippet +=  '/' + doc.issued;}
              }
              if (doc.date==null) {
                  if (doc.issued!=null) {snippet += '<br><b> date: </b>' + doc.issued;}
              }

              if (doc.responsibility!=null) {
                  snippet +=  ' <br><b>' +'note: </b>'+ doc.responsibility;
              }

              if (doc.series_title!=null) { snippet += ' <br><b>' +'note: </b>'+ doc.series_title;
                  if (doc.source!=null) {snippet +=  ' ,'+ doc.source;}
              }

              if (doc.series_title==null) {
                  if (doc.source!=null) {snippet +=   ' <br><b>' +'note: </b>'+ doc.source;}
              }

              snippet +=   ' <br><b>' +'collection: </b>'+ doc.collection;

              if (doc.url!=null) {
                  var str = '<svg data-v-114fcf88="" version="1.1" role="presentation" width="14.857142857142858" height="16" viewBox="0 0 1664 1792" class="fa-icon"><path d="M1639 478q40 57 18 129l-275 906q-19 64-76.5 107.5t-122.5 43.5h-923q-77 0-148.5-53.5t-99.5-131.5q-24-67-2-127 0-4 3-27t4-37q1-8-3-21.5t-3-19.5q2-11 8-21t16.5-23.5 16.5-23.5q23-38 45-91.5t30-91.5q3-10 0.5-30t-0.5-28q3-11 17-28t17-23q21-36 42-92t25-90q1-9-2.5-32t0.5-28q4-13 22-30.5t22-22.5q19-26 42.5-84.5t27.5-96.5q1-8-3-25.5t-2-26.5q2-8 9-18t18-23 17-21q8-12 16.5-30.5t15-35 16-36 19.5-32 26.5-23.5 36-11.5 47.5 5.5l-1 3q38-9 51-9h761q74 0 114 56t18 130l-274 906q-36 119-71.5 153.5t-128.5 34.5h-869q-27 0-38 15-11 16-1 43 24 70 144 70h923q29 0 56-15.5t35-41.5l300-987q7-22 5-57 38 15 59 43zM575 480q-4 13 2 22.5t20 9.5h608q13 0 25.5-9.5t16.5-22.5l21-64q4-13-2-22.5t-20-9.5h-608q-13 0-25.5 9.5t-16.5 22.5zM492 736q-4 13 2 22.5t20 9.5h608q13 0 25.5-9.5t16.5-22.5l21-64q4-13-2-22.5t-20-9.5h-608q-13 0-25.5 9.5t-16.5 22.5z"></path>  <!----></svg>';
                  var link = str.link(doc.url);
                  snippet +=  ' <br>'+ '<span id="link">'+ link+'</span>';
              }

              if (doc.identifier!=null) {
                  var str = '<svg data-v-114fcf88="" version="1.1" role="presentation" width="14.857142857142858" height="16" viewBox="0 0 1664 1792" class="fa-icon"><path d="M1639 478q40 57 18 129l-275 906q-19 64-76.5 107.5t-122.5 43.5h-923q-77 0-148.5-53.5t-99.5-131.5q-24-67-2-127 0-4 3-27t4-37q1-8-3-21.5t-3-19.5q2-11 8-21t16.5-23.5 16.5-23.5q23-38 45-91.5t30-91.5q3-10 0.5-30t-0.5-28q3-11 17-28t17-23q21-36 42-92t25-90q1-9-2.5-32t0.5-28q4-13 22-30.5t22-22.5q19-26 42.5-84.5t27.5-96.5q1-8-3-25.5t-2-26.5q2-8 9-18t18-23 17-21q8-12 16.5-30.5t15-35 16-36 19.5-32 26.5-23.5 36-11.5 47.5 5.5l-1 3q38-9 51-9h761q74 0 114 56t18 130l-274 906q-36 119-71.5 153.5t-128.5 34.5h-869q-27 0-38 15-11 16-1 43 24 70 144 70h923q29 0 56-15.5t35-41.5l300-987q7-22 5-57 38 15 59 43zM575 480q-4 13 2 22.5t20 9.5h608q13 0 25.5-9.5t16.5-22.5l21-64q4-13-2-22.5t-20-9.5h-608q-13 0-25.5 9.5t-16.5 22.5zM492 736q-4 13 2 22.5t20 9.5h608q13 0 25.5-9.5t16.5-22.5l21-64q4-13-2-22.5t-20-9.5h-608q-13 0-25.5 9.5t-16.5 22.5z"></path>  <!----></svg>';
                  var link = str.link(doc.identifier).replace("http://www.airitibooks.com/detail.aspx?","http://erf.sbb.spk-berlin.de/han/airiti/www.airitibooks.com/Detail/Detail?");
                  snippet +=  ' <br>'+ '<span id="link">'+ link+'</span>';
              }

          } else {

          }
      }
      else if (doc.hasModel=="Chapter") {
          $.when($.getJSON(url2), $.getJSON(url3)).then(function(data,data2) {
              var str = "Go to database";
              var link = str.link("http://erf.sbb.spk-berlin.de/han/fangzhiku");
              data =  $('#titles').append('<h4>'+data[0].response.docs[0].title + '.  ' + data[0].response.docs[0].date+  ', '+doc.pageStart+'-'+doc.pageEnd +' p.</h4>');
              data2 = $('#titles').append(doc.title);
              data2 += $('#titles').append('</br>'+'<p id="link">' + link + '</p>');
              data2 += $('#titles').append('<br>'+doc.score);
              //var output = '<div><h4>'  + doc.id + '</h4>';
              //if (doc.title!=null) {snippet +=  doc.title;}
          });
          var output = '<div><span><span id="titles"></span>';
      }
      else {
          if (doc.id!=null) { snippet += doc.id+cur_doc_highlighting_txt;}
      }


    output += '<span>' + snippet + '</span></div>';
    return output;
  },

    isBlank: function(str) {
        return (!str || /^\s*$/.test(str));
    },

  init: function () {
    $(document).on('click', 'a.more', function () {
      var $this = $(this),
          span = $this.parent().find('span');

      if (span.is(':visible')) {
        span.hide();
        $this.text('more');
      }
      else {
        span.show();
        $this.text('less');
      }

      return false;
    });
  }
});

})(jQuery);