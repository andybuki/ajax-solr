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
                            $('<a target="_blank" href="#"></a>')
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
            //var collections = $(this.manager.solrUrl);
            //var col = collections.selector;
            if (this.no_init_results) {
                if ((this.manager.store.get('q').value == '*:*') &&
                    (this.manager.store.values('fq').length <= 0)) {
                    return;
                } //Added so initial *:* query doesn't show results
            }
            for (var i = 0, l = this.manager.response.response.docs.length; i < l; i++) {
                var doc = this.manager.response.response.docs[i];

                if (this.manager.response.highlighting && this.manager.response.highlighting[doc.id]
                        [this.manager.response.responseHeader.params['hl.fl']]) {
                    // display this.manager.response.highlighting[doc.id]
                    [this.manager.response.responseHeader.params['hl.fl']]
                }
                else {
                    // display result without highlighting
                }

                $(this.target).append(this.template(doc,this.manager.response.highlighting));
                var items = [];
               
            }
        },

        getDocSnippets: function(highlighting, doc) {
            var id_val = doc['id']; //Change if your documents have different ID field name
            //var cur_doc_highlighting_title = highlighting[id_val].text;
            var cur_doc_highlighting_title = highlighting[id_val];
            var all_snippets_arr = [];
            if (typeof cur_doc_highlighting_title != 'undefined') {
                for (var snip_k in cur_doc_highlighting_title) {
                    var cur_snippets = cur_doc_highlighting_title[snip_k];
                    for (var snip_i=0; snip_i < cur_snippets.length; snip_i++) {
                        var cur_snippet_txt = cur_snippets[snip_i];
                        all_snippets_arr.push(cur_snippet_txt);
                    }
                }
            }
            var cur_doc_snippets_txt =  all_snippets_arr.join('');
            console.log(cur_doc_snippets_txt.length)
            return(cur_doc_snippets_txt);
        },


    template: function (doc,highlighting) {
            var snippet = '';
            var snippet_loc_gaz = '';
            var snippet_ad_me = '';
            var snippet_xuxiu = '';
            var snippet_pacific = '';
            var snippet_trade = '';
            var snippet_airiti = '';
            var snippet_meiji = '';
            var snippet_rmrb = '';
            var snippet_cnki = '';

            var cur_doc_highlighting_title;
            var cur_doc_highlighting_title;
            if (this.highlighting && highlighting) {
                cur_doc_highlighting_title = this.getDocSnippets(highlighting,doc);
            }

            var output2 =doc.book_id;
            var url =  this.manager.solrUrl+"select?fq=hasModel:Book&q=hasModel:Book%20and%20book_id:"+output2+"&wt=json&json.wrf=?&callback=?";
            var url2 = this.manager.solrUrl+"select?fq=book_id="+doc.page_id+"&q=hasModel:Page&wt=json&json.wrf=?&callback=?";
            var str = '<svg data-v-114fcf88="" version="1.1" role="presentation" width="13.714285714285714" height="16" viewBox="0 0 1536 1792" class="fa-icon"><path d="M768 768q237 0 443-43t325-127v170q0 69-103 128t-280 93.5-385 34.5-385-34.5-280-93.5-103-128v-170q119 84 325 127t443 43zM768 1536q237 0 443-43t325-127v170q0 69-103 128t-280 93.5-385 34.5-385-34.5-280-93.5-103-128v-170q119 84 325 127t443 43zM768 1152q237 0 443-43t325-127v170q0 69-103 128t-280 93.5-385 34.5-385-34.5-280-93.5-103-128v-170q119 84 325 127t443 43zM768 0q208 0 385 34.5t280 93.5 103 128v128q0 69-103 128t-280 93.5-385 34.5-385-34.5-280-93.5-103-128v-128q0-69 103-128t280-93.5 385-34.5z"></path>';
            var str2 = '<svg data-v-114fcf88="" version="1.1" role="presentation" width="14.857142857142858" height="16" viewBox="0 0 1664 1792" class="fa-icon"><path d="M1639 478q40 57 18 129l-275 906q-19 64-76.5 107.5t-122.5 43.5h-923q-77 0-148.5-53.5t-99.5-131.5q-24-67-2-127 0-4 3-27t4-37q1-8-3-21.5t-3-19.5q2-11 8-21t16.5-23.5 16.5-23.5q23-38 45-91.5t30-91.5q3-10 0.5-30t-0.5-28q3-11 17-28t17-23q21-36 42-92t25-90q1-9-2.5-32t0.5-28q4-13 22-30.5t22-22.5q19-26 42.5-84.5t27.5-96.5q1-8-3-25.5t-2-26.5q2-8 9-18t18-23 17-21q8-12 16.5-30.5t15-35 16-36 19.5-32 26.5-23.5 36-11.5 47.5 5.5l-1 3q38-9 51-9h761q74 0 114 56t18 130l-274 906q-36 119-71.5 153.5t-128.5 34.5h-869q-27 0-38 15-11 16-1 43 24 70 144 70h923q29 0 56-15.5t35-41.5l300-987q7-22 5-57 38 15 59 43zM575 480q-4 13 2 22.5t20 9.5h608q13 0 25.5-9.5t16.5-22.5l21-64q4-13-2-22.5t-20-9.5h-608q-13 0-25.5 9.5t-16.5 22.5zM492 736q-4 13 2 22.5t20 9.5h608q13 0 25.5-9.5t16.5-22.5l21-64q4-13-2-22.5t-20-9.5h-608q-13 0-25.5 9.5t-16.5 22.5z"></path>  <!----></svg>';
            var titles = "";
            var titles2 = "";
            var data="";
            var output="";
            var data2="";
            var data_ad_me_pages ="";
            var data_loc_gaz_pages ="";
            var data_xuxiu_pages ="";
            var data_pacific_pages ="";
            var data_trade_pages ="";
            var data_airiti_pages ="";
            var data_loc_gaz_chapter ="";
            var data_cnki_pages ="";

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
                $.when($.getJSON(url), $.getJSON(url2)).then(function(data,data2){
                    if (data[0].response.docs[0].collection=="Local Gazetteer"){
                        if (data[0].response.docs[0].date!=null && data[0].response.docs[0].issued!=null) {
                            data_loc_gaz_pages = $('#titles').append('<h4>' + data[0].response.docs[0].title + " ," + data[0].response.docs[0].author + '.  ' + data[0].response.docs[0].date +'/'+ data[0].response.docs[0].issued + ',  p.' + doc.position + '</h4>');
                        } else if (data[0].response.docs[0].date!=null) {
                            data_loc_gaz_pages = $('#titles').append('<h4>' + data[0].response.docs[0].title + " ," + data[0].response.docs[0].author + '.  ' + data[0].response.docs[0].date  + ',  p.' + doc.position + '</h4>');
                        } else {
                            data_loc_gaz_pages =  $('#titles').append('<h4>'+ data[0].response.docs[0].title + " ,"+ data[0].response.docs[0].author +'.  ' +  ',  p.'+doc.position+'</h4>');
                        }

                        var link = str.link("http://erf.sbb.spk-berlin.de/han/fangzhiku/");
                        $('a[href^="http://"]')
                            .attr('target','_blank');
                        if (doc.text!=null) {
                                if (cur_doc_highlighting_title=='') {
                                    data_loc_gaz_pages += $('#titles').append(doc.text +"...");
                                }else {
                                    data_loc_gaz_pages += $('#titles').append(cur_doc_highlighting_title+"...");
                                }
                        }
                        data_loc_gaz_pages += $('#titles').append('</br>' +'<b>collection:</b> '+ doc.collection);
                        data_loc_gaz_pages += $('#titles').append('</br>'+'<span id="link">' + link + '</span>');
                        data_loc_gaz_pages += $('#titles').append('<br><small><b>score:</b>'+doc.score +'</small>');
                        output += '<span>' + data_loc_gaz_pages + '</span></div>';
                    }
                    else if (data[0].response.docs[0].collection=="Adam Matthew FO China"){
                        var link = str2.link(doc.image_url).replace("http://www.archivesdirect.amdigital.co.uk/Documents/Images/","http://www.archivesdirect.amdigital.co.uk.officefileschina.erf.sbb.spk-berlin.de/Documents/Images/");
                        $('a[href^="http://"]')
                            .attr('target','_blank');
                        if (data[0].response.docs[0].date!=null && data[0].response.docs[0].issued!=null) {
                            data_ad_me_pages =  $('#titles').append('<h4>'+ data[0].response.docs[0].title + '.  ' + data[0].response.docs[0].date +'/'+ data[0].response.docs[0].issued +  ',  p.'+doc.position+'</h4>');
                        } else if (data[0].response.docs[0].date!=null) {
                            data_ad_me_pages =  $('#titles').append('<h4>'+ data[0].response.docs[0].title + '.  ' + data[0].response.docs[0].date +  ',  p.'+doc.position+'</h4>');
                        } else {
                            data_ad_me_pages =  $('#titles').append('<h4>'+ data[0].response.docs[0].title + '.  ' + ',  p.'+doc.position+'</h4>');
                        }

                        if (doc.text!=null) {
                                if (cur_doc_highlighting_title=='') {
                                    data_ad_me_pages += $('#titles').append(doc.text+"...");
                                } else {
                                    var firstvariable = "<font style=\"background:#FFFF99\">";
                                    var secondvariable = "<\/font>";
                                    console.log(cur_doc_highlighting_title.length);
                                    console.log("1"+cur_doc_highlighting_title);
                                    console.log("2"+cur_doc_highlighting_title.match(new RegExp(firstvariable + "(\w+)" + secondvariable)));

                                    //data_ad_me_pages += $('#titles').append(cur_doc_highlighting_title.match(new RegExp(firstvariable + "(\w+)" + secondvariable)));
                                    data_ad_me_pages += $('#titles').append(cur_doc_highlighting_title);
                                }
                        }
                        data_ad_me_pages += $('#titles').append('</br>' +'<b>collection:</b> '+ doc.collection);
                        data_ad_me_pages += $('#titles').append('</br>'+'<span id="link">' + link + '</span>');
                        data_ad_me_pages += $('#titles').append('<br><small><b>score:</b>'+doc.score +'</small>');
                        output += '<span>' + data_ad_me_pages + '</span></div>';
                    }
                    else if (data[0].response.docs[0].collection=="Adam Matthew - China America Pacific") {
                        var link = str.link(doc.image_url).replace("http://www.archivesdirect.amdigital.co.uk/Documents/Images/","http://www.archivesdirect.amdigital.co.uk.officefileschina.erf.sbb.spk-berlin.de/Documents/Images/");
                        $('a[href^="http://"]')
                            .attr('target','_blank');
                        if (data[0].response.docs[0].date!=null && data[0].response.docs[0].issued!=null) {
                            data_pacific_pages =  $('#titles').append('<h4>'+ data[0].response.docs[0].title + '.  ' + data[0].response.docs[0].date+'/'+ data[0].response.docs[0].issued+  ',  p.'+doc.position+'</h4>');
                        } else if (data[0].response.docs[0].date!=null) {
                            data_pacific_pages =  $('#titles').append('<h4>'+ data[0].response.docs[0].title + '.  ' + data[0].response.docs[0].date+  ',  p.'+doc.position+'</h4>');
                        } else {
                            data_pacific_pages =  $('#titles').append('<h4>'+ data[0].response.docs[0].title + '.  ' + ',  p.'+doc.position+'</h4>');
                        }

                        if (doc.text!=null) {
                            if (cur_doc_highlighting_title=='') {
                                    data_pacific_pages += $('#titles').append(doc.text+"...");
                            } else {
                                    data_pacific_pages += $('#titles').append(cur_doc_highlighting_title+"...");
                            }
                        }
                        data_pacific_pages += $('#titles').append('</br>' +'<b>collection:</b> '+ doc.collection);
                        data_pacific_pages += $('#titles').append('</br>'+'<span id="link">' + link + '</span>');
                        data_pacific_pages += $('#titles').append('<br><small><b>score:</b>'+doc.score +'</small>');

                        output += '<span>' + data_pacific_pages + '</span></div>';
                    }
                    else if (data[0].response.docs[0].collection=="Adam Matthew - China Trade & Politics") {
                        var link = str.link(doc.image_url).replace("http://www.archivesdirect.amdigital.co.uk/Documents/Images/","http://www.archivesdirect.amdigital.co.uk.officefileschina.erf.sbb.spk-berlin.de/Documents/Images/");
                        $('a[href^="http://"]')
                            .attr('target','_blank');
                        if (data[0].response.docs[0].date!=null && data[0].response.docs[0].issued!=null) {
                            data_trade_pages =  $('#titles').append('<h4>'+ data[0].response.docs[0].title + '.  ' + data[0].response.docs[0].date+'/'+ data[0].response.docs[0].issued+ ',  p.'+doc.position+'</h4>');
                        } else if (data[0].response.docs[0].date!=null) {
                            data_trade_pages =  $('#titles').append('<h4>'+ data[0].response.docs[0].title + '.  ' + data[0].response.docs[0].date+ ',  p.'+doc.position+'</h4>');
                        } else {
                            data_trade_pages =  $('#titles').append('<h4>'+ data[0].response.docs[0].title + '.  ' + ',  p.'+doc.position+'</h4>');
                        }

                        if (doc.text!=null) {
                            if (cur_doc_highlighting_title == '') {
                                data_trade_pages += $('#titles').append(doc.text + "...");
                            } else {
                                data_trade_pages += $('#titles').append(cur_doc_highlighting_title + "...");
                            }
                        }
                        data_trade_pages += $('#titles').append('</br>' +'<b>collection:</b> '+ doc.collection);
                        data_trade_pages += $('#titles').append('</br>'+'<span id="link">' + link + '</span>');
                        data_trade_pages += $('#titles').append('<br><small><b>score:</b>'+doc.score +'</small>');
                        output += '<span>' + data_trade_pages + '</span></div>';
                    }
                    /*else if (data[0].response.docs[0].collection=="Adam Matthew - Meiji Japan") {
                        var str = '<svg data-v-114fcf88="" version="1.1" role="presentation" width="14.857142857142858" height="16" viewBox="0 0 1664 1792" class="fa-icon"><path d="M1639 478q40 57 18 129l-275 906q-19 64-76.5 107.5t-122.5 43.5h-923q-77 0-148.5-53.5t-99.5-131.5q-24-67-2-127 0-4 3-27t4-37q1-8-3-21.5t-3-19.5q2-11 8-21t16.5-23.5 16.5-23.5q23-38 45-91.5t30-91.5q3-10 0.5-30t-0.5-28q3-11 17-28t17-23q21-36 42-92t25-90q1-9-2.5-32t0.5-28q4-13 22-30.5t22-22.5q19-26 42.5-84.5t27.5-96.5q1-8-3-25.5t-2-26.5q2-8 9-18t18-23 17-21q8-12 16.5-30.5t15-35 16-36 19.5-32 26.5-23.5 36-11.5 47.5 5.5l-1 3q38-9 51-9h761q74 0 114 56t18 130l-274 906q-36 119-71.5 153.5t-128.5 34.5h-869q-27 0-38 15-11 16-1 43 24 70 144 70h923q29 0 56-15.5t35-41.5l300-987q7-22 5-57 38 15 59 43zM575 480q-4 13 2 22.5t20 9.5h608q13 0 25.5-9.5t16.5-22.5l21-64q4-13-2-22.5t-20-9.5h-608q-13 0-25.5 9.5t-16.5 22.5zM492 736q-4 13 2 22.5t20 9.5h608q13 0 25.5-9.5t16.5-22.5l21-64q4-13-2-22.5t-20-9.5h-608q-13 0-25.5 9.5t-16.5 22.5z"></path>  <!----></svg>';
                        var link = str.link(doc.image_url).replace("http://www.archivesdirect.amdigital.co.uk/Documents/Images/","http://www.archivesdirect.amdigital.co.uk.officefileschina.erf.sbb.spk-berlin.de/Documents/Images/");
                        $('a[href^="http://"]')
                            .attr('target','_blank');
                        if (data[0].response.docs[0].date!=null) {
                            data =  $('#titles').append('<h4>'+ data[0].response.docs[0].title + '.  ' + data[0].response.docs[0].date+  ',  p.'+doc.position+'</h4>');

                        } else {
                            data =  $('#titles').append('<h4>'+ data[0].response.docs[0].title + '.  ' + ',  p.'+doc.position+'</h4>');
                        }
                        if (doc.text && doc.text.length > 300) {
                            if (doc.text!=null) {
                                if (cur_doc_highlighting_title=='') {
                                    data2 += $('#titles').append(doc.text.substring(0, 300));
                                    data2 += $('#titles').append('<span style="display:none;">' + doc.text.substring(300));
                                } else {
                                    data2 += $('#titles').append(cur_doc_highlighting_title.substring(0, 300));
                                    data2 += $('#titles').append('<span style="display:none;">' + cur_doc_highlighting_title.substring(300));
                                }
                                data2 += $('#titles').append('</span> <a href="#" class="more"> ... more</a>');
                                data2 += $('#titles').append('</br>' +'collection: '+ doc.collection);
                                data2 += $('#titles').append('</br>'+'<span id="link">' + link + '</span>');
                                data2 += $('#titles').append('<br><small><b>score:</b>'+doc.score +'</small>');
                            }
                        } else {
                            if (cur_doc_highlighting_title=='') {
                                data2 = $('#titles').append(doc.text);
                            } else {
                                data2 = $('#titles').append(cur_doc_highlighting_title);
                            }
                            data2 += $('#titles').append('</br>' +'collection: '+ doc.collection);
                            data2 += $('#titles').append('</br>'+'<span id="link">' + link + '</span>');
                            data2 += $('#titles').append('<br><small><b>score:</b>'+doc.score +'</small>');
                        }
                    }*/
                    else if (data[0].response.docs[0].collection=="Airiti") {
                        var page = parseInt(doc.position);
                        var combineLink = '&GoToPage='+page;
                        var link2 = (data[0].response.docs[0].identifier).toString();
                        var newLink=link2.replace('http://www.airitibooks.com/detail.aspx?','http://www.airitibooks.com.airiti.erf.sbb.spk-berlin.de/pdfViewer/index.aspx?');
                        $('a[href^="http://"]')
                            .attr('target','_blank');
                        var link = str2.link(newLink+combineLink);

                        data_airiti_pages =  $('#titles').append('<h4>'+ data[0].response.docs[0].title + '.  ' + data[0].response.docs[0].date+  ',  p.'+doc.position+'</h4>');

                        if (doc.text!=null) {
                            if (cur_doc_highlighting_title=='') {
                                    data_airiti_pages += $('#titles').append(doc.text+"...");
                            } else {
                                    data_airiti_pages += $('#titles').append(cur_doc_highlighting_title+"...");
                            }
                        }

                        data_airiti_pages += $('#titles').append('</br>' +'<b>collection:</b> '+ doc.collection);
                        data_airiti_pages += $('#titles').append('</br>'+'<span id="link">' + link + '</span>');
                        data_airiti_pages += $('#titles').append('<br><small><b>score:</b>'+doc.score +'</small>');
                        output += '<span>' + data_airiti_pages + '</span></div>';
                    }
                    else if(data[0].response.docs[0].collection=="Xuxiu") {
                        var vor_link1 = (data[0].response.docs[0].identifier[0]);
                        var vor_link2 = (data[0].response.docs[0].identifier[1]);
                        $('a[href^="http://"]')
                            .attr('target','_blank');
                        var http="type=\"CrossAsia Link\" http://erf.sbb.spk-berlin.de/han/xuxiu/hunteq.com/ancientc/ancientkm?!!";
                        if (vor_link1.includes(http)) {
                            var link_replace = vor_link1.replace("type=\"CrossAsia Link\" ","");
                            var link5 = str.link(link_replace);
                        } else {
                            var link_replace = vor_link2.replace("type=\"CrossAsia Link\" ","");
                            var link5 = str2.link(link_replace);
                        }
                        data_xuxiu_pages =  $('#titles').append('<h4>'+ data[0].response.docs[0].title + '.  ' + data[0].response.docs[0].issued+   ',  p.'+doc.position+'</h4>');

                        if (doc.text!=null) {
                            if (cur_doc_highlighting_title=='') {
                                data_xuxiu_pages += $('#titles').append(doc.text+"...");
                            }
                            else {
                                data_xuxiu_pages += $('#titles').append(cur_doc_highlighting_title+"...");
                            }
                            data_xuxiu_pages += $('#titles').append('</br>' +'<b>collection:</b> '+ doc.collection);
                            data_xuxiu_pages += $('#titles').append(' <br>'+ '<span id="link">'+ link5+'</span>');
                            data_xuxiu_pages += $('#titles').append('<br><small><b>score:</b>'+doc.score +'</small>');

                        }
                        output += '<span>' + data_xuxiu_pages + '</span></div>';
                    }
                    else if(data[0].response.docs[0].collection=="CNKI_eBooks") {
                        var vor_link = (data[0].response.docs[0].identifier[1]);
                        var link100 = str2.link(vor_link.replace("Detail","OnlineView")+"?page="+doc.position);
                        $('a[href^="http://"]')
                            .attr('target','_blank');

                        if (data[0].response.docs[0].date!=null && data[0].response.docs[0].issued!=null) {
                            data_cnki_pages =  $('#titles').append('<h4>'+ data[0].response.docs[0].title + '.  ' +  data[0].response.docs[0].date+'/'+ data[0].response.docs[0].issued+ ',  p.'+doc.position+'</h4>');
                        } else if (data[0].response.docs[0].date!=null) {
                            data_cnki_pages =  $('#titles').append('<h4>'+ data[0].response.docs[0].title + '.  ' + data[0].response.docs[0].date+  ',  p.'+doc.position+'</h4>');
                        } else {
                            data_cnki_pages =  $('#titles').append('<h4>'+ data[0].response.docs[0].title + '.  ' +   ',  p.'+doc.position+'</h4>');
                        }

                        if (doc.text!=null) {
                            if (cur_doc_highlighting_title=='') {
                                data_cnki_pages += $('#titles').append(doc.text+"...");
                            }
                            else {
                                data_cnki_pages += $('#titles').append(cur_doc_highlighting_title+"...");
                            }
                            data_cnki_pages += $('#titles').append('</br>' +'<b>collection:</b> '+ doc.collection);
                            data_cnki_pages += $('#titles').append(' <br>'+ '<span id="link">'+ link100+'</span>');
                            data_cnki_pages += $('#titles').append('<br><small><b>score:</b>'+doc.score +'</small>');
                        }
                        output += '<span>' + data_xuxiu_pages + '</span></div>';
                    }
                    else {
                        data =  $('#titles').append('<h4>'+
                            data[0].response.docs[0].title + '.  ' +  ',  p.'+doc.position+'</h4>');
                    }
                });
                output += '<div><span><span id="titles"></span></br>';
            }
            else if (doc.hasModel=='Article') {
                var rightDate = moment(doc.wholeDate.toString()).format("DD.MM.YYYY");
                if (cur_doc_highlighting_title=='') {
                    var output = '<div><h4>'  +"Title: "+ doc.title + ",  p."+doc.page+'</h4>';
                } else {
                    var output = '<div><h4>'  +"Title: "+ doc.title + ",  p."+doc.page+'</h4>';
                }

                $('a[href^="http://"]')
                    .attr('target','_blank');
                var link = str.link("http://erf.sbb.spk-berlin.de/han/RenminRibao1/");
                    if (doc.author!==undefined) {
                        snippet_rmrb += ("<b>author:</b>"+doc.author+"<br>");
                    }
                snippet_rmrb += ("<b>date:</b>"+rightDate+"</br>");
                    if (doc.description!==undefined) {
                        snippet_rmrb += ("<b>note:</b>" + doc.description + "<br>");
                    }
                snippet_rmrb += ("<b>collection:</b> "+doc.collection+"<br>");
                    if (cur_doc_highlighting_title=='') {
                        snippet_rmrb += (doc.text +"..."+' <br>');
                    } else {
                        snippet_rmrb += (' <br>' +cur_doc_highlighting_title+"..."+' <br>');
                    }
                snippet_rmrb += ('<br>'+'<span id="link">' + link + "</span>");
                snippet_rmrb += ('<br><small><b>score:</b>'+doc.score +'</small>');
                output += '<span>' + snippet_rmrb + '</span></div>';

            }
            else if (doc.hasModel=='Book') {
                if (doc.responsibility!==undefined) {
                    if  (cur_doc_highlighting_title=='') {
                        var output = '<div><h4>Title: ' + doc.title + ", " + doc.responsibility + '</h4>';
                    } else {
                        var output = '<div><h4>Title: ' + cur_doc_highlighting_title + ", " + doc.responsibility + '</h4>';
                    }

                }else {
                    if  (cur_doc_highlighting_title=='') {
                        var output = '<div><h4>Title: ' + doc.title + '</h4>';
                    }else {
                        var output = '<div><h4>Title: ' + cur_doc_highlighting_title + '</h4>';
                    }
                }

                if (doc.collection=="Local Gazetteer"){
                    if (doc.author!=null) {
                        snippet_loc_gaz +=  '<b>'+'author: </b>' + doc.author; +'<br>'}

                    if (doc.publisher!=null) {snippet_loc_gaz +=  ' <b>' +'publisher: </b>'+ doc.publisher;}

                    if (doc.publication_name!=null) {snippet_loc_gaz +=  ','+ doc.publication_name;}

                    if (doc.edition!==undefined) {snippet_loc_gaz +=  '<br><b> edition: </b>' + doc.edition;}

                    if (doc.date!=null) {snippet_loc_gaz +=  '<br><b> date: </b>' + doc.date;
                        if (doc.issued!=null) {snippet_loc_gaz +=  '/' + doc.issued;}
                    }

                    if (doc.date==null) {
                        if (doc.issued!=null) {snippet_loc_gaz += '<br><b> Date = </b>' + doc.issued;}
                    }

                    if (doc.series_title!=null) { snippet_loc_gaz += ' <br><b>' +'series: </b>'+ doc.series_title;
                        if (doc.source!=null) {snippet_loc_gaz +=  ' ,'+ doc.source;}
                    }

                    if (doc.series_title==null) {
                        if (doc.source!=null) {snippet_loc_gaz +=   ' <br><b>' +'note: </b>'+ doc.source;}
                    }

                    snippet_loc_gaz +=   ' <br>' +'<b>collection:</b> '+ doc.collection;
                    snippet_loc_gaz += '<br><small><b>score:</b>'+doc.score +'</small>';

                    if (doc.identifier!=null) {
                        var link = str.link("http://erf.sbb.spk-berlin.de/han/fangzhiku");
                        $('a[href^="http://"]')
                            .attr('target','_blank');
                        snippet_loc_gaz +=  ' <br>'+ '<span id="link">'+ link+'</span>';
                    }

                    output += '<span>' + snippet_loc_gaz + '</span></div>';

                }
                else if (doc.collection=="Xuxiu") {
                    if (doc.author!=null) {snippet_xuxiu +=  '<b>'+'author: </b>' + doc.author; +'<br>'}
                    if (doc.publisher!=null) {snippet_xuxiu +=  ' <b>' +'edition: </b>'+ doc.publisher;}
                    if (doc.publication_name!=null) {snippet_xuxiu +=  ','+ doc.publication_name;}
                    if (doc.edition!=null) {snippet_xuxiu +=  ','+ doc.edition;}
                    if (doc.date!=null) {snippet_xuxiu +=  '<br><b> date: </b>' + doc.date;
                        if (doc.issued!=null) {snippet_xuxiu +=  '/' + doc.issued;}
                    }
                    if (doc.date==null) {
                        if (doc.issued!=null) {snippet_xuxiu += '<br><b> date: </b>' + doc.issued;}
                    }
                    if (doc.series_title!=null) { snippet_xuxiu += ' <br><b>' +'note: </b>'+ doc.series_title;
                        if (doc.source!=null) {snippet_xuxiu +=  ' ,'+ doc.source;}
                    }
                    if (doc.series_title==null) {
                        if (doc.source!=null) {snippet_xuxiu +=   ' <br><b>' +'note: </b>'+ doc.source;}
                    }
                    snippet_xuxiu +=   ' <br>' +'<b>collection:</b> '+ doc.collection;
                    snippet_xuxiu += '<br><small><b>score:</b>'+doc.score +'</small>';

                    if (doc.identifier!=null) {
                        $('a[href^="http://"]')
                            .attr('target','_blank');
                        var vor_link1 = doc.identifier[0];
                        var vor_link2 = doc.identifier[1];
                        var http="type=\"CrossAsia Link\" http://erf.sbb.spk-berlin.de/han/xuxiu/hunteq.com/ancientc/ancientkm?!!";
                        if (vor_link1.includes(http)) {
                            var link_replace = vor_link1.replace("type=\"CrossAsia Link\" ","");
                            var link = str2.link(link_replace);
                            snippet_xuxiu +=  ' <br>'+ '<span id="link">'+ link+'</span>';
                        } else if (vor_link2.includes(http)) {
                            var link_replace = vor_link2.replace("type=\"CrossAsia Link\" ","");
                            var link = str2.link(link_replace);
                            snippet_xuxiu +=  ' <br>'+ '<span id="link">'+ link+'</span>';
                        }
                    }
                    output += '<span>' + snippet_xuxiu + '</span></div>';

                }
                else if (doc.collection=="Adam Matthew FO China") {
                    if (doc.author!=null) {snippet_ad_me +=  '<b>'+'author: </b>' + doc.author; +'<br>'}
                    if (doc.publisher!=null) {snippet_ad_me +=  ' <b>' +'edition: </b>'+ doc.publisher;}
                    if (doc.publication_name!=null) {snippet_ad_me +=  ','+ doc.publication_name;}
                    if (doc.edition!=null) {snippet_ad_me +=  ','+ doc.edition;}
                    if (doc.date!=null) {snippet_ad_me +=  '<br><b> date: </b>' + doc.date;
                        if (doc.issued!=null) {snippet_ad_me +=  '/' + doc.issued;}
                    }
                    if (doc.date==null) {
                        if (doc.issued!=null) {snippet_ad_me += '<br><b> date: </b>' + doc.issued;}
                    }

                    if (doc.responsibility!=null) {snippet_ad_me +=  ' <br><b>' +'note: </b>'+ doc.responsibility;}

                    if (doc.series_title!=null) { snippet_ad_me += ' <br><b>' +'note: </b>'+ doc.series_title;
                        if (doc.source!=null) {snippet_ad_me +=  ' ,'+ doc.source;}
                    }

                    if (doc.series_title==null) {
                        if (doc.source!=null) {snippet_ad_me +=   ' <br><b>' +'note: </b>'+ doc.source;}
                    }

                    snippet_ad_me +=   ' <br>' +'<b>collection:</b> '+ doc.collection;
                    snippet_ad_me += '<br><small><b>score:</b>'+doc.score +'</small>';

                    if (doc.identifier!=null) {
                        var link = str2.link(doc.identifier).replace("http://www.archivesdirect.amdigital.co.uk/Documents/Details/","http://www.archivesdirect.amdigital.co.uk.officefileschina.erf.sbb.spk-berlin.de/Documents/Details/");
                        $('a[href^="http://"]')
                            .attr('target','_blank');
                        snippet_ad_me +=  ' <br>'+ '<span id="link">'+ link+'</span>';
                    }
                    output += '<span>' + snippet_ad_me + '</span></div>';
                }
                else if (doc.collection=="Adam Matthew - China America Pacific") {

                    if (doc.author!=null) {snippet_pacific +=  '<b>'+'author: </b>' + doc.author;}

                    if (doc.author!=null) {
                        if (doc.publication_name != null) {
                            snippet_pacific += ',' + doc.publication_name;
                        }
                    }

                    if (doc.author==null) {
                        if (doc.publication_name != null) {
                            snippet_pacific +=','  + doc.publication_name;
                        }
                    }

                    if (doc.edition!=null) {
                        if (doc.publisher!=null) {
                            snippet_pacific += ' <b>' + 'edition: </b>' + doc.publisher, doc.edition;
                        }
                    }
                    if (doc.edition == null) {
                        if (doc.publisher!=null) {
                            snippet_pacific += ' <b>' + 'edition: </b>' + doc.publisher;
                        }
                    }

                    if (doc.date!=null) {snippet_pacific +=  '<br><b> date: </b>' + doc.date;
                        if (doc.issued!=null) {snippet_pacific +=  '/' + doc.issued;}
                    }
                    if (doc.date==null) {
                        if (doc.issued!=null) {snippet_pacific += '<br><b> date: </b>' + doc.issued;}
                    }

                    //if (doc.responsibility!=null) {snippet_pacific +=  ' <br><b>' +'note: </b>'+ doc.responsibility;}

                    if (doc.series_title!=null) { snippet_pacific += ' <br><b>' +'note: </b>'+ doc.series_title;
                        if (doc.source!=null) {snippet_pacific +=  ' ,'+ doc.source;}
                    }

                    if (doc.series_title==null) {
                        if (doc.source!=null) {snippet_pacific +=   ' <br><b>' +'note: </b>'+ doc.source;}
                    }

                    snippet_pacific +=   ' <br>' +'<b>collection:</b> '+ doc.collection;
                    snippet_pacific += '<br><small><b>score:</b>'+doc.score +'</small>';

                    if (doc.identifier!=null) {
                        var link = str2.link(doc.identifier).replace("http://www.archivesdirect.amdigital.co.uk/Documents/Details/","http://www.archivesdirect.amdigital.co.uk.officefileschina.erf.sbb.spk-berlin.de/Documents/Details/");
                        $('a[href^="http://"]')
                            .attr('target','_blank');
                        snippet_pacific +=  ' <br>'+ '<span id="link">'+ link+'</span>';
                    }
                    output += '<span>' + snippet_pacific + '</span></div>';

                }
                else if (doc.collection=="Adam Matthew - China Trade & Politics") {
                    if (doc.author!=null) {snippet_trade +=  '<b>'+'author: </b>' + doc.author; }
                    if (doc.publisher!=null) {snippet_trade +=  ' <b>' +'edition: </b>'+ doc.publisher;}
                    if (doc.publication_name!=null) {snippet_trade +=  ','+ doc.publication_name;}
                    if (doc.edition!=null) {snippet_trade +=  ' <b>' +'edition: </b>'+ doc.edition;}
                    if (doc.date!=null) {snippet_trade +=  '<br><b> date: </b>' + doc.date;
                        if (doc.issued!=null) {snippet_trade +=  '/' + doc.issued;}
                    }
                    if (doc.date==null) {
                        if (doc.issued!=null) {snippet_trade += '<br><b> date: </b>' + doc.issued;}
                    }

                    if (doc.responsibility!=null) {snippet_trade +=  ' <br><b>' +'note: </b>'+ doc.responsibility;}

                    if (doc.series_title!=null) { snippet_trade += ' <br><b>' +'note: </b>'+ doc.series_title;
                        if (doc.source!=null) {snippet_trade +=  ' ,'+ doc.source;}
                    }

                    if (doc.series_title==null) {
                        if (doc.source!=null) {snippet_trade +=   ' <br><b>' +'note: </b>'+ doc.source;}
                    }

                    snippet_trade +=   ' <br>' +'<b>collection:</b> '+ doc.collection;
                    snippet_trade += '<br><small><b>score:</b>'+doc.score +'</small>';

                    if (doc.identifier!=null) {
                        var link = str2.link(doc.identifier).replace("http://www.archivesdirect.amdigital.co.uk/Documents/Details/","http://www.archivesdirect.amdigital.co.uk.officefileschina.erf.sbb.spk-berlin.de/Documents/Details/");
                        $('a[href^="http://"]')
                            .attr('target','_blank');
                        snippet_trade +=  ' <br>'+ '<span id="link">'+ link+'</span>';
                    }
                    output += '<span>' + snippet_trade + '</span></div>';
                }
                else if (doc.collection=="Adam Matthew - Meiji Japan") {
                    if (doc.author!=null) {snippet_meiji +=  '<b>'+'author: </b>' + doc.author;}
                    if (doc.publisher!=null) {snippet_meiji +=  ' <b>' +'edition: </b>'+ doc.publisher;}
                    if (doc.publication_name!=null) {snippet_meiji +=  ','+ doc.publication_name;}
                    if (doc.edition!=null) {snippet_meiji +=' <b>' +'edition: </b>'  + doc.edition;}
                    if (doc.date!=null) {snippet_meiji +=  '<br><b> date: </b>' + doc.date;
                        if (doc.issued!=null) {snippet_meiji +=  '/' + doc.issued;}
                    }
                    if (doc.date==null) {
                        if (doc.issued!=null) {snippet_meiji += '<br><b> date: </b>' + doc.issued;}
                    }
                    if (doc.responsibility!=null) {snippet_meiji +=  ' <br><b>' +'note: </b>'+ doc.responsibility;}
                    if (doc.series_title!=null) { snippet_meiji += ' <br><b>' +'note: </b>'+ doc.series_title;
                        if (doc.source!=null) {snippet_meiji +=  ' ,'+ doc.source;}
                    }
                    if (doc.medium!=null) { snippet_meiji += ' <br><b>' +'medium: </b>'+ doc.medium;}
                    if (doc.series_title==null) {
                        if (doc.source!=null) {snippet_meiji +=   ' <br><b>' +'note: </b>'+ doc.source;}
                    }

                    snippet_meiji +=   ' <br>' +'<b>collection:</b> '+ doc.collection;
                    snippet_meiji += '<br><small><b>score:</b>'+doc.score +'</small>';

                    if (doc.identifier!=null) {
                        var link = str2.link(doc.identifier).replace("http://www.archivesdirect.amdigital.co.uk/Documents/Details/","http://www.archivesdirect.amdigital.co.uk.officefileschina.erf.sbb.spk-berlin.de/Documents/Details/");
                        $('a[href^="http://"]')
                            .attr('target','_blank');
                        snippet_meiji +=  ' <br>'+ '<span id="link">'+ link+'</span>';
                    }
                    output += '<span>' + snippet_meiji + '</span></div>';
                }
                else if (doc.collection=="CNKI_eBooks") {
                    if (doc.author!=null) {snippet_cnki +=  '<b>'+'author: </b>' + doc.author;}
                    if (doc.publisher!=null) {snippet_cnki +=  ' <b>' +'edition: </b>'+ doc.publisher;}
                    if (doc.publication_name!=null) {snippet_cnki +=  ','+ doc.publication_name;}
                    if (doc.edition!=null) {snippet_cnki +=' <b>' +'edition: </b>'  + doc.edition;}
                    if (doc.date!=null) {snippet_cnki +=  '<br><b> date: </b>' + doc.date;
                        if (doc.issued!=null) {snippet_cnki +=  '/' + doc.issued;}
                    }
                    if (doc.date==null) {
                        if (doc.issued!=null) {snippet_cnki += '<br><b> date: </b>' + doc.issued;}
                    }
                    if (doc.responsibility!=null) {snippet_cnki +=  ' <br><b>' +'note: </b>'+ doc.responsibility;}
                    if (doc.series_title!=null) { snippet_cnki += ' <br><b>' +'note: </b>'+ doc.series_title;
                        if (doc.source!=null) {snippet_cnki +=  ' ,'+ doc.source;}
                    }
                    if (doc.medium!=null) { snippet_cnki += ' <br><b>' +'medium: </b>'+ doc.medium;}
                    if (doc.series_title==null) {
                        if (doc.source!=null) {snippet_cnki +=   ' <br><b>' +'note: </b>'+ doc.source;}
                    }

                    snippet_cnki +=   ' <br>' +'<b>collection:</b> '+ doc.collection;
                    snippet_cnki += '<br><small><b>score:</b>'+doc.score +'</small>';

                    if (doc.identifier!=null) {
                        //var link = str2.link(doc.identifier).replace("http://www.archivesdirect.amdigital.co.uk/Documents/Details/","http://www.archivesdirect.amdigital.co.uk.officefileschina.erf.sbb.spk-berlin.de/Documents/Details/");
                        var link = str2.link((doc.identifier)[1]);
                        $('a[href^="http://"]')
                            .attr('target','_blank');
                        snippet_cnki +=  ' <br>'+ '<span id="link">'+ link+'</span>';
                    }
                    output += '<span>' + snippet_cnki + '</span></div>';
                }
                else if (doc.collection=="Airiti") {
                    if (doc.author!=null) {snippet_airiti +=  '<b>'+'author: </b>' + doc.author; +"</br></br>"}
                    if (doc.publisher!=null) {snippet_airiti +=  '"</br><b>' +'edition: </b>'+ doc.publisher;}
                    if (doc.publication_name!=null) {snippet_airiti +=  ','+ doc.publication_name;}
                    if (doc.edition!=null) {snippet_airiti +=  ','+ doc.edition;}
                    if (doc.date!=null) {snippet_airiti +=  '<br><b> date: </b>' + doc.date;
                        if (doc.issued!=null) {snippet_airiti +=  '/' + doc.issued;}
                    }
                    if (doc.date==null) {if (doc.issued!=null) {snippet_airiti += '<br><b> date: </b>' + doc.issued;}}
                    if (doc.responsibility!=null) {snippet_airiti +=  ' <br><b>' +'note: </b>'+ doc.responsibility;}
                    if (doc.series_title!=null) { snippet_airiti += ' <br><b>' +'note: </b>'+ doc.series_title;
                        if (doc.source!=null) {snippet_airiti +=  ' ,'+ doc.source;}
                    }

                    if (doc.series_title==null) {
                        if (doc.source!=null) {snippet_airiti +=   ' <br><b>' +'note: </b>'+ doc.source;}
                    }

                    snippet_airiti +=   ' <br>' +'<b>collection:</b> '+ doc.collection;
                    snippet_airiti += '<br><small><b>score:</b>'+doc.score +'</small>';
                    if (doc.identifier!=null) {
                        var link = str2.link(doc.identifier).replace("http://www.airitibooks.com/detail.aspx?","http://erf.sbb.spk-berlin.de/han/airiti/www.airitibooks.com/Detail/Detail?");
                        $('a[href^="http://"]')
                            .attr('target','_blank');
                        snippet_airiti +=  ' <br>'+ '<span id="link">'+ link+'</span>';
                    }
                    output += '<span>' + snippet_airiti + '</span></div>';

                }
                else {

                }
            }
            else if (doc.hasModel=="Chapter") {
                $.when($.getJSON(url), $.getJSON(url2)).then(function(data,data2) {
                    $('a[href^="http://"]')
                        .attr('target','_blank');
                    var link = str.link("http://erf.sbb.spk-berlin.de/han/fangzhiku");
                    data_loc_gaz_chapter = $('#titles').append('<h4>' + data[0].response.docs[0].title + '.  ' + data[0].response.docs[0].date + ', ' + doc.pageStart + '-' + doc.pageEnd + ' p.</h4>');

                    if (cur_doc_highlighting_title=='') {
                        data_loc_gaz_chapter = $('#titles').append(doc.title);
                    }else {
                        data_loc_gaz_chapter = $('#titles').append(cur_doc_highlighting_title);
                    }

                    data_loc_gaz_chapter += $('#titles').append('</br>'+'<span id="link">' + link + '</span>');
                    data_loc_gaz_chapter += $('#titles').append('<br><small><b>score:</b>'+doc.score +'</small>');

                });
                output += '<div><span><span id="titles">' + data_loc_gaz_chapter + '</span>';
            }
            else {
                if (doc.id!=null) { snippet += doc.id;}
            }
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