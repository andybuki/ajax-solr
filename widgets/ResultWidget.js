(function ($) {
    AjaxSolr.ResultWidget = AjaxSolr.AbstractWidget.extend({
        start: 0,
        beforeRequest: function () {
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
            return(cur_doc_snippets_txt);
        },
        template: function (doc,highlighting) {
            var databaseIcon = '<svg data-v-114fcf88="" title="Go to database"  version="1.1" role="presentation" width="13.714285714285714" height="16" viewBox="0 0 1536 1792" class="fa-icon"><path d="M768 768q237 0 443-43t325-127v170q0 69-103 128t-280 93.5-385 34.5-385-34.5-280-93.5-103-128v-170q119 84 325 127t443 43zM768 1536q237 0 443-43t325-127v170q0 69-103 128t-280 93.5-385 34.5-385-34.5-280-93.5-103-128v-170q119 84 325 127t443 43zM768 1152q237 0 443-43t325-127v170q0 69-103 128t-280 93.5-385 34.5-385-34.5-280-93.5-103-128v-170q119 84 325 127t443 43zM768 0q208 0 385 34.5t280 93.5 103 128v128q0 69-103 128t-280 93.5-385 34.5-385-34.5-280-93.5-103-128v-128q0-69 103-128t280-93.5 385-34.5z"></path>';
            var bookIcon = '<svg data-v-114fcf88="" version="1.1" title="Go to book" role="presentation" width="14.857142857142858" height="16" viewBox="0 0 1664 1792" class="fa-icon"><path d="M1639 478q40 57 18 129l-275 906q-19 64-76.5 107.5t-122.5 43.5h-923q-77 0-148.5-53.5t-99.5-131.5q-24-67-2-127 0-4 3-27t4-37q1-8-3-21.5t-3-19.5q2-11 8-21t16.5-23.5 16.5-23.5q23-38 45-91.5t30-91.5q3-10 0.5-30t-0.5-28q3-11 17-28t17-23q21-36 42-92t25-90q1-9-2.5-32t0.5-28q4-13 22-30.5t22-22.5q19-26 42.5-84.5t27.5-96.5q1-8-3-25.5t-2-26.5q2-8 9-18t18-23 17-21q8-12 16.5-30.5t15-35 16-36 19.5-32 26.5-23.5 36-11.5 47.5 5.5l-1 3q38-9 51-9h761q74 0 114 56t18 130l-274 906q-36 119-71.5 153.5t-128.5 34.5h-869q-27 0-38 15-11 16-1 43 24 70 144 70h923q29 0 56-15.5t35-41.5l300-987q7-22 5-57 38 15 59 43zM575 480q-4 13 2 22.5t20 9.5h608q13 0 25.5-9.5t16.5-22.5l21-64q4-13-2-22.5t-20-9.5h-608q-13 0-25.5 9.5t-16.5 22.5zM492 736q-4 13 2 22.5t20 9.5h608q13 0 25.5-9.5t16.5-22.5l21-64q4-13-2-22.5t-20-9.5h-608q-13 0-25.5 9.5t-16.5 22.5z"></path>  <!----></svg>';
            var pageIcon = '<svg data-v-564ce0ae="" version="1.1" role="presentation" width="13.714285714285714" height="16" viewBox="0 0 1536 1792" class="fa-icon"><path d="M1024 512v-472q22 14 36 28l408 408q14 14 28 36h-472zM896 544q0 40 28 68t68 28h544v1056q0 40-28 68t-68 28h-1344q-40 0-68-28t-28-68v-1600q0-40 28-68t68-28h800v544z"></path>  <!----></svg>'
            var html_tags= '<tr><td colspan="1"><span class="text">';
            var html_tags2= '</span></td><td colspan="2" class="textlenght"><span class="text2">';
            var html_tags3= '</span></td></tr>';
            var html_tags4 = '<tr><td colspan="1" class="text" style="vertical-align: top;">';
            var html_tags5= '</td><td colspan="2" class="textlenght"><span class="text2">';
            var html_tags6= '<tr><td width="145"><span class="text" id="link">';
            var snippet = '';
            var chapter ='';
            var data ="";
            var cur_doc_highlighting_title='';
            var output ='';
            var output2 =doc.book_id;
            var pages ='';
            var articles ='';
            var url =  this.manager.solrUrl+"ajax?fq=hasModel:Book&q=hasModel:Book&book_id:"+output2+"&wt=json&json.wrf=?&callback=?";
            if (this.highlighting && highlighting) {
                cur_doc_highlighting_title = this.getDocSnippets(highlighting,doc);
            }
            if (doc.hasModel=="Page") {
                $('a[href^="http://"]').attr('target','_blank');
                if (doc.text!=null) {
                    if (cur_doc_highlighting_title=='') {
                        data += $('#docs').append('<tr><th colspan="3"><hr class="line3"><span class="texttitle">'+"..."+doc.text + "..."+'</span></th></tr>');
                    }
                    else {
                        data += $('#docs').append('<tr><th colspan="3"><hr class="line3"><span class="texttitle">'+"..."+highlighting[doc.id].text+ "..."+'</span></th></tr>');
                    }

                    if (doc.collection=='Xuxiu Siku quanshu' || doc.collection=='Siku quanshu') {
                        var title ="";
                        var author ="";
                        var date ="";
                        var position ="";
                        var xml_file="";

                        if (doc.title !=null) { title = '<b>' + doc.title + ", " + '</b>'; }
                        if (doc.author !=null) {author = '<b>' + doc.author + ". " + '</b>'; }
                        if (doc.date !=null) { date = '<b>' + doc.date + ", " + '</b>';}
                        if (doc.position !=null) { position = 'p.' + doc.position + "";}
                        if (doc.xml_file !=null) { xml_file = " [" + doc.xml_file +'] ';}

                        data += $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top; width: 190px;">' + 'citation:' +
                            '</td><td colspan="2" class="textlenght" style="vertical-align: top; max-width: 550px;"><span class="text2"><b>'+ title + author +
                            date + position + xml_file+ "<span class='smallText'>("+ doc.id.split('_')[2]+")</span>"+" "+ html_tags3);
                    } else {
                        var title ="";
                        var author ="";
                        var date ="";
                        var volume ="";
                        var position_vol ="";
                        var position ="";
                        var xml_file="";

                        if (doc.title !=null) { title = '<b>' + doc.title + ", " + '</b>'; }
                        if (doc.author !=null) {author = '<b>' + doc.author + ". " + '</b>'; }
                        if (doc.date !=null) { date = '<b>' + doc.date + ", " + '</b>';}
                        if (doc.position !=null) { position = 'p.' + doc.position + " ";}
                        if (doc.volume !=null) { volume = " (vol. " + doc.volume +', ';}
                        if (doc.position_vol !=null) { position_vol = " p. " + doc.position_vol +')';}
                        if (doc.xml_file !=null) { xml_file = " [" + doc.xml_file +']';}

                        data += $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top; width: 190px;">'+'citation:'+
                            '</td><td colspan="2" class="textlenght" style="vertical-align: top; max-width: 550px;"><span class="text2">'+ title +
                            author + date  + position + volume + position_vol + xml_file +  html_tags3);
                    }
                    if(doc.chapter_title!=null) {
                        data += $("#docs").append(html_tags + 'chapter:'+ '</span></td><td colspan="2"><span class="text2">' + doc.chapter_title.toString().replace(/,/g, ', ') + html_tags3);
                    }

                    if(doc.running_title!=null) {
                        data += $("#docs").append(html_tags + 'Running title (版心):'+ '</span></td><td colspan="2"><span class="text2">' + doc.running_title + html_tags3);
                    }
                }

                if (doc.text==null) {
                    var title ="";
                    var author ="";
                    var date ="";
                    var volume ="";
                    var position_vol ="";
                    var position ="";

                    if (doc.title !=null) { title = '<b>' + doc.title + ", " + '</b>'; }
                    if (doc.author !=null) {author = '<b>' + doc.author + ". " + '</b>'; }
                    if (doc.date !=null) { date = '<b>' + doc.date + ", " + '</b>';}
                    if (doc.position !=null) { position = 'p.' + doc.position + " ";}
                    if (doc.volume !=null) { volume = " (vol. " + doc.volume +', ';}
                    if (doc.position_vol !=null) { position_vol = " p. " + doc.position_vol +')';}

                    data += $('#docs').append('<tr><th colspan="3"><hr class="line3"><td>');
                    data += $('#docs').append(html_tags4 + 'citation:' + '</td><td colspan="2" class="textlenght" ><span class="text2">' +  title + author + date  + position + volume+ position_vol + html_tags3);

                    if(doc.chapter_title!=null) {
                        data += $("#docs").append(html_tags +'chapter:'+ '</span></td><td colspan="2"><span class="text2">' + doc.chapter_title.toString().replace(/,/g, ', ') + html_tags3);
                    }

                    if(doc.running_title!=null) {
                        data += $("#docs").append(html_tags +'Running title (版心):' +'</span></td><td colspan="2"><span class="text2">' + doc.running_title + html_tags3);
                    }
                }

                data +=   $("#docs").append( html_tags +'collection:'+ '</span></td><td colspan="2"><span class="text2">'+ doc.collection + html_tags3);

                if (doc.collection==="Local Gazetteer") {
                    $('a[href^="http://"]').attr('target','_blank');
                    var  link = databaseIcon.link(doc.url);
                    var provider_link = databaseIcon.link(doc.erflink);
                }
                else if (doc.collection==="SBB digital : Asian language collection (selection)") {
                    $('a[href^="http://"]').attr('target','_blank');
                    var    link = pageIcon.link(doc.url);
                }
                else if (doc.collection==="Airiti" ||
                    doc.collection==="Adam Matthew - China America Pacific" ||
                    doc.collection==="Adam Matthew - China Trade & Politics" ||
                    doc.collection==="Early Twentieth Century Chinese Books (1912-1949)" ||
                    doc.collection==="Adam Matthew - Foreign Office Files China & Japan" ||
                    doc.collection==="CNKI eBooks") {
                    $('a[href^="http://"]').attr('target','_blank');
                    var link = pageIcon.link(doc.url);
                    var provider_link = pageIcon.link(doc.erflink);
                }
                else  {
                    $('a[href^="http://"]').attr('target','_blank');
                    var link = bookIcon.link(doc.url);
                    var provider_link = bookIcon.link(doc.erflink);
                }
                if (doc.collection==="SBB digital : Western language Asia collection" ||  doc.collection==="Fulltext search in print books" || doc.collection==="SBB digital : Asian language collection (selection)") {
                    $('a[href^="http://"]').attr('target','_blank');
                    var link = pageIcon.link(doc.url);
                    data += $("#docs").append(html_tags6 + 'Digital SBB: </span></td><td width="145"><span class="textlink3">' + link + '</span>&nbsp;&nbsp;&nbsp;' +
                        html_tags3 );
                } else {
                    $('a[href^="http://"]').attr('target','_blank');
                    data += $("#docs").append(html_tags6 + 'CrossAsia licence: ' + provider_link + '&nbsp;&nbsp;&nbsp;&nbsp;' +
                        'provider link: ' + '<span class="textlink5">' + link +'</span>' + html_tags3);
                }
                pages +=data;
            }
            else if (doc.hasModel=='Article') {
                $('a[href^="http://"]')
                    .attr('target','_blank');

                var title ="";
                var author ="";
                var date ="";
                var volume ="";
                var page ="";
                var volume ="";
                var position ="";
                var responsibility ="";
                var publication_volume="";
                var publication_place="";
                var publication_name="";
                var date_original ="";
                var provider_link ='';
                if (doc.title !=null) { title = '<b>' + doc.title + ", " + '</b>'; }
                if (doc.author !=null) {author = '<b>' + doc.author + ". " + '</b>'; }
                if (doc.date !=null) { date = '<span><b>' + doc.date + "</b></span>" + '';}
                if (doc.volume !=null) { volume = '<span><b>'+" no."+doc.volume + ",</b></span>"}
                if (doc.position !=null) { position = '<span><b>'+"p."+doc.position +"</b></span>" ;}
                if (doc["publication_volume"]!=null) {publication_volume ='<span><b>'+ " vol."+doc["publication_volume"]+ ", </b></span>";}
                if (doc["publication_name"]!=null) {publication_name = "<b> "+doc["publication_name"]+ ", </b>";}
                if (doc["date_original"]!=null) {date_original= '<span>' + " ("+doc["date_original"] +"), </span>";}
                if (doc.bibliographicCitation!=null) {bibliographicCitation= '<span>' + " ("+doc.bibliographicCitation +"), </span>";}

                if (doc.text!=null) {
                    if (cur_doc_highlighting_title=='') {
                        data += $('#docs').append('<tr><th colspan="3"><hr class="line3"><span class="texttitle">'+"..."+doc.text + "..."+'</span></th></tr>');
                    }
                    else {
                        data += $('#docs').append('<tr><th colspan="3"><hr class="line3"><span class="texttitle">'+"..."+highlighting[doc.id].text + "..."+'</span></th></tr>');
                    }
                }

                data += $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top; width: 190px;">citation: </td>'+
                    '<td colspan="2" class="textlenght"  style="vertical-align: top; max-width: 550px;"><span class="text2">'
                    + title + author +  publication_name + volume + publication_volume + date_original + position +  html_tags3);

                if (doc.author != null) {
                    data += $('#docs').append(html_tags + 'author:' + html_tags2 + doc.author + html_tags3);
                }
                if (doc.wholeDate!= null) {
                    data += $('#docs').append(html_tags + 'date:' + html_tags2 + doc.wholeDate + html_tags3);
                }

                if (doc.date_original!= null) {
                    data += $('#docs').append(html_tags + 'date:' + html_tags2 + doc["date_original"] + html_tags3);
                }

                if (doc.edition!= null) {
                    data += $('#docs').append(html_tags + 'edition:' + html_tags2 + doc.edition + html_tags3);
                }

                if (doc.bibliographicCitation!= null) {
                    data += $('#docs').append(html_tags + 'bibliographicCitation:' + html_tags2 + doc.bibliographicCitation + html_tags3);
                }

                if (doc.publication_place!= null) {
                    data += $('#docs').append(html_tags + 'place:' + html_tags2 + doc.publication_place + html_tags3);
                }

                if (doc.publication_volume!= null) {
                    data += $('#docs').append(html_tags + 'volume:' + html_tags2 + doc.publication_volume + html_tags3);
                }

                if (doc.description != null) {
                    data += $('#docs').append(html_tags + 'note:'+ html_tags2 + doc.description + html_tags3);
                }

                if (doc.format != null) {
                    data += $('#docs').append(html_tags + 'format:'+ html_tags2 + doc.format + html_tags3);
                }
                data += $('#docs').append(html_tags +'collection:'+ html_tags2 + doc.collection + html_tags3);

                if (doc.collection==="Renmin Ribao") {
                    var link = databaseIcon.link(doc.url);
                    provider_link = 'CrossAsia licence:&nbsp;' + databaseIcon.link(doc.erflink)+ '&nbsp;&nbsp;&nbsp;';
                } else {
                    if (doc.url !=null) {
                        var link = pageIcon.link(doc.url);
                    }
                    if (doc.erflink !=null) {
                        var provider_link = 'CrossAsia licence:&nbsp;' + pageIcon.link(doc.erflink)+ '&nbsp;&nbsp;&nbsp;';
                    }
                    if (doc.erflink == 'undefined') {
                        var provider_link ='';
                    }

                    if (doc.link == 'undefined') {
                        var link ='';
                    }
                }
                data += $("#docs").append(html_tags6 +  provider_link  +
                     'provider link: ' + '<span class="textlink5">' + link +'</span>' + html_tags3);

                articles +=data;
            }
            else if (doc.hasModel=='Book') {
                $('a[href^="http://"]').attr('target','_blank');

                var title = "";
                var responsibility="";
                var author =""
                var date ="";

                if (doc.title !=null) { title =  doc.title + ", "; }
                if (doc.responsibility !=null) { responsibility =  doc.responsibility + ". "; }
                if (doc.author !=null) {author = doc.author + ". "; }
                if (doc.date !=null) { date = doc.date;}

                if  (cur_doc_highlighting_title=='') {
                    if (responsibility!=null) {
                        snippet += '<table class="books"><tr><th colspan="3"><hr class="line3"><span class="texttitle">' + title + author + date+ '</span></th></tr>';
                    } else {
                        snippet += '<table class="books"><tr><th colspan="3"><hr class="line3"><span class="texttitle">' + title + author + responsibility+ date+ '</span></th></tr>';
                    }
                }
                if (doc.author!=null) {snippet +=  html_tags + 'author:' + html_tags2 + author + html_tags3; }
                if (doc.date!=null) { snippet +=   html_tags + 'date:' + html_tags2 + date + html_tags3;}
                else if (doc.date!=null && doc.issued!=null ) { snippet +=  html_tags+ 'date:'+ html_tags2 + doc.date+'/'+ doc.issued + html_tags3; }
                if (doc.edition!=null) {snippet +=  html_tags4 + 'edition:' + html_tags5 + doc.edition; + html_tags3}
                if (doc.series_title!=null) {snippet +=  html_tags4 + 'series:'+ html_tags5 + doc.series_title; + html_tags3}
                if (doc.keywords!=null) {snippet +=  html_tags4 + 'note:' + html_tags5 + doc.keywords.toString().replace(/,/g,", ");+ html_tags3}
                if (doc.noOfpages!=null) {snippet +=  html_tags4 + 'note:'+  html_tags5 + doc.noOfpages + ' pp.' + html_tags3}
                if (doc.collection!="Xuxiu Siku quanshu") {
                    if (doc.publisher != null && doc.publication_place != null) {
                        snippet += html_tags4 + 'publisher:' + html_tags5 + doc.publication_place + ":" + doc.publisher + html_tags3;
                    }
                    else if (doc.publisher!=null) {snippet +=  html_tags4 + 'publisher:' + html_tags5 + doc.publisher + html_tags3; }
                }
                if (doc.description!=null && doc.extent!=null) {snippet +=  html_tags4 + 'note:' + html_tags5+doc.extent+". " + doc.description + html_tags3; }
                else if (doc.description!=null) {snippet +=  html_tags4 + 'note:' + html_tags5 + doc.description + html_tags3;}
                else if (doc.extent!=null) {snippet +=  html_tags4 + 'note:'+ html_tags5 + doc.extent + html_tags3;}

                snippet +=   html_tags+'collection:'+html_tags2+doc.collection+html_tags3;

                if (doc.identifier!=null || doc.url) {
                    $('a[href^="http://"]').attr('target','_blank');

                    if (doc.collection==="Local Gazetteer") {
                        $('a[href^="http://"]').attr('target','_blank');
                        var link = databaseIcon.link(doc.url);
                        var provider_link = databaseIcon.link(doc.erflink);
                    }
                    else if (doc.collection==="SBB digital : Western language Asia collection" ||
                        doc.collection==="Fulltext search in print books" ||
                        doc.collection==="SBB digital : Asian language collection (selection)") {
                        $('a[href^="http://"]').attr('target','_blank');
                        var link = bookIcon.link(doc.url);
                    }
                    else if (doc.collection==="Early Twentieth Century Chinese Books (1912-1949)") {
                        $('a[href^="http://"]').attr('target','_blank');
                        var link = bookIcon.link(doc.url);
                        var url = doc.url;
                        var http="http://erf.sbb.spk-berlin.de/han/NLCminguo/";
                        var vor_link2 = url.replace(url,http+url.replace("http://",""));
                        var provider_link = bookIcon.link(vor_link2);
                    }
                    else {
                        $('a[href^="http://"]').attr('target','_blank');
                        var    link = bookIcon.link(doc.url);
                        var    provider_link = bookIcon.link(doc.erflink);
                    }
                    if (doc.collection==="SBB digital : Western language Asia collection" ||
                        doc.collection==="Fulltext search in print books" ||
                        doc.collection==="SBB digital : Asian language collection (selection)") {
                        $('a[href^="http://"]').attr('target','_blank');
                        var link = bookIcon.link(doc.url);
                        snippet +=  html_tags6+'Digital SBB: </span></td><td width="145"><span class="textlink3">' + link + '</span>&nbsp;&nbsp;&nbsp;' +
                            html_tags3;
                    }
                    else {
                        $('a[href^="http://"]').attr('target','_blank');
                        snippet +=  html_tags6 +'CrossAsia licence: ' + provider_link + '&nbsp;&nbsp;&nbsp;' +
                            'provider link: ' + '<span class="textlink5">' + link +'</span>' + html_tags3;
                    }
                }
                snippet =  snippet + '</table></div>';
            }
            else if (doc.hasModel=="Chapter") {
                $('a[href^="http://"]')
                    .attr('target','_blank');

                data+= $("#docs").append("<tr><th colspan='3'><hr class='line3'><span class='texttitle'>"+doc.title_chapter+"</span></th></tr>");

                var autor = "";
                var date ="";

                if (doc.author !=null) {
                    author = doc.author + '. ';
                }

                if (doc.date !=null) {
                    date = doc.date + ', ';
                }

                data +=   $("#docs").append(html_tags4 + 'citation:'+ html_tags5 + doc.title + ', ' + author + date  +  'p.' + doc.pageStart + '-' + doc.pageEnd + html_tags3);
                data +=   $("#docs").append(html_tags +  'collection:'+html_tags2+doc.collection+html_tags3);
                data +=   $("#docs").append(html_tags6 +'CrossAsia licence: &nbsp;' + databaseIcon.link(doc.erflink) + '&nbsp;&nbsp;&nbsp;' +
                   'provider link: ' +  '<span class="textlink5">' +databaseIcon.link(doc.url) + '</span>'+ html_tags3);
                chapter +=data;
            }
            else {
                if (doc.id!=null) { snippet += doc.id;}
            }
            output +=  snippet + '</div>';
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