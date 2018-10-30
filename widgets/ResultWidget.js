(function ($) {

    AjaxSolr.ResultWidget = AjaxSolr.AbstractWidget.extend({
        start: 0,

        beforeRequest: function () {
            //$(this.target).html($('<img>').attr('src', 'images/ajax-loader.gif'));
            $(this.target).html($('<img>').attr('src', 'fileadmin/misc/ajax-solr_repositoryB/images/ajax-loader.gif'));
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
            var snippet_dfz = '';
            var snippet_pacific = '';
            var snippet_trade = '';
            var snippet_airiti = '';
            var snippet_meiji = '';
            var snippet_rmrb = '';
            var snippet_gale = '';
            var snippet_cnki = '';
            $('a[href^="http://"]')
                .attr('target','_blank');
            var cur_doc_highlighting_title;
            var cur_doc_highlighting_title;
            if (this.highlighting && highlighting) {
                cur_doc_highlighting_title = this.getDocSnippets(highlighting,doc);
            }

            var output2 =doc.book_id;
            var url =  this.manager.solrUrl+"select?fq=hasModel:Book&q=hasModel:Book%20and%20book_id:"+output2+"&wt=json&json.wrf=?&callback=?";
            var url2 = this.manager.solrUrl+"select?fq=book_id="+doc.page_id+"&q=hasModel:Page&wt=json&json.wrf=?&callback=?";
            var databaseIcon = '<svg data-v-114fcf88="" title="Go to database"  version="1.1" role="presentation" width="13.714285714285714" height="16" viewBox="0 0 1536 1792" class="fa-icon"><path d="M768 768q237 0 443-43t325-127v170q0 69-103 128t-280 93.5-385 34.5-385-34.5-280-93.5-103-128v-170q119 84 325 127t443 43zM768 1536q237 0 443-43t325-127v170q0 69-103 128t-280 93.5-385 34.5-385-34.5-280-93.5-103-128v-170q119 84 325 127t443 43zM768 1152q237 0 443-43t325-127v170q0 69-103 128t-280 93.5-385 34.5-385-34.5-280-93.5-103-128v-170q119 84 325 127t443 43zM768 0q208 0 385 34.5t280 93.5 103 128v128q0 69-103 128t-280 93.5-385 34.5-385-34.5-280-93.5-103-128v-128q0-69 103-128t280-93.5 385-34.5z"></path>';
            var bookIcon = '<svg data-v-114fcf88="" version="1.1" title="Go to book" role="presentation" width="14.857142857142858" height="16" viewBox="0 0 1664 1792" class="fa-icon"><path d="M1639 478q40 57 18 129l-275 906q-19 64-76.5 107.5t-122.5 43.5h-923q-77 0-148.5-53.5t-99.5-131.5q-24-67-2-127 0-4 3-27t4-37q1-8-3-21.5t-3-19.5q2-11 8-21t16.5-23.5 16.5-23.5q23-38 45-91.5t30-91.5q3-10 0.5-30t-0.5-28q3-11 17-28t17-23q21-36 42-92t25-90q1-9-2.5-32t0.5-28q4-13 22-30.5t22-22.5q19-26 42.5-84.5t27.5-96.5q1-8-3-25.5t-2-26.5q2-8 9-18t18-23 17-21q8-12 16.5-30.5t15-35 16-36 19.5-32 26.5-23.5 36-11.5 47.5 5.5l-1 3q38-9 51-9h761q74 0 114 56t18 130l-274 906q-36 119-71.5 153.5t-128.5 34.5h-869q-27 0-38 15-11 16-1 43 24 70 144 70h923q29 0 56-15.5t35-41.5l300-987q7-22 5-57 38 15 59 43zM575 480q-4 13 2 22.5t20 9.5h608q13 0 25.5-9.5t16.5-22.5l21-64q4-13-2-22.5t-20-9.5h-608q-13 0-25.5 9.5t-16.5 22.5zM492 736q-4 13 2 22.5t20 9.5h608q13 0 25.5-9.5t16.5-22.5l21-64q4-13-2-22.5t-20-9.5h-608q-13 0-25.5 9.5t-16.5 22.5z"></path>  <!----></svg>';
            var pageIcon = '<svg data-v-564ce0ae="" version="1.1" role="presentation" width="13.714285714285714" height="16" viewBox="0 0 1536 1792" class="fa-icon"><path d="M1024 512v-472q22 14 36 28l408 408q14 14 28 36h-472zM896 544q0 40 28 68t68 28h544v1056q0 40-28 68t-68 28h-1344q-40 0-68-28t-28-68v-1600q0-40 28-68t68-28h800v544z"></path>  <!----></svg>'

            var link_locgaz = databaseIcon.link("http://erf.sbb.spk-berlin.de/han/fangzhiku");
            var link_locgaz2 = databaseIcon.link("http://server.wenzibase.com");
            var titles = "";
            var titles2 = "";
            var data="";
            var output="";
            var data2="";
            var pages="";
            var data_ad_me_pages ="";
            var data_loc_gaz_pages ="";
            var data_xuxiu_pages ="";
            var data_dfz_pages ="";
            var data_pacific_pages ="";
            var data_trade_pages ="";
            var data_airiti_pages ="";
            var data_loc_gaz_chapter ='';
            var data_cnki_pages ="";
            var data_loc_gaz_chapter2 ="";


            var score="";

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
                        $('a[href^="http://"]')
                            .attr('target','_blank');

                        if (doc.text!=null) {
                            if (cur_doc_highlighting_title=='') {
                                data_loc_gaz_pages += $('#docs').append('<tr><th colspan="3"><hr class="line3"><span class="texttitle">'+"..."+doc.text +"..."+'</span></th></tr>');
                            }else {
                                data_loc_gaz_pages += $('#docs').append('<tr><th colspan="3"><hr class="line3"><span class="texttitle">'+"..."+cur_doc_highlighting_title+"..."+'</span></th></tr>');
                            }
                        }

                        if (data[0].response.docs[0].date!=null && data[0].response.docs[0].issued!=null) {
                            data_loc_gaz_pages += $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;">citation: </td><td colspan="2"><span class="text2"><b>'+ data[0].response.docs[0].title + " ," + data[0].response.docs[0].author + '.  ' + data[0].response.docs[0].date +'/'+ data[0].response.docs[0].issued + '</b>,  p.' + doc.position + '</span></td></tr>');
                        } else if (data[0].response.docs[0].date!=null) {
                            data_loc_gaz_pages += $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;">citation: </td><td colspan="2"><span class="text2"><b>'+ data[0].response.docs[0].title + " ," + data[0].response.docs[0].author + '.  ' + data[0].response.docs[0].date  + '</b>,  p.' + doc.position + '</span></td></tr>');
                        } else {
                            data_loc_gaz_pages +=  $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;">citation: </td><td colspan="2"><span class="text2"><b>'+ data[0].response.docs[0].title + " ,"+ data[0].response.docs[0].author +'.  ' +  '</b>,  p.'+doc.position+'</span></td></tr>');
                        }

                        data_loc_gaz_chapter +=   $("#docs").append('<tr><td colspan="1"><span class="text">collection: </span></td><td colspan="2"><span class="text2"> '+ doc.collection+'</span></td></tr>');
                        data_loc_gaz_chapter +=   $("#docs").append('<tr><td colspan="1"><span class="text">score: </span></td><td colspan="2"><span class="text2">'+doc.score +'</span></td></tr>');

                        data_loc_gaz_chapter +=   $("#docs").append('<tr>' +
                            '<td width="145"><span class="text" id="link">'+'CrossAsia licence: </span></td><td width="145"><span class="textlink">' + link_locgaz + '</span>&nbsp;&nbsp;&nbsp;' +
                            '<span id="link" class="text">'+'provider link: </span><td><span class="textlink2">' + link_locgaz2 + '</span></td>'+
                            '</tr>');

                        pages +=data_loc_gaz_pages;

                    }

                    else if (data[0].response.docs[0].collection=="Adam Matthew FO China"){
                        var link = pageIcon.link(doc.image_url).replace("http://www.archivesdirect.amdigital.co.uk/Documents/Images/","http://erf.sbb.spk-berlin.de/han/OfficeFilesChina/www.archivesdirect.amdigital.co.uk/Documents/Images/");
                        var link2 = pageIcon.link(doc.image_url).replace("http://www.archivesdirect.amdigital.co.uk/Documents/Images/","http://www.archivesdirect.amdigital.co.uk/Documents/Images/");
                        $('a[href^="http://"]')
                            .attr('target','_blank');

                        if (doc.text!=null) {
                            if (cur_doc_highlighting_title=='') {
                                data_ad_me_pages += $('#docs').append('<tr><th colspan="3"><hr class="line3"><span class="texttitle">'+"..."+doc.text+"..."+'</span></th></tr>');
                            } else {
                                var firstvariable = "<font style=\"background:#FFFF99\">";
                                var secondvariable = "<\/font>";
                                data_ad_me_pages += $('#docs').append('<tr><th colspan="3"><hr class="line3"><span class="texttitle">'+"..."+cur_doc_highlighting_title+'</span></th></tr>');
                            }
                        }

                        if (data[0].response.docs[0].date!=null && data[0].response.docs[0].issued!=null) {
                            data_ad_me_pages =  $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;">citation:  </td>' + '<td colspan="2"><span class="text2"><b>'+ data[0].response.docs[0].title + '.  ' + data[0].response.docs[0].date +'/'+ data[0].response.docs[0].issued +  '</b>'+',  p.'+doc.position+'</span></td></tr>');
                        } else if (data[0].response.docs[0].date!=null) {
                            data_ad_me_pages =  $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;">citation:  </td>' + '<td colspan="2"><span class="text2"><b>'+ data[0].response.docs[0].title + '.  ' + data[0].response.docs[0].date +  '</b>'+',  p.'+doc.position+'</span></td></tr>');
                        } else {
                            data_ad_me_pages =  $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;">citation:  </td>' + '<td colspan="2"><span class="text2"><b>'+ data[0].response.docs[0].title + '.  ' + '</b>'+',  p.'+doc.position+'</span></td></tr>');
                        }

                        data_ad_me_pages +=   $("#docs").append('<tr><td colspan="1"><span class="text">collection: </span></td><td colspan="2"><span class="text2"> '+ doc.collection+'</span></td></tr>');
                        data_ad_me_pages +=   $("#docs").append('<tr><td colspan="1"><span class="text">score: </span></td><td colspan="2"><span class="text2">'+doc.score +'</span></td></tr>');
                        data_ad_me_pages +=   $("#docs").append('<tr>' +
                            '<td width="145"><span class="text" id="link">'+'CrossAsia licence: </span></td><td width="145"><span class="textlink">' + link + '</span>&nbsp;&nbsp;&nbsp;' +
                            '<span id="link" class="text">'+'provider link: </span><td><span class="textlink2">' + link2 + '</span></td>'+
                            '</tr>');

                        pages +=data_ad_me_pages;
                    }

                    else if (data[0].response.docs[0].collection=="Adam Matthew - China America Pacific") {
                        var link = pageIcon.link(doc.image_url).replace("http://www.cap.amdigital.co.uk/Documents/Images/","http://erf.sbb.spk-berlin.de/han/ChinaAmericaPacific/www.cap.amdigital.co.uk/Documents/Images/");
                        var link2 = pageIcon.link(doc.image_url).replace("http://www.archivesdirect.amdigital.co.uk/Documents/Images/","http://www.cap.amdigital.co.uk/Documents/Images/");
                        $('a[href^="http://"]')
                            .attr('target','_blank');

                        if (doc.text!=null) {
                            if (cur_doc_highlighting_title=='') {
                                data_pacific_pages += $('#docs').append('<tr><th colspan="3"><hr class="line3"><span class="texttitle">'+"..."+doc.text+"..."+'</span><td>');
                            } else {
                                data_pacific_pages += $('#docs').append('<tr><th colspan="3"><hr class="line3"><span class="texttitle">'+"..."+cur_doc_highlighting_title+"..."+'</span></th></tr>');
                            }

                            if (data[0].response.docs[0].date!=null && data[0].response.docs[0].issued!=null && data[0].response.docs[0].author!=null) {
                                data_pacific_pages =  $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;">citation:  </td>' + '<td colspan="2"><span class="text2"><b>'+ data[0].response.docs[0].title + '.  '+data[0].response.docs[0].author +',' + data[0].response.docs[0].date+'/'+ data[0].response.docs[0].issued+ '</b>' +',  p.'+doc.position+'</span></td></tr>');
                            } else if (data[0].response.docs[0].date!=null && data[0].response.docs[0].author!=null) {
                                data_pacific_pages =  $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;">citation:  </td>' + '<td colspan="2"><span class="text2"><b>'+ data[0].response.docs[0].title + '.  ' +data[0].response.docs[0].author +',' + data[0].response.docs[0].date+  '</b>'+',  p.'+doc.position+'</span></td></tr>');
                            } else {
                                data_pacific_pages =  $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;">citation:  </td>' + '<td colspan="2"><span class="text2"><b>'+ data[0].response.docs[0].title + '.  '  + '</b>'+',  p.'+doc.position+'</span></td></tr>');
                            }
                        }

                        if (doc.text==null) {
                            if (data[0].response.docs[0].date!=null && data[0].response.docs[0].issued!=null && data[0].response.docs[0].author!=null) {
                                data_pacific_pages += $('#docs').append('<tr><th colspan="3"><hr class="line3"><td>');
                                data_pacific_pages =  $('#docs').append('<tr><th colspan="1" class="textFirst" style="vertical-align: top;">citation:  </th>' + '<th colspan="2"><span class="text5"><b>'+ data[0].response.docs[0].title + '.  ' +data[0].response.docs[0].author +',' + data[0].response.docs[0].date+'/'+ data[0].response.docs[0].issued+  '</b>'+',  p.'+doc.position+'</span></th></tr>');
                            } else if (data[0].response.docs[0].date!=null && data[0].response.docs[0].author!=null) {
                                data_pacific_pages += $('#docs').append('<tr><th colspan="3"><hr class="line3"><td>');
                                data_pacific_pages =  $('#docs').append('<tr><th colspan="1" class="textFirst" style="vertical-align: top;">citation:  </th>' + '<th colspan="2"><span class="text5"><b>'+ data[0].response.docs[0].title + '.  '+data[0].response.docs[0].author +',' + data[0].response.docs[0].date+  '</b>'+',  p.'+doc.position+'</span></th></tr>');
                            } else {
                                data_pacific_pages += $('#docs').append('<tr><th colspan="3"><hr class="line3"><td>');
                                data_pacific_pages =  $('#docs').append('<tr><th colspan="1" class="textFirst" style="vertical-align: top;">citation:  </th>' + '<th colspan="2"><span class="text5"><b>'+ data[0].response.docs[0].title + '.  ' +'</b>' +',  p.'+doc.position+'</span></th></tr>');
                            }
                        }

                        data_pacific_pages +=   $("#docs").append('<tr><td colspan="1"><span class="text">collection: </span></td><td colspan="2"><span class="text2"> '+ doc.collection+'</span></td></tr>');
                        data_pacific_pages +=   $("#docs").append('<tr><td colspan="1"><span class="text">score: </span></td><td colspan="2"><span class="text2">'+doc.score +'</span></td></tr>');
                        data_pacific_pages +=   $("#docs").append('<tr>' +
                            '<td width="145"><span class="text" id="link">'+'CrossAsia licence: </span></td><td width="145"><span class="textlink">' + link + '</span>&nbsp;&nbsp;&nbsp;' +
                            '<span id="link" class="text">'+'provider link: </span><td><span class="textlink2">' + link2 + '</span></td>'+
                            '</tr>');

                        pages +=data_pacific_pages;
                    }

                    else if (data[0].response.docs[0].collection=="Adam Matthew - China Trade & Politics") {
                        var link = pageIcon.link(doc.image_url).replace("http://www.china.amdigital.co.uk/Documents/Images","http://erf.sbb.spk-berlin.de:80/han/ChinaTradePoliticsCulture1793-1980/www.china.amdigital.co.uk/Documents/Images/");
                        var link2 = pageIcon.link(doc.image_url).replace("http://www.china.amdigital.co.uk/Documents/Images/","http://www.china.amdigital.co.uk/Documents/Images/");
                        $('a[href^="http://"]')
                            .attr('target','_blank');

                        if (doc.text!=null) {
                            if (cur_doc_highlighting_title == '') {
                                data_trade_pages += $('#docs').append('<tr><th colspan="3"><hr class="line3"><span class="texttitle">'+"..."+doc.text + "..."+'</span></th></tr>');
                            } else {
                                data_trade_pages += $('#docs').append('<tr><th colspan="3"><hr class="line3"><span class="texttitle">'+"..."+cur_doc_highlighting_title + "..."+'</span></th></tr>');
                            }
                            if (data[0].response.docs[0].date!=null && data[0].response.docs[0].issued!=null) {
                                data_trade_pages =  $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;">citation: </td>' + '<td colspan="2"><span class="text2"><b>'+ data[0].response.docs[0].title +  ', ' +data[0].response.docs[0].author+ '.  ' + data[0].response.docs[0].date+'/'+ data[0].response.docs[0].issued+ '</b>'+',  p.'+doc.position+'</span></td></tr>');
                            } else if (data[0].response.docs[0].date!=null) {
                                data_trade_pages =  $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;">citation: </td>' + '<td colspan="2"><span class="text2"><b>'+ data[0].response.docs[0].title +  ', ' +data[0].response.docs[0].author+ '.  ' + data[0].response.docs[0].date+ '</b>'+',  p.'+doc.position+'</span></td></tr>');
                            } else {
                                data_trade_pages =  $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;">citation: </td>' + '<td colspan="2"><span class="text2"><b>'+ data[0].response.docs[0].title +  ', ' +data[0].response.docs[0].author+ '.  '+'</b>' + ',  p.'+doc.position+'</span></td></tr>');
                            }
                        }

                        if (doc.text==null) {
                            if (data[0].response.docs[0].date!=null && data[0].response.docs[0].issued!=null) {
                                data_trade_pages += $('#docs').append('<tr><th colspan="3"><hr class="line3"><td>');
                                data_trade_pages =  $('#docs').append('<tr><th colspan="1" class="textFirst" style="vertical-align: top;">citation:  </th>' + '<th colspan="2"><span class="text5"><b>'+ data[0].response.docs[0].title +  ', ' +data[0].response.docs[0].author+  '.  ' + data[0].response.docs[0].date+'/'+ data[0].response.docs[0].issued+ '</b>'+',  p.'+doc.position+'</span></th></tr>');
                            } else if (data[0].response.docs[0].date!=null) {
                                data_trade_pages += $('#docs').append('<tr><th colspan="3"><hr class="line3"><td>');
                                data_trade_pages =  $('#docs').append('<tr><th colspan="1" class="textFirst" style="vertical-align: top;">citation:  </th>' + '<th colspan="2"><span class="text5"><b>'+ data[0].response.docs[0].title +  ', ' +data[0].response.docs[0].author+ '.  ' + data[0].response.docs[0].date+ '</b>'+',  p.'+doc.position+'</span></th></tr>');
                            } else {
                                data_trade_pages += $('#docs').append('<tr><th colspan="3"><hr class="line3"><td>');
                                data_trade_pages =  $('#docs').append('<tr><th colspan="1" class="textFirst" style="vertical-align: top;">citation:  </th>' + '<th colspan="2"><span class="text5"><b>'+ data[0].response.docs[0].title +  ', ' +data[0].response.docs[0].author+ '.  ' + '</b>'+',  p.'+doc.position+'</span></th></tr>');
                            }
                        }

                        data_trade_pages +=   $("#docs").append('<tr><td colspan="1"><span class="text">collection: </span></td><td colspan="2"><span class="text2"> '+ doc.collection+'</span></td></tr>');
                        data_trade_pages +=   $("#docs").append('<tr><td colspan="1"><span class="text">score: </span></td><td colspan="2"><span class="text2">'+doc.score +'</span></td></tr>');
                        data_trade_pages +=   $("#docs").append('<tr>' +
                            '<td width="145"><span class="text" id="link">'+'CrossAsia licence: </span></td><td width="145"><span class="textlink">' + link + '</span>&nbsp;&nbsp;&nbsp;' +
                            '<span id="link" class="text">'+'provider link: </span><td><span class="textlink2">' + link2 + '</span></td>'+
                            '</tr>');

                        pages +=data_trade_pages;
                    }

                    else if (data[0].response.docs[0].collection=="Airiti") {
                        $('a[href^="http://"]')
                            .attr('target','_blank');

                        var page = parseInt(doc.position);
                        var combineLink = '&GoToPage='+page;
                        var link2 = (data[0].response.docs[0].identifier).toString();
                        var newLink=link2.replace('http://www.airitibooks.com/detail.aspx?','http://www.airitibooks.com.airiti.erf.sbb.spk-berlin.de/pdfViewer/index.aspx?');
                        var newLink2=link2.replace('http://www.airitibooks.com/detail.aspx?','http://www.airitibooks.com/pdfViewer/index.aspx?');

                        var link = pageIcon.link(newLink+combineLink);
                        var link2 = pageIcon.link(newLink2+combineLink);
                        if (doc.text!=null) {
                            if (cur_doc_highlighting_title=='') {
                                data_airiti_pages += $('#docs').append('<tr><th colspan="3"><hr class="line3"><span class="texttitle">'+"..."+doc.text + "..."+'</span></th></tr>');
                            } else {
                                data_airiti_pages += $('#docs').append('<tr><th colspan="3"><hr class="line3"><span class="texttitle">'+"..."+cur_doc_highlighting_title + "..."+'</span></th></tr>');
                            }
                        }

                        data_airiti_pages =  $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;">citation:  </td>' + '<td colspan="2"><span class="text2"><b>'+ data[0].response.docs[0].title + '. ' +  data[0].response.docs[0].author +', '   + data[0].response.docs[0].date+ '</b>' +',  p.'+doc.position+'</span></td></tr>');

                        data_airiti_pages +=   $("#docs").append('<tr><td colspan="1"><span class="text">collection: </span></td><td colspan="2"><span class="text2"> '+ doc.collection+'</span></td></tr>');
                        data_airiti_pages +=   $("#docs").append('<tr><td colspan="1"><span class="text">score: </span></td><td colspan="2"><span class="text2">'+doc.score +'</span></td></tr>');
                        data_airiti_pages +=   $("#docs").append('<tr>' +
                            '<td width="145"><span class="text" id="link">'+'CrossAsia licence: </span></td><td width="145"><span class="textlink">' + link + '</span>&nbsp;&nbsp;&nbsp;' +
                            '<span id="link" class="text">'+'provider link: </span><td><span class="textlink2">' + link2 + '</span></td>'+
                            '</tr>');

                        pages +=data_airiti_pages;
                    }

                    else if(data[0].response.docs[0].collection=="Xuxiu") {
                        $('a[href^="http://"]')
                            .attr('target','_blank');

                        var vor_link1 = (data[0].response.docs[0].identifier[0]);
                        var vor_link2 = (data[0].response.docs[0].identifier[1]);

                        var http="type=\"CrossAsia Link\" http://erf.sbb.spk-berlin.de/han/xuxiu/hunteq.com/ancientc/ancientkm?!!";

                        if (vor_link1.includes(http)) {
                            var link_replace = vor_link1.replace("type=\"CrossAsia Link\" ","");
                            var link5 = bookIcon.link(link_replace);
                            var provider_link = vor_link1.replace("type=\"CrossAsia Link\" ","").replace("http://erf.sbb.spk-berlin.de/han/xuxiu/hunteq.com/ancientc/ancientkm?!!","http://hunteq.com/ancientc/ancientkm?!!");
                            var provider_link2 = bookIcon.link(provider_link);
                        } else {
                            var link_replace = vor_link2.replace("type=\"CrossAsia Link\" ","");
                            var link5 = bookIcon.link(link_replace);
                            var provider_link = vor_link2.replace("type=\"CrossAsia Link\" ","").replace("http://erf.sbb.spk-berlin.de/han/xuxiu/hunteq.com/ancientc/ancientkm?!!","http://hunteq.com/ancientc/ancientkm?!!");
                            var provider_link2 = bookIcon.link(provider_link);
                        }

                        if (doc.text!=null) {
                            if (cur_doc_highlighting_title=='') {
                                data_xuxiu_pages += $('#docs').append('<tr><th colspan="3"><hr class="line3"><span class="texttitle">'+"..."+doc.text + "..."+'</span></th></tr>');
                            }
                            else {
                                data_xuxiu_pages += $('#docs').append('<tr><th colspan="3"><hr class="line3"><span class="texttitle">'+"..."+cur_doc_highlighting_title + "..."+'</span></th></tr>');
                            }
                        }
                        data_xuxiu_pages =  $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;">citation:  </td>' + '<td colspan="2"><span class="text2"><b>'+ data[0].response.docs[0].title + ', ' +data[0].response.docs[0].creator+ ' ' +  '</b>' +',  p.'+doc.position+'</span></td></tr>');

                        data_xuxiu_pages +=   $("#docs").append('<tr><td colspan="1"><span class="text">collection: </span></td><td colspan="2"><span class="text2"> '+ doc.collection+'</span></td></tr>');
                        data_xuxiu_pages +=   $("#docs").append('<tr><td colspan="1"><span class="text">score: </span></td><td colspan="2"><span class="text2">'+doc.score +'</span></td></tr>');
                        data_xuxiu_pages +=   $("#docs").append('<tr>' +
                            '<td width="145"><span class="text" id="link">'+'CrossAsia licence: </span></td><td width="145"><span class="textlink">' + link5 + '</span>&nbsp;&nbsp;&nbsp;' +
                            '<span id="link" class="text">'+'provider link: </span><td><span class="textlink2">' + provider_link2 + '</span></td>'+
                            '</tr>');
                        pages +=data_xuxiu_pages;
                    }

                    else if(data[0].response.docs[0].collection=="Local Gazetteer (Diaolong)") {
                        $('a[href^="http://"]')
                            .attr('target','_blank');

                        var vor_link1 = (data[0].response.docs[0].identifier[0]);
                        var vor_link2 = (data[0].response.docs[0].identifier[1]);

                        var http="http://hunteq.com/ancientc/ancientkm?!!";

                        if (vor_link1.includes(http)) {
                            var link_replace = vor_link1.replace("http://hunteq.com/ancientc/ancientkm?!!","http://erf.sbb.spk-berlin.de/han/zhongguodifangzhiyiji/hunteq.com/ancientc/ancientkm?!!");
                            var link5 = bookIcon.link(link_replace);
                            var provider_link = vor_link1.replace("","").replace("http://erf.sbb.spk-berlin.de/han/xuxiu/hunteq.com/ancientc/ancientkm?!!","http://hunteq.com/ancientc/ancientkm?!!");
                            var provider_link2 = bookIcon.link(provider_link);
                        } else {
                            var link_replace = vor_link2.replace("http://hunteq.com/ancientc/ancientkm?!!","http://erf.sbb.spk-berlin.de/han/zhongguodifangzhiyiji/hunteq.com/ancientc/ancientkm?!!");
                            var link5 = bookIcon.link(link_replace);
                            var provider_link = vor_link2.replace("","").replace("http://erf.sbb.spk-berlin.de/han/xuxiu/hunteq.com/ancientc/ancientkm?!!","http://hunteq.com/ancientc/ancientkm?!!");
                            var provider_link2 = bookIcon.link(provider_link);
                        }

                        if (doc.text!=null) {
                            if (cur_doc_highlighting_title=='') {
                                data_dfz_pages += $('#docs').append('<tr><th colspan="3"><hr class="line3"><span class="texttitle">'+"..."+doc.text + "..."+'</span></th></tr>');
                            }
                            else {
                                data_dfz_pages += $('#docs').append('<tr><th colspan="3"><hr class="line3"><span class="texttitle">'+"..."+cur_doc_highlighting_title + "..."+'</span></th></tr>');
                            }
                        }
                        data_dfz_pages =  $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;">citation:  </td>' + '<td colspan="2"><span class="text2"><b>'+ data[0].response.docs[0].title + ', ' +data[0].response.docs[0].creator+ ' ' +  '</b>' +',  p.'+doc.position+'</span></td></tr>');

                        data_dfz_pages +=   $("#docs").append('<tr><td colspan="1"><span class="text">collection: </span></td><td colspan="2"><span class="text2"> '+ doc.collection+'</span></td></tr>');
                        data_dfz_pages +=   $("#docs").append('<tr><td colspan="1"><span class="text">score: </span></td><td colspan="2"><span class="text2">'+doc.score +'</span></td></tr>');
                        data_dfz_pages +=   $("#docs").append('<tr>' +
                            '<td width="145"><span class="text" id="link">'+'CrossAsia licence: </span></td><td width="145"><span class="textlink">' + link5 + '</span>&nbsp;&nbsp;&nbsp;' +
                            '<span id="link" class="text">'+'provider link: </span><td><span class="textlink2">' + provider_link2 + '</span></td>'+
                            '</tr>');
                        pages +=data_dfz_pages;
                    }

                    else if(data[0].response.docs[0].collection=="CNKI_eBooks") {
                        $('a[href^="http://"]')
                            .attr('target','_blank');

                        var vor_link = (data[0].response.docs[0].identifier[1]);
                        var nach_link= vor_link.replace("http://","");
                        var erf ="http://erf.sbb.spk-berlin.de/han/cnki-books/";
                        var new_link = erf+nach_link;
                        var link1 = pageIcon.link(new_link.replace("Detail","OnlineView")+"?page="+doc.position);
                        var link2 = pageIcon.link(vor_link.replace("Detail","OnlineView")+"?page="+doc.position);

                        if (doc.text!=null) {
                            if (cur_doc_highlighting_title == '') {
                                data_cnki_pages += $('#docs').append('<tr><th colspan="3"><hr class="line3"><span class="texttitle">' + "..."+doc.text + "..." + '</span></th></tr>');
                            }
                            else {
                                data_cnki_pages += $('#docs').append('<tr><th colspan="3"><hr class="line3"><span class="texttitle">' + "..."+cur_doc_highlighting_title + "..." + '</span></th></tr>');
                            }
                        } else {
                            data_cnki_pages += $('#docs').append('<tr><th colspan="3"><hr class="line3"><span class="texttitle">' + "NO TEXT" + '</span></th></tr>');
                        }

                        if (data[0].response.docs[0].date!=null && data[0].response.docs[0].issued!=null) {
                            data_cnki_pages =  $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;">citation:  </td>' + '<td colspan="2"><span class="text2"><b>'+ data[0].response.docs[0].title + '.  ' +  data[0].response.docs[0].date+'/'+ data[0].response.docs[0].issued+ '</b>'+',  p.'+doc.position+'</span></td></tr>');
                        } else if (data[0].response.docs[0].date!=null) {
                            data_cnki_pages =  $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;">citation:  </td>' + '<td colspan="2"><span class="text2"><b>'+ data[0].response.docs[0].title + '.  ' +'</b>'+ data[0].response.docs[0].date+  ',  p.'+doc.position+'</span></td></tr>');
                        } else {
                            data_cnki_pages =  $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;">citation:  </td>' + '<td colspan="2"><span class="text2"><b>'+ data[0].response.docs[0].title + '.  ' +'</b>'+   ',  p.'+doc.position+'</span></td></tr>');
                        }

                        data_cnki_pages +=   $("#docs").append('<tr><td colspan="1"><span class="text">collection: </span></td><td colspan="2"><span class="text2"> '+ doc.collection+'</span></td></tr>');
                        data_cnki_pages +=   $("#docs").append('<tr><td colspan="1"><span class="text">score: </span></td><td colspan="2"><span class="text2">'+doc.score +'</span></td></tr>');
                        data_cnki_pages +=   $("#docs").append('<tr>' +
                            '<td width="145"><span class="text" id="link">'+'CrossAsia licence: </span></td><td width="145"><span class="textlink">' + link1 + '</span>&nbsp;&nbsp;&nbsp;' +
                            '<span id="link" class="text">'+'provider link: </span><td><span class="textlink2">' + link2 + '</span></td>'+
                            '</tr>');
                        pages +=data_cnki_pages;
                    }

                    else {
                        data =  $('#docs').append('<span class="text">'+
                            data[0].response.docs[0].title + '.  ' +  ',  p.'+doc.position+'</span>');
                    }
                });
                output += pages;
            }

            else if (doc.hasModel=='Article') {
                $('a[href^="http://"]')
                    .attr('target','_blank');
                if (doc.collection=="Renmin Ribao") {
                    var rightDate = moment(doc.wholeDate.toString()).format("DD.MM.YYYY");
                    var link = databaseIcon.link("http://rmrb.egreenapple.com/");
                    var link2 = databaseIcon.link("http://erf.sbb.spk-berlin.de/han/RenminRibao1/");

                    if (cur_doc_highlighting_title == '') {
                        snippet_rmrb += ('<table class="books"><tr><th colspan="3"><span class="texttitle">' + "..." + doc.text + "..." + ' </span></th></tr>');
                    } else {
                        snippet_rmrb += ('<table class="books"><tr><th colspan="3"><span class="texttitle">' + "..." + cur_doc_highlighting_title + "..." + ' </span></th></tr>');
                    }
                    snippet_rmrb += '<tr><td colspan="1" class="text" style="vertical-align: top;">citation: </td><td colspan="2"><span class="text2"><b>' + doc.title + '</b>' + ",  p." + doc.page + '</span></td></tr>';

                    /*if (cur_doc_highlighting_title=='') {

                    } else {
                        snippet_rmrb += '<tr><td colspan="1" class="text" style="vertical-align: top;">citation: </td><td colspan="2"><span class="text2"><b>' + cur_doc_highlighting_title +'</b>' + ",  p."+doc.page+'</span></td></tr>';
                    }*/

                    if (doc.author != null) {
                        snippet_rmrb += '<tr><td colspan="1"><span class="text">' + 'author: </span></td><td colspan="2"><span class="text2">' + doc.author;
                        +'</span></td></tr>'
                    }

                    snippet_rmrb += '<tr><td colspan="1"><span class="text"> date: </span></td><td colspan="2"><span class="text2">' + rightDate + '</span></td></tr>';

                    if (doc.description != null) {
                        snippet_rmrb += '<tr><td colspan="1"><span class="text">' + 'note: </span></td><td colspan="2"><span class="text2">' + doc.description + '</span></td></tr>';
                    }


                    snippet_rmrb += '<tr><td colspan="1"><span class="text">collection: </span></td><td colspan="2"><span class="text2"> ' + doc.collection + '</span></td></tr>';
                    snippet_rmrb += '<tr><td colspan="1"><span class="text">score: </span></td><td colspan="2"><span class="text2">' + doc.score + '</span></td></tr>';

                    snippet_rmrb += '<tr>' +
                        '<td width="145"><span class="text" id="link">' + 'CrossAsia licence: </span></td><td width="145"><span class="textlink">' + link2 + '</span>&nbsp;&nbsp;&nbsp;' +
                        '<span id="link" class="text">' + 'provider link: </span><td><span class="textlink2">' + link + '</span></td>' +
                        '</tr>';

                    output += snippet_rmrb + '</table><hr class="line"></div>';
                }
                else if (doc.collection=="Missionary, Sinology, and Literary Periodicals (1817-1949)") {
                    var range = doc["page-range"];
                    var link = databaseIcon.link(doc["electronic-url"]);
                    var transform = doc["electronic-url"].replace("http://","")
                    var link2 =  databaseIcon.link("http://erf.sbb.spk-berlin.de/han/galecfer/"+transform);

                    if (cur_doc_highlighting_title == '') {
                        snippet_gale += ('<table class="books"><tr><th colspan="3"><span class="texttitle">' + "..." + doc.text + "..." + ' </span></th></tr>');
                    } else {
                        snippet_gale += ('<table class="books"><tr><th colspan="3"><span class="texttitle">' + "..." + cur_doc_highlighting_title + "..." + ' </span></th></tr>');
                    }
                    if (doc.author!=null && doc["journal-title"] !=null && doc["publication-volume"]!=null && doc["volume-number"]!=null) {
                        snippet_gale += '<tr><td colspan="1" class="text" style="vertical-align: top;">citation: </td><td colspan="2"><span class="text2"><b>' + doc.title + '</b>' +", "+doc.author+" .In: "+doc["journal-title"]+" ,vol."+doc["publication-volume"]+", no."+doc["volume-number"]+ ", p." + doc["page-range"] +" ("+doc["date-original"]+")"+ '</span></td></tr>';
                    } else if (doc.author!=null && doc["journal-title"] !=null && doc["publication-volume"]!=null) {
                        snippet_gale += '<tr><td colspan="1" class="text" style="vertical-align: top;">citation: </td><td colspan="2"><span class="text2"><b>' + doc.title + '</b>' +", "+doc.author+" .In: "+doc["journal-title"]+" ,vol."+doc["publication-volume"]+ ", p." + doc["page-range"] +" ("+doc["date-original"]+")"+ '</span></td></tr>';
                    } else if (doc.author!=null && doc["journal-title"] !=null) {
                        snippet_gale += '<tr><td colspan="1" class="text" style="vertical-align: top;">citation: </td><td colspan="2"><span class="text2"><b>' + doc.title + '</b>' +", "+doc.author+" .In: "+doc["journal-title"]+ ", p." + doc["page-range"] +" ("+doc["date-original"]+")"+ '</span></td></tr>';
                    } else {
                        snippet_gale += '<tr><td colspan="1" class="text" style="vertical-align: top;">citation: </td><td colspan="2"><span class="text2"><b>' + doc.title + '</b>' +","+ " .In: "+doc["journal-title"]+ ", p." + doc["page-range"] +" ("+doc["date-original"]+")"+ '</span></td></tr>';
                    }

                    if (doc.date != null) {
                        snippet_gale += '<tr><td colspan="1"><span class="text">' + 'date: </span></td><td colspan="2"><span class="text2">' + doc.date;
                        +'</span></td></tr>'
                    }

                    if (doc["format"] != null) {
                        snippet_gale += '<tr><td colspan="1"><span class="text">' + 'format: </span></td><td colspan="2"><span class="text2">' + doc["format"] + '</span></td></tr>';
                    }

                    if (doc["series-title"] != null) {
                        snippet_gale += '<tr><td colspan="1"><span class="text">' + 'series-title: </span></td><td colspan="2"><span class="text2">' + doc["series-title"] + '</span></td></tr>';
                    }

                    snippet_gale += '<tr><td colspan="1"><span class="text">collection: </span></td><td colspan="2"><span class="text2"> ' + doc.collection + '</span></td></tr>';
                    snippet_gale += '<tr><td colspan="1"><span class="text">score: </span></td><td colspan="2"><span class="text2">' + doc.score + '</span></td></tr>';

                    snippet_gale += '<tr>' +
                        '<td width="145"><span class="text" id="link">' + 'CrossAsia licence: </span></td><td width="145"><span class="textlink">' + link2 + '</span>&nbsp;&nbsp;&nbsp;' +
                        '<span id="link" class="text">' + 'provider link: </span><td><span class="textlink2">' + link + '</span></td>' +
                        '</tr>';


                    output += snippet_gale + '</table><hr class="line"></div>';
                }

            }

            else if (doc.hasModel=='Book') {
                if (doc.responsibility!==undefined && doc.author!=null && doc.date!=null) {
                    if  (cur_doc_highlighting_title=='') {
                        var output = '<table class="books"><tr><th colspan="3"><span class="texttitle">' + doc.title + ", " +  doc.responsibility + ", "+ doc.author+ ", "+ doc.date+'</span></th></tr>';
                    } else {
                        //var output = '<table class="books"><th colspan="3"><span class="texttitle">' + cur_doc_highlighting_title + ", " + doc.responsibility +", "+  doc.author+ ", " +doc.date +'</span></th></tr>';
                    }

                } else if (doc.author!=null && doc.date!=null) {
                    if  (cur_doc_highlighting_title=='') {
                        var output = '<table class="books"><tr><th colspan="3"><span class="texttitle">' + doc.title +  ", "+ doc.author+ ", "+ doc.date+'</span></th></tr>';
                    } else {
                        //var output = '<table class="books"><th colspan="3"><span class="texttitle">' + cur_doc_highlighting_title  +", "+  doc.author+ " " +doc.date +'</span></th></tr>';
                    }

                } else if (doc.author!=null) {
                    if  (cur_doc_highlighting_title=='') {
                        var output = '<table class="books"><tr><th colspan="3"><span class="texttitle">' + doc.title +  ", "+ doc.author+ '</span></th></tr>';
                    } else {
                        //var output = '<table class="books"><th colspan="3"><span class="texttitle">' + cur_doc_highlighting_title  +", "+  doc.author+'</span></th></tr>';
                    }

                }else if (doc.date!=null) {
                    if  (cur_doc_highlighting_title=='') {
                        var output = '<table class="books"><tr><th colspan="3"><span class="texttitle">' + doc.title +  ", "+ doc.date+'</span></th></tr>';
                    } else {
                        //var output = '<table class="books"><th colspan="3"><span class="texttitle">' + cur_doc_highlighting_title  +", "   + doc.date +'</span></th></tr>';
                    }

                }else if (doc.issued!=null && doc.creator!=null){
                    if  (cur_doc_highlighting_title=='') {
                        var output = '<table class="books"><tr><th colspan="3"><span class="texttitle">' + doc.title +  ", "+ doc.creator+", "+ doc.issued+'</span></th></tr>';
                    } else {
                        //var output = '<table class="books"><th colspan="3"><span class="texttitle">' + cur_doc_highlighting_title  +", "   + doc.issued +'</span></th></tr>';
                    }
                }else if (doc.issued!=null){
                    if  (cur_doc_highlighting_title=='') {
                        var output = '<table class="books"><tr><th colspan="3"><span class="texttitle">' + doc.title +  ", "+ doc.issued+'</span></th></tr>';
                    } else {
                        //var output = '<table class="books"><th colspan="3"><span class="texttitle">' + cur_doc_highlighting_title  +", "   + doc.issued +'</span></th></tr>';
                    }
                } else {
                    if  (cur_doc_highlighting_title=='') {
                        var output = '<table class="books"><tr><th colspan="3"><span class="texttitle">' + doc.title + " "+" "+  '</span></th></tr>';
                    }else {
                        //var output = '<table class="books"><tr><th colspan="3"><span class="texttitle">' + cur_doc_highlighting_title + ", "+ doc.author+ " "+ doc.date+'</span></th></tr>';
                    }
                }

                if (doc.collection=="Local Gazetteer"){


                    if (doc.author!=null) {snippet_loc_gaz +=  '<tr><td colspan="1"><span class="text">'+'author: </span></td><td colspan="2"><span class="text2">' + doc.author; + '</span></td></tr>'}
                    if (doc.publisher!=null) {snippet_loc_gaz +=  '<tr><td colspan="1" class="text" style="vertical-align: top;">publisher: </td><td colspan="2"><span class="text2">' + doc.publisher; + '</span></td></tr>'}
                    if (doc.publication_name!=null) {snippet_loc_gaz +=  ','+ doc.publication_name+'</td></tr>';}
                    if (doc.edition!=null) {snippet_loc_gaz +=  '<tr><td colspan="1" class="text" style="vertical-align: top;">edition: </td><td colspan="2"><span class="text2">' + doc.edition; + '</span></td></tr>'}


                    if (doc.date!=null && doc.issued!=null) {snippet_loc_gaz +=  '<tr><td colspan="1"><span class="text"> date: </span></td><td colspan="2"><span class="text2">' + doc.date+'/'+doc.issued+'</span></td></tr>';}
                    if (doc.date==null) {snippet_loc_gaz +=  '<tr><td colspan="1"><span class="text"> date: </span></td><td colspan="2"><span class="text2">' + doc.issued+'</span></td></tr>';}
                    if (doc.issued==null) {snippet_loc_gaz +=  '<tr><td colspan="1"><span class="text"> date: </span></td><td colspan="2"><span class="text2">' + doc.date+'</span></td></tr>';}


                    if (doc.series_title!=null) {snippet_loc_gaz +=  '<tr><td colspan="1" class="text" style="vertical-align: top;">series: </td><td colspan="2"><span class="text2">' + doc.series_title+'</span></td></tr>';
                        if (doc.source!=null) {snippet_loc_gaz +=  '/' + doc.source+'</span></td></tr>';}
                    }

                    if (doc.series_title==null) {
                        if (doc.source!=null) {snippet_loc_gaz += '<tr><td  colspan="1" class="text" style="vertical-align: top;">series: </td><td colspan="2"><span class="text2">' + doc.source+'</span></td></tr>';}
                    }


                    snippet_loc_gaz +=   '<tr><td colspan="1"><span class="text">collection: </span></td><td colspan="2"><span class="text2"> '+ doc.collection+'</span></td></tr>';
                    snippet_loc_gaz +=   '<tr><td colspan="1"><span class="text">score: </span></td><td colspan="2"><span class="text2">'+doc.score +'</span></td></tr>';

                    snippet_loc_gaz +=  '<tr>' +
                        '<td width="145"><span class="text" id="link">'+'CrossAsia licence: </span></td><td width="145"><span class="textlink">' + link_locgaz + '</span>&nbsp;&nbsp;&nbsp;' +
                        '<span id="link" class="text">'+'provider link: </span><td><span class="textlink2">' + link_locgaz2 + '</span></td>'+
                        '</tr>';
                    output +=  snippet_loc_gaz + '</table><hr class="line"></div>';

                }

                else if (doc.collection=="Xuxiu") {

                    if (doc.creator!=null) {snippet_xuxiu +=  '<tr><td colspan="1"><span class="text">'+'author: </span></td><td colspan="2"><span class="text2">' + doc.creator; + '</span></td></tr>'}

                    if (doc.issued!=null) {snippet_xuxiu +=  '<tr><td colspan="1"><span class="text"> date: </span></td><td colspan="2"><span class="text2">' + doc.issued+'</span></td></tr>';}

                    if (doc.edition!=null) {snippet_xuxiu +=  '<tr><td colspan="1" class="text" style="vertical-align: top;">edition: </td><td colspan="2"><span class="text2">' + doc.edition; + '</span></td></tr>'}
                    if (doc.series_title!=null) {snippet_xuxiu +=  '<tr><td colspan="1" class="text" style="vertical-align: top;">series: </td><td colspan="2"><span class="text2">' + doc.series_title; + '</span></td></tr>'}
                    if (doc.publisher!=null) {snippet_xuxiu +=  '<tr><td colspan="1" class="text" style="vertical-align: top;">publisher: </td><td colspan="2"><span class="text2">' + doc.publisher; + '</span></td></tr>'}

                    if (doc.note!=null) {
                        var note = doc.note.toString();
                        var note2 = note.replace("type=\"statement of responsibility\"","").replace("[","").replace("]","");
                        snippet_xuxiu +=  '<tr><td colspan="1"><span class="text">'+'note: </span></td><td colspan="2"><span class="text2">' + note2; + '</span></td></tr>'
                    }

                    snippet_xuxiu +=   '<tr><td colspan="1"><span class="text">collection: </span></td><td colspan="2"><span class="text2"> '+ doc.collection+'</span></td></tr>';
                    snippet_xuxiu +=   '<tr><td colspan="1"><span class="text">score: </span></td><td colspan="2"><span class="text2">'+doc.score +'</span></td></tr>';

                    if (doc.identifier!=null) {
                        $('a[href^="http://"]')
                            .attr('target','_blank');
                        var vor_link1 = doc.identifier[0];
                        var vor_link2 = doc.identifier[1];
                        var http="type=\"CrossAsia Link\" http://erf.sbb.spk-berlin.de/han/xuxiu/hunteq.com/ancientc/ancientkm?!!";
                        if (vor_link1.includes(http)) {
                            var link_replace = vor_link1.replace("type=\"CrossAsia Link\" ","");
                            var link = bookIcon.link(link_replace);
                            snippet_xuxiu +=  '<tr>' +
                                '<td width="145"><span class="text" id="link">'+'CrossAsia licence: </span></td><td width="145"><span class="textlink">' + link + '</span>&nbsp;&nbsp;&nbsp;' +
                                '<span id="link" class="text">'+'provider link: </span><td><span class="textlink2">' + link + '</span></td>'+
                                '</tr>';

                        } else if (vor_link2.includes(http)) {
                            var link_replace = vor_link2.replace("type=\"CrossAsia Link\" ","");
                            var link = bookIcon.link(link_replace);
                            snippet_xuxiu +=  '<tr>' +
                                '<td width="145"><span class="text" id="link">'+'CrossAsia licence: </span></td><td width="145"><span class="textlink">' + link + '</span>&nbsp;&nbsp;&nbsp;' +
                                '<span id="link" class="text">'+'provider link: </span><td><span class="textlink2">' + link + '</span></td>'+
                                '</tr>';
                        }
                    }
                    output +=  snippet_xuxiu + '</table><hr class="line"></div>';
                }

                else if (doc.collection=="Local Gazetteer (Diaolong)") {

                    if (doc.creator!=null) {snippet_dfz +=  '<tr><td colspan="1"><span class="text">'+'author: </span></td><td colspan="2"><span class="text2">' + doc.creator; + '</span></td></tr>'}

                    if (doc.issued!=null) {snippet_dfz +=  '<tr><td colspan="1"><span class="text"> date: </span></td><td colspan="2"><span class="text2">' + doc.issued+'</span></td></tr>';}

                    if (doc.edition!=null) {snippet_dfz +=  '<tr><td colspan="1" class="text" style="vertical-align: top;">edition: </td><td colspan="2"><span class="text2">' + doc.edition; + '</span></td></tr>'}
                    if (doc.series_title!=null) {snippet_dfz +=  '<tr><td colspan="1" class="text" style="vertical-align: top;">series: </td><td colspan="2"><span class="text2">' + doc.series_title; + '</span></td></tr>'}
                    if (doc.publisher!=null) {snippet_dfz +=  '<tr><td colspan="1" class="text" style="vertical-align: top;">publisher: </td><td colspan="2"><span class="text2">' + doc.publisher; + '</span></td></tr>'}

                    if (doc.note!=null) {
                        var note = doc.note.toString();
                        var note2 = note.replace("type=\"statement of responsibility\"","").replace("[","").replace("]","");
                        snippet_dfz +=  '<tr><td colspan="1"><span class="text">'+'note: </span></td><td colspan="2"><span class="text2">' + note2; + '</span></td></tr>'
                    }

                    snippet_dfz +=   '<tr><td colspan="1"><span class="text">collection: </span></td><td colspan="2"><span class="text2"> '+ doc.collection+'</span></td></tr>';
                    snippet_dfz +=   '<tr><td colspan="1"><span class="text">score: </span></td><td colspan="2"><span class="text2">'+doc.score +'</span></td></tr>';

                    if (doc.identifier!=null) {
                        $('a[href^="http://"]')
                            .attr('target','_blank');
                        var vor_link1 = doc.identifier[0];
                        var vor_link2 = doc.identifier[1];
                        var http="http://hunteq.com/ancientc/ancientkm?!!";
                        if (vor_link1.includes(http)) {
                            var link_replace = vor_link1.replace("http://hunteq.com/ancientc/ancientkm?!!" ,"http://erf.sbb.spk-berlin.de/han/zhongguodifangzhiyiji/hunteq.com/ancientc/ancientkm?!!");
                            var link = bookIcon.link(link_replace);
                            var provider_link = bookIcon.link(vor_link1);
                            snippet_dfz +=  '<tr>' +
                                '<td width="145"><span class="text" id="link">'+'CrossAsia licence: </span></td><td width="145"><span class="textlink">' + link + '</span>&nbsp;&nbsp;&nbsp;' +
                                '<span id="link" class="text">'+'provider link: </span><td><span class="textlink2">' + provider_link + '</span></td>'+
                                '</tr>';

                        } else if (vor_link2.includes(http)) {
                            var link_replace = vor_link2.replace("http://hunteq.com/ancientc/ancientkm?!!","http://erf.sbb.spk-berlin.de/han/zhongguodifangzhiyiji/hunteq.com/ancientc/ancientkm?!!");
                            var link = bookIcon.link(link_replace);
                            var provider_link = bookIcon.link(vor_link2);
                            snippet_dfz +=  '<tr>' +
                                '<td width="145"><span class="text" id="link">'+'CrossAsia licence: </span></td><td width="145"><span class="textlink">' + link + '</span>&nbsp;&nbsp;&nbsp;' +
                                '<span id="link" class="text">'+'provider link: </span><td><span class="textlink2">' + provider_link + '</span></td>'+
                                '</tr>';
                        }
                    }
                    output +=  snippet_dfz + '</table><hr class="line"></div>';
                }

                else if (doc.collection=="Adam Matthew FO China") {

                    if (doc.date!=null && doc.issued!=null) {snippet_ad_me +=  '<tr><td colspan="1"><span class="text"> date: </span></td><td colspan="2"><span class="text2">' + doc.date+'/'+doc.issued+'</span></td></tr>';}
                    if (doc.date==null) {snippet_ad_me +=  '<tr><td colspan="1"><span class="text"> date: </span></td><td colspan="2"><span class="text2">' + doc.issued+'</span></td></tr>';}
                    if (doc.issued==null) {snippet_ad_me +=  '<tr><td colspan="1"><span class="text"> date: </span></td><td colspan="2"><span class="text2">' + doc.date+'</span></td></tr>';}

                    if (doc.edition!=null) {snippet_ad_me +=  '<tr><td colspan="1" class="text" style="vertical-align: top;">edition: </td><td colspan="2"><span class="text2">' + doc.edition; + '</span></td></tr>'}
                    if (doc.series_title!=null) {snippet_ad_me +=  '<tr><td colspan="1" class="text" style="vertical-align: top;">series: </td><td colspan="2"><span class="text2">' + doc.series_title; + '</span></td></tr>'}
                    if (doc.publisher!=null) {snippet_ad_me +=  '<tr><td colspan="1" class="text" style="vertical-align: top;">publisher: </td><td colspan="2"><span class="text2">' + doc.publisher; + '</span></td></tr>'}

                    snippet_ad_me +=   '<tr><td colspan="1"><span class="text">collection: </span></td><td colspan="2"><span class="text2"> '+ doc.collection+'</span></td></tr>';
                    snippet_ad_me +=   '<tr><td colspan="1"><span class="text">score: </span></td><td colspan="2"><span class="text2">'+doc.score +'</span></td></tr>';

                    if (doc.identifier!=null) {
                        var link = bookIcon.link(doc.identifier).replace("http://www.archivesdirect.amdigital.co.uk/Documents/Details/","http://erf.sbb.spk-berlin.de/han/OfficeFilesChina/www.archivesdirect.amdigital.co.uk/Documents/Details/");
                        var link2 = bookIcon.link(doc.identifier).replace("http://www.archivesdirect.amdigital.co.uk/Documents/Details/","www.archivesdirect.amdigital.co.uk/Documents/Details/");
                        $('a[href^="http://"]')
                            .attr('target','_blank');
                        snippet_ad_me +=  '<tr>' +
                            '<td width="145"><span class="text" id="link">'+'CrossAsia licence: </span></td><td width="145"><span class="textlink">' + link + '</span>&nbsp;&nbsp;&nbsp;' +
                            '<span id="link" class="text">'+'provider link: </span><td><span class="textlink2">' + link2 + '</span></td>'+
                            '</tr>';
                    }
                    output +=  snippet_ad_me + '</table><hr class="line"></div>';
                }

                else if (doc.collection=="Adam Matthew - China America Pacific") {

                    if (doc.publication_name!=null) {snippet_pacific +=  '<tr><td colspan="1"><span class="text">'+'author: </span></td><td colspan="2"><span class="text2">' + doc.publication_name; + '</span></td></tr>'}

                    if (doc.date!=null && doc.issued!=null) {snippet_pacific +=  '<tr><td colspan="1"><span class="text"> date: </span></td><td colspan="2"><span class="text2">' + doc.date+'/'+doc.issued+'</span></td></tr>';}
                    if (doc.date==null) {snippet_pacific +=  '<tr><td colspan="1"><span class="text"> date: </span></td><td colspan="2"><span class="text2">' + doc.issued+'</span></td></tr>';}
                    if (doc.issued==null) {snippet_pacific +=  '<tr><td colspan="1"><span class="text"> date: </span></td><td colspan="2"><span class="text2">' + doc.date+'</span></td></tr>';}
                    if (doc.edition!=null) {snippet_pacific +=  '<tr><td colspan="1" class="text" style="vertical-align: top;">edition: </td><td colspan="2"><span class="text2">' + doc.edition; + '</span></td></tr>'}
                    if (doc.publication_place!=null) {snippet_pacific +=  '<tr><td colspan="1" class="text" style="vertical-align: top;">publisher: </td><td colspan="2"><span class="text2">' + doc.publication_place; + '</span></td></tr>'}
                    if (doc.description!=null) {snippet_pacific +=  '<tr><td colspan="1" class="text" style="vertical-align: top;">note: </td><td colspan="2"><span class="text2">' + doc.description + '</span></td></tr>';}

                    snippet_pacific +=   '<tr><td colspan="1"><span class="text">collection: </span></td><td colspan="2"><span class="text2"> '+ doc.collection+'</span></td></tr>';
                    snippet_pacific +=   '<tr><td colspan="1"><span class="text">score: </span></td><td colspan="2"><span class="text2">'+doc.score +'</span></td></tr>';

                    if (doc.identifier!=null) {
                        var link = bookIcon.link(doc.identifier).replace("http://www.cap.amdigital.co.uk/Documents/Details/","http://erf.sbb.spk-berlin.de/han/ChinaAmericaPacific/www.cap.amdigital.co.uk/Documents/Details/");
                        var link2 = bookIcon.link(doc.identifier).replace("http://www.archivesdirect.amdigital.co.uk/Documents/Details/","www.cap.amdigital.co.uk/Documents/Details/");
                        $('a[href^="http://"]')
                            .attr('target','_blank');
                        snippet_pacific +=  '<tr>' +
                            '<td width="145"><span class="text" id="link">'+'CrossAsia licence: </span></td><td width="145"><span class="textlink">' + link + '</span>&nbsp;&nbsp;&nbsp;' +
                            '<span id="link" class="text">'+'provider link: </span><td><span class="textlink2">' + link2 + '</span></td>'+
                            '</tr>';
                    }
                    output +=  snippet_pacific + '</table><hr class="line"></div>';
                }

                else if (doc.collection=="Adam Matthew - China Trade & Politics") {

                    if (doc.author!=null) {snippet_trade +=  '<tr><td colspan="1"><span class="text">'+'author: </span></td><td colspan="2"><span class="text2">' + doc.author; + '</span></td></tr>'}

                    if (doc.date!=null && doc.issued!=null) {snippet_trade +=  '<tr><td colspan="1"><span class="text"> date: </span></td><td colspan="2"><span class="text2">' + doc.date+'/'+doc.issued+'</span></td></tr>';}
                    if (doc.date==null) {snippet_trade +=  '<tr><td colspan="1"><span class="text"> date: </span></td><td colspan="2"><span class="text2">' + doc.issued+'</span></td></tr>';}
                    if (doc.issued==null) {snippet_trade +=  '<tr><td colspan="1"><span class="text"> date: </span></td><td colspan="2"><span class="text2">' + doc.date+'</span></td></tr>';}

                    if (doc.description!=null) {snippet_trade +=  '<tr><td colspan="1" class="text" style="vertical-align: top;">note:</td><td colspan="2"><span class="text2">' + doc.description + '</span></td></tr>';}
                    if (doc.medium!=null) {snippet_trade +=  '<tr><td colspan="1" class="text" style="vertical-align: top;">medium:</td><td colspan="2"><span class="text2">' + doc.medium + '</span></td></tr>';}
                    snippet_trade +=   '<tr><td colspan="1"><span class="text">collection: </span></td><td colspan="2"><span class="text2"> '+ doc.collection+'</span></td></tr>';
                    snippet_trade +=   '<tr><td colspan="1"><span class="text">score: </span></td><td colspan="2"><span class="text2">'+doc.score +'</span></td></tr>';

                    if (doc.identifier!=null) {
                        var link = bookIcon.link(doc.identifier).replace("http://www.china.amdigital.co.uk/Documents/Details/","http://erf.sbb.spk-berlin.de:80/han/ChinaTradePoliticsCulture1793-1980/www.china.amdigital.co.uk/Documents/Details/");
                        var link2 = bookIcon.link(doc.identifier).replace("http://www.china.amdigital.co.uk/Documents/Details/","http://www.china.amdigital.co.uk/Documents/Details/");
                        $('a[href^="http://"]')
                            .attr('target','_blank');
                        snippet_trade +=  '<tr>' +
                            '<td width="145"><span class="text" id="link">'+'CrossAsia licence: </span></td><td width="145"><span class="textlink">' + link + '</span>&nbsp;&nbsp;&nbsp;' +
                            '<span id="link" class="text">'+'provider link: </span><td><span class="textlink2">' + link2 + '</span></td>'+
                            '</tr>';
                    }
                    output +=  snippet_trade + '</table><hr class="line"></div>';
                }

                else if (doc.collection=="Adam Matthew - Meiji Japan") {

                    if (doc.date!=null) {snippet_meiji +=  '<tr><td colspan="1"><span class="text"> date: </span></td><td colspan="2"><span class="text2">' + doc.date+'</span></td></tr>';}

                    if (doc.edition!=null) {snippet_meiji +=  '<tr><td colspan="1" class="text" style="vertical-align: top;">edition: </td><td colspan="2"><span class="text2">' + doc.edition; + '</span></td></tr>'}
                    if (doc.medium!=null) {snippet_meiji +=  '<tr><td colspan="1" class="text" style="vertical-align: top;">medium: </td><td colspan="2"><span class="text2">' + doc.medium; + '</span></td></tr>'}


                    snippet_meiji +=   '<tr><td colspan="1"><span class="text">collection: </span></td><td colspan="2"><span class="text2"> '+ doc.collection+'</span></td></tr>';
                    snippet_meiji +=   '<tr><td colspan="1"><span class="text">score: </span></td><td colspan="2"><span class="text2">'+doc.score +'</span></td></tr>';

                    if (doc.identifier!=null) {
                        var link = bookIcon.link(doc.identifier).replace("http://www.aap.amdigital.co.uk/Contents/document-details.aspx","http://erf.sbb.spk-berlin.de:80/han/AmericaAsiaandthePacific/www.aap.amdigital.co.uk/Contents/document-details.aspx");
                        var link2 = bookIcon.link(doc.identifier).replace("http://www.aap.amdigital.co.uk/Contents/document-details.aspx","http://www.aap.amdigital.co.uk/Contents/document-details.aspx");
                        $('a[href^="http://"]')
                            .attr('target','_blank');
                        snippet_meiji +=  '<tr>' +
                            '<td width="145"><span class="text" id="link">'+'CrossAsia licence: </span></td><td width="145"><span class="textlink">' + link + '</span>&nbsp;&nbsp;&nbsp;' +
                            '<span id="link" class="text">'+'provider link: </span><td><span class="textlink2">' + link2 + '</span></td>'+
                            '</tr>';
                    }
                    output +=  snippet_meiji + '</table><hr class="line"></div>';
                }

                else if (doc.collection=="CNKI_eBooks") {

                    if (doc.author!=null) {snippet_cnki +=  '<tr><td colspan="1"><span class="text">'+'author: </span></td><td colspan="2"><span class="text2">' + doc.author; + '</span></td></tr>'}
                    if (doc.date!=null) {snippet_cnki +=  '<tr><td colspan="1"><span class="text">'+'date: </span></td><td colspan="2"><span class="text2">' + doc.date; + '</span></td></tr>'}
                    if (doc.series_title!=null) {snippet_cnki +=  '<tr><td colspan="1" class="text" style="vertical-align: top;">series: </td><td colspan="2"><span class="text2">' + doc.series_title; + '</span></td></tr>'}
                    if (doc.publisher!=null) {snippet_cnki +=  '<tr><td colspan="1" class="text" style="vertical-align: top;">publisher: </td><td colspan="2"><span class="text2">' + doc.publisher; + '</span></td></tr>'}

                    snippet_cnki +=   '<tr><td colspan="1"><span class="text">collection: </span></td><td colspan="2"><span class="text2"> '+ doc.collection+'</span></td></tr>';
                    snippet_cnki +=   '<tr><td colspan="1"><span class="text">score: </span></td><td colspan="2"><span class="text2">'+doc.score +'</span></td></tr>';

                    if (doc.identifier!=null) {
                        //var link = str2.link(doc.identifier).replace("http://www.archivesdirect.amdigital.co.uk/Documents/Details/","http://www.archivesdirect.amdigital.co.uk.officefileschina.erf.sbb.spk-berlin.de/Documents/Details/");

                        var link = bookIcon.link((doc.identifier)[1]);
                        var vor_link = ((doc.identifier)[1]);
                        var nach_link= vor_link.replace("http://","");
                        var erf ="http://erf.sbb.spk-berlin.de/han/cnki-books/";
                        var new_link = erf+nach_link;
                        var link2 = bookIcon.link(new_link);

                        $('a[href^="http://"]')
                            .attr('target','_blank');

                        snippet_cnki +=  '<tr>' +
                            '<td width="145"><span class="text" id="link">'+'CrossAsia licence: </span></td><td width="145"><span class="textlink">' + link2 + '</span>&nbsp;&nbsp;&nbsp;' +
                            '<span id="link" class="text">'+'provider link: </span><td><span class="textlink2">' + link + '</span></td>'+
                            '</tr>';
                    }
                    output +=  snippet_cnki + '</table><hr class="line"></div>';
                }

                else if (doc.collection=="Airiti") {
                    if (doc.author!=null) {snippet_airiti +=  '<tr><td colspan="1"><span class="text">'+'author: </span></td><td colspan="2"><span class="text2">' + doc.author; + '</span></td></tr>'}
                    if (doc.date!=null) {snippet_airiti +=  '<tr><td colspan="1"><span class="text">' +'date: </span></td><td colspan="2"><span class="text2">' + doc.date + '</span></td></tr>';}
                    if (doc.publisher!=null) {snippet_airiti +=  '<tr><td colspan="1" class="text" style="vertical-align: top;">publisher: </td><td colspan="2"><span class="text2">' + doc.publisher+', '+doc.publication_place + '</span></td></tr>';}
                    if (doc.series_title!=null) {snippet_airiti +=  '<tr><td colspan="1" class="text" style="vertical-align: top;">series: </td><td colspan="2"><span class="text2">' + doc.series_title + '</span></td></tr>';}
                    if (doc.description!=null) {snippet_airiti +=  '<tr><td colspan="1" class="text" style="vertical-align: top;">note: </td><td colspan="2"><span class="text2">' + doc.description + '</span></td></tr>';}

                    snippet_airiti +=   '<tr><td colspan="1"><span class="text">collection: </span></td><td colspan="2"><span class="text2"> '+ doc.collection+'</span></td></tr>';
                    snippet_airiti +=   '<tr><td colspan="1"><span class="text">score: </span></td><td colspan="2"><span class="text2">'+doc.score +'</span></td></tr>';

                    if (doc.identifier!=null) {
                        var link = bookIcon.link(doc.identifier).replace("http://www.airitibooks.com/detail.aspx?","http://erf.sbb.spk-berlin.de/han/airiti/www.airitibooks.com/Detail/Detail?");
                        var link2 = bookIcon.link(doc.identifier).replace("http://www.airitibooks.com/detail.aspx?","http://www.airitibooks.com/Detail/Detail?");
                        $('a[href^="http://"]')
                            .attr('target','_blank');
                        snippet_airiti +=  '<tr>' +
                            '<td width="145"><span class="text" id="link">'+'CrossAsia licence: </span></td><td width="145"><span class="textlink">' + link + '</span>&nbsp;&nbsp;&nbsp;' +
                            '<span id="link" class="text">'+'provider link: </span><td><span class="textlink2">' + link2 + '</span></td>'+
                            '</tr>';
                    }
                    output +=  snippet_airiti + '</table><hr class="line"></div>';
                }
                else {}
            }

            else if (doc.hasModel=="Chapter") {
                $.when($.getJSON(url), $.getJSON(url2)).then(function(data,data2) {
                    $('a[href^="http://"]')
                        .attr('target','_blank');
                    //data_loc_gaz_chapter += $("#docs").append('<hr class="line">');
                    data_loc_gaz_chapter += $("#docs").append("<tr><th colspan='3'><hr class='line3'><span class='texttitle'>"+doc.title+"</span></th></tr>");
                    data_loc_gaz_chapter += $("#docs").append('<tr><td colspan="1" class="text" style="vertical-align: top;">citation: </td>' +
                        '<td colspan="2"><span class="text2">' + data[0].response.docs[0].title + '.  ' + data[0].response.docs[0].date + ', '+" " + data[0].response.docs[0].author + ', ' + doc.pageStart + '-' + doc.pageEnd + ' p. </span></td></tr>'
                    );

                    /*if (cur_doc_highlighting_title=='') {


                    } else {
                        data_loc_gaz_chapter += $("#docs").append("<tr><th colspan='3'><hr class='line3'><span class='texttitle'>"+cur_doc_highlighting_title+"</span></th></tr>");
                    }*/

                    /*if (cur_doc_highlighting_title=='') {


                    } else {
                        data_loc_gaz_chapter += $("#docs").append('<tr><td colspan="1" class="text" style="vertical-align: top;">citation: </td>' +
                            '<td colspan="2"><span class="text2">' + cur_doc_highlighting_title + '.  ' + data[0].response.docs[0].date + ', ' + doc.pageStart + '-' + doc.pageEnd + ' p. </span></td></tr>'
                        );
                    }*/

                    data_loc_gaz_chapter +=   $("#docs").append('<tr><td colspan="1"><span class="text">collection: </span></td><td colspan="2"><span class="text2"> '+ doc.collection+'</span></td></tr>');
                    data_loc_gaz_chapter +=   $("#docs").append('<tr><td colspan="1"><span class="text">score: </span></td><td colspan="2"><span class="text2">'+doc.score +'</span></td></tr>');
                    data_loc_gaz_chapter +=   $("#docs").append('<tr>' +
                        '<td width="145"><span class="text" id="link">'+'CrossAsia licence: </span></td><td width="145"><span class="textlink">' + link_locgaz + '</span>&nbsp;&nbsp;&nbsp;' +
                        '<span id="link" class="text">'+'provider link: </span><td><span class="textlink2">' + link_locgaz2 + '</span></td>'+
                        '</tr>');
                });

                output += data_loc_gaz_chapter;
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