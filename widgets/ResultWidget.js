(function ($) {

    AjaxSolr.ResultWidget = AjaxSolr.AbstractWidget.extend({
        start: 0,

        beforeRequest: function () {
            $(this.target).html($('<img>').attr('src', 'fileadmin/misc/ajax-solr_repositoryB/images/ajax-loader.gif'));
            //$(this.target).html($('<img>').attr('src', '../ajax-solr2/images/ajax-loader.gif'));
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
            var snippet = '';

            var chapter ='';

            var data ="";
            var cur_doc_highlighting_title='';
            var output ='';
            var output2 =doc.book_id;

            var pages ='';
            var articles ='';

            var url =  this.manager.solrUrl+"select?fq=hasModel:Book&q=hasModel:Book&book_id:"+output2+"&wt=json&json.wrf=?&callback=?";
            //var url2 = this.manager.solrUrl+"select?fq=book_id="+doc.book_id+"&q=hasModel:Page&wt=json&json.wrf=?&callback=?";
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
                        data += $('#docs').append('<tr><th colspan="3"><hr class="line3"><span class="texttitle">'+"..."+cur_doc_highlighting_title + "..."+'</span></th></tr>');
                    }

                    if (doc.collection=='Xuxiu Siku quanshu' || doc.collection=='Siku quanshu') {
                        if (doc.title!=null &&  doc.author!=null && doc.date!=null && doc.volume!=null) {
                            data += $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top; width: 190px;">citation: </td><td colspan="2" class="textlenght"  style="vertical-align: top; max-width: 550px;"><span class="text2"><b>'+ doc.title + ", " +  doc.author +'. ' + doc.date  + '</b>, p.' + doc.position + " (vol. "+doc.volume+", p. "+doc.position_vol +")"+'</span></td></tr>');
                        } else if (doc.title!=null && doc.author!=null && doc.date!=null) {
                            data += $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;  width: 190px;">citation: </td><td colspan="2" class="textlenght" class="textlenght" style="vertical-align: top; max-width: 550px;"><span class="text2"><b>'+ doc.title + ", " +  doc.author+'. ' + doc.date  + '</b>, p.' + doc.position + "<span class='smallText'>("+ doc.id.split('_')[2]+")</span>"+" "+ '</span></td></tr>');
                        } else  if (doc.title!=null && doc.author!=null) {
                            data +=  $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;  width: 190px;">citation: </td><td colspan="2" class="textlenght" style="vertical-align: top; max-width: 550px;"><span class="text2"><b>'+ doc.title + ", " + doc.author + '. ' + '</b>p.'+doc.position+ "<span class='smallText'>("+ doc.id.split('_')[2]+")</span>"+" "+'</span></td></tr>');
                        } else  if (doc.title!=null && doc.date!=null) {
                            data +=  $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top; width: 190px;">citation: </td><td colspan="2" class="textlenght" style="vertical-align: top; max-width: 550px;"><span class="text2"><b>'+ doc.title + ", " +  doc.date + ', ' + '</b>p.'+doc.position+ "<span class='smallText'>("+ doc.id.split('_')[2]+")</span>"+" "+'</span></td></tr>');
                        } else  if (doc.title!=null) {
                            data +=  $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top; width: 190px;">citation: </td><td colspan="2" class="textlenght" style="vertical-align: top; max-width: 550px;"><span class="text2"><b>'+ doc.title + '. ' + '</b>p.'+doc.position+ "<span class='smallText'>("+ doc.id.split('_')[2]+")</span>"+ " "+'</span></td></tr>');
                        }

                    } else {
                        if (doc.title!=null &&  doc.author!=null && doc.date!=null && doc.volume!=null) {
                            data += $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top; width: 190px;">citation: </td><td colspan="2" class="textlenght"  style="vertical-align: top; max-width: 550px;"><span class="text2"><b>'+ doc.title + ", " +  doc.author +'. ' + doc.date  + '</b>, p.' + doc.position + " (vol. "+doc.volume+", p. "+doc.position_vol +")"+'</span></td></tr>');
                        } else if (doc.title!=null && doc.author!=null && doc.date!=null) {
                            data += $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;  width: 190px;">citation: </td><td colspan="2" class="textlenght" class="textlenght" style="vertical-align: top; max-width: 550px;"><span class="text2"><b>'+ doc.title + ", " + doc.author+'. ' + doc.date  + '</b>, p.' + doc.position + " "+ '</span></td></tr>');
                        } else  if (doc.title!=null && doc.author!=null) {
                            data +=  $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;  width: 190px;">citation: </td><td colspan="2" class="textlenght" style="vertical-align: top; max-width: 550px;"><span class="text2"><b>'+ doc.title + ", " + doc.author + '. ' + '</b>p.'+doc.position+ " "+'</span></td></tr>');
                        } else  if (doc.title!=null && doc.date!=null) {
                            data +=  $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top; width: 190px;">citation: </td><td colspan="2" class="textlenght" style="vertical-align: top; max-width: 550px;"><span class="text2"><b>'+ doc.title + ". " + doc.date + ', ' + '</b>p.'+doc.position+ " "+'</span></td></tr>');
                        } else  if (doc.title!=null) {
                            data +=  $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top; width: 190px;">citation: </td><td colspan="2" class="textlenght" style="vertical-align: top; max-width: 550px;"><span class="text2"><b>'+ doc.title + '. ' + '</b>p.'+doc.position+ " "+'</span></td></tr>');
                        }
                    }
                    if(doc.chapter_title!=null) {
                        data += $("#docs").append('<tr><td colspan="1"><span class="text">chapter: </span></td><td colspan="2"><span class="text2"> ' + doc.chapter_title.toString().replace(/,/g, ', ') + '</span></td></tr>');
                    }

                    if(doc.running_title!=null) {
                        data += $("#docs").append('<tr><td colspan="1"><span class="text">Running title (版心): </span></td><td colspan="2"><span class="text2"> ' + doc.running_title + '</span></td></tr>');
                    }
                }

                if (doc.text==null) {
                    if (doc.date!=null &&  doc.author!=null && doc.volume!=null) {
                        data += $('#docs').append('<tr><th colspan="3"><hr class="line3"><td>');
                        data += $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;">citation: </td><td colspan="2" class="textlenght" ><span class="text2"><b>'+ doc.title + ", " +  doc.author +'. ' + doc.date  + '</b>,  p.' + doc.position + " (vol. "+doc.volume+", p. "+doc.position_vol +")"+'</span></td></tr>');
                    }else if (doc.date!=null &&  doc.author!=null) {
                        data += $('#docs').append('<tr><th colspan="3"><hr class="line3"><td>');
                        data += $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;">citation: </td><td colspan="2" class="textlenght" ><span class="text2"><b>'+ doc.title + ", " +  doc.author +'. ' + doc.date  + '</b>,  p.' + doc.position + '</span></td></tr>');
                    }else if (doc.date!=null) {
                        data += $('#docs').append('<tr><th colspan="3"><hr class="line3"><td>');
                        data += $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;">citation: </td><td colspan="2" class="textlenght" class="textlenght" ><span class="text2"><b>'+ doc.title + ". " +  doc.date  + '</b>,  p.' + doc.position +  '</span></td></tr>');
                    }else if (doc.author!=null ) {
                        data += $('#docs').append('<tr><th colspan="3"><hr class="line3"><td>');
                        data += $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;">citation: </td><td colspan="2" class="textlenght" ><span class="text2"><b>'+ doc.title + ", " +  doc.author  + '</b>.  p.' + doc.position + '</span></td></tr>');
                    }else  {
                        data += $('#docs').append('<tr><th colspan="3"><hr class="line3"><td>');
                        data +=  $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;">citation: </td><td colspan="2" class="textlenght"><span class="text2"><b>'+ doc.title  + '</b>,  p.'+doc.position+ ""+'</span></td></tr>');
                    }

                    if(doc.chapter_title!=null) {
                        data += $("#docs").append('<tr><td colspan="1"><span class="text">chapter: </span></td><td colspan="2"><span class="text2"> ' + doc.chapter_title.toString().replace(/,/g, ', ') + '</span></td></tr>');
                    }

                    if(doc.running_title!=null) {
                        data += $("#docs").append('<tr><td colspan="1"><span class="text">Running title (版心): </span></td><td colspan="2"><span class="text2"> ' + doc.running_title + '</span></td></tr>');
                    }
                }

                data +=   $("#docs").append('<tr><td colspan="1"><span class="text">collection: </span></td><td colspan="2"><span class="text2"> '+ doc.collection+'</span></td></tr>');


                if (doc.collection==="Local Gazetteer") {
                    $('a[href^="http://"]').attr('target','_blank');
                    var  link = databaseIcon.link(doc.url);
                    var provider_link = databaseIcon.link(doc.erflink);
                }
                else if (doc.collection==="China Comprehensive Gazetteers") {
                    $('a[href^="http://"]').attr('target','_blank');
                    var    link = bookIcon.link(doc.url);
                    var    provider_link = bookIcon.link(doc.erflink);
                }
                else if (doc.collection==="Airiti") {
                    $('a[href^="http://"]').attr('target','_blank');
                    var link = pageIcon.link(doc.url);
                    var provider_link = pageIcon.link(doc.erflink);
                }
                else if (doc.collection==="Local Gazetteer (Diaolong)") {
                    $('a[href^="http://"]').attr('target','_blank');
                    var link = bookIcon.link(doc.url);
                    var provider_link = bookIcon.link(doc.erflink);
                }
                else if (doc.collection==="Adam Matthew - China America Pacific") {
                    $('a[href^="http://"]').attr('target','_blank');
                    var link = pageIcon.link(doc.url);
                    var provider_link = pageIcon.link(doc.erflink);
                }
                else if (doc.collection==="Adam Matthew - China Trade & Politics") {
                    $('a[href^="http://"]').attr('target','_blank');
                    var link = pageIcon.link(doc.url);
                    var provider_link = pageIcon.link(doc.erflink);
                }
                else if (doc.collection==="Early Twentieth Century Chinese Books (1912-1949)") {
                    $('a[href^="http://"]').attr('target','_blank');
                    /*var url = doc.url;
                    var http="http://erf.sbb.spk-berlin.de/han/NLCminguo/";
                    var vor_link2 = url.replace(url,http+url.replace("http://",""));*/
                    var link = pageIcon.link(doc.url);
                    var provider_link = pageIcon.link(doc.erflink);
                }
                else if (doc.collection==="Adam Matthew - Foreign Office Files China & Japan") {
                    $('a[href^="http://"]').attr('target','_blank');
                    var link = pageIcon.link(doc.url);
                    var provider_link = pageIcon.link(doc.erflink);
                }
                else if (doc.collection==="Classical Works of Japan") {
                    $('a[href^="http://"]').attr('target','_blank');
                    var    link = bookIcon.link(doc.url);
                    var    provider_link = bookIcon.link(doc.erflink);
                }
                else if (doc.collection==="Siku quanshu") {
                    $('a[href^="http://"]').attr('target','_blank');
                    var    link = bookIcon.link(doc.url);
                    var    provider_link = bookIcon.link(doc.erflink);
                }
                else if (doc.collection==="CNKI eBooks") {
                    $('a[href^="http://"]').attr('target','_blank');
                    var link = pageIcon.link(doc.url);
                    var provider_link = pageIcon.link(doc.erflink);
                }
                else if (doc.collection==="Xuxiu Siku quanshu") {
                    $('a[href^="http://"]').attr('target','_blank');
                    var    link = bookIcon.link(doc.url);
                    var    provider_link = bookIcon.link(doc.erflink);
                }
                else if (doc.collection==="Daozang jiyao") {
                    $('a[href^="http://"]').attr('target','_blank');
                    var    link = bookIcon.link(doc.url);
                    var    provider_link = bookIcon.link(doc.erflink);
                }
                else if (doc.collection==="Fulltext search in print books") {
                    $('a[href^="http://"]').attr('target','_blank');
                    var    link = bookIcon.link(doc.url);
                    var    provider_link = bookIcon.link(doc.erflink);
                }
                else if (doc.collection==="Qingdai shiliao") {
                    $('a[href^="http://"]').attr('target','_blank');
                    var    link = bookIcon.link(doc.url);
                    var    provider_link = bookIcon.link(doc.erflink);
                }
                else if (doc.collection==="Gujin tushu jicheng") {
                    $('a[href^="http://"]').attr('target','_blank');
                    var    link = bookIcon.link(doc.url);
                    var    provider_link = bookIcon.link(doc.erflink);
                }
                else if (doc.collection==="China and the Modern World: Records of the Maritime Customs Service of China (1854-1949)") {
                    $('a[href^="http://"]').attr('target','_blank');
                    var    link = bookIcon.link(doc.url);
                    var    provider_link = bookIcon.link(doc.erflink);
                }
                else if (doc.collection==="Xuxiu") {
                    $('a[href^="http://"]').attr('target','_blank');
                    var    link = bookIcon.link(doc.url);
                    var    provider_link = bookIcon.link(doc.erflink);
                }
                if (doc.collection==="SBB digital : Western language Asia collection") {
                    $('a[href^="http://"]').attr('target','_blank');
                    var link = pageIcon.link(doc.url);
                    data += $("#docs").append('<tr>' +
                        '<td width="145"><span class="text" id="link">' + 'Digital SBB: </span></td><td width="145"><span class="textlink3">' + link + '</span>&nbsp;&nbsp;&nbsp;' +
                        '</span></td>' + '</tr>');
                }
                else {
                    $('a[href^="http://"]').attr('target','_blank');
                    data += $("#docs").append('<tr>' +
                        '<td width="145"><span class="text" id="link">' + 'CrossAsia licence: </span></td><td width="145"><span class="textlink">' + provider_link + '</span>&nbsp;&nbsp;&nbsp;' +
                        '<span id="link" class="text">' + 'provider link: </span><td><span class="textlink5">' + link + '</span></td>' +
                        '</tr>');
                }

                pages +=data;

            }

            else if (doc.hasModel=='Article') {
                $('a[href^="http://"]')
                    .attr('target','_blank');

                if (doc.wholeDate!=null) {
                    var rightDate = moment(doc.wholeDate.toString()).format("DD.MM.YYYY");
                }
                if (doc.text!=null) {
                    if (cur_doc_highlighting_title=='') {
                        data += $('#docs').append('<tr><th colspan="3"><hr class="line3"><span class="texttitle">'+"..."+doc.text + "..."+'</span></th></tr>');
                    }
                    else {
                        data += $('#docs').append('<tr><th colspan="3"><hr class="line3"><span class="texttitle">'+"..."+cur_doc_highlighting_title + "..."+'</span></th></tr>');
                    }
                    if (doc.collection==="Renmin Ribao") {
                        if (doc.title != null && doc.responsibility != null && doc.author != null && doc.date != null && doc.volume != null) {
                            data += $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top; width: 190px;">citation: </td><td colspan="2" class="textlenght"  style="vertical-align: top; max-width: 550px;"><span class="text2"><b>' + doc.title + ", " + doc.responsibility + '. ' + doc.author + '. ' + doc.date + '</b>, p.' + doc.page + " (vol. " + doc.volume + ", p. " + doc.position_vol + ")" + '</span></td></tr>');
                        } else if (doc.title != null && doc.responsibility != null && doc.author != null && doc.date != null) {
                            data += $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;  width: 190px;">citation: </td><td colspan="2" class="textlenght" class="textlenght" style="vertical-align: top; max-width: 550px;"><span class="text2"><b>' + doc.title + ", " + doc.responsibility + '. ' + doc.author + '. ' + doc.date + '</b>,  p.' + doc.page + '</span></td></tr>');
                        } else if (doc.title != null && doc.responsibility != null && doc.author != null) {
                            data += $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;  width: 190px;">citation: </td><td colspan="2" class="textlenght" class="textlenght" style="vertical-align: top; max-width: 550px;"><span class="text2"><b>' + doc.title + ", " + doc.responsibility + '. ' + doc.date + '</b>, p.' + doc.page + '</span></td></tr>');
                        } else if (doc.title != null && doc.responsibility != null) {
                            data += $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;  width: 190px;">citation: </td><td colspan="2" class="textlenght" style="vertical-align: top; max-width: 550px;"><span class="text2"><b>' + doc.title + ", " + doc.responsibility + '. ' + '</b>p.' + doc.page + " " + '</span></td></tr>');
                        } else if (doc.title != null && doc.author != null && doc.date != null) {
                            data += $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;  width: 190px;">citation: </td><td colspan="2" class="textlenght" style="vertical-align: top; max-width: 550px;"><span class="text2"><b>' + doc.title + ", " + doc.author + '. ' + doc.date + '</b>, p.' + doc.page + '</span></td></tr>');
                        } else if (doc.title != null && doc.author != null) {
                            data += $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;  width: 190px;">citation: </td><td colspan="2" class="textlenght" style="vertical-align: top; max-width: 550px;"><span class="text2"><b>' + doc.title + ", " + doc.author + '. ' + '</b>p.' + doc.page + '</span></td></tr>');
                        } else if (doc.title != null && doc.date != null) {
                            data += $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top; width: 190px;">citation: </td><td colspan="2" class="textlenght" style="vertical-align: top; max-width: 550px;"><span class="text2"><b>' + doc.title + ". " + doc.date + ', ' + '</b>p.' + doc.page +  '</span></td></tr>');
                        } else if (doc.title != null) {
                            data += $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top; width: 190px;">citation: </td><td colspan="2" class="textlenght" style="vertical-align: top; max-width: 550px;"><span class="text2"><b>' + doc.title + '. ' + '</b>,  p.' + doc.page + '</span></td></tr>');
                        }
                    } else if (doc.collection==="Missionary, Sinology, and Literary Periodicals (1817-1949)") {
                        var range = doc["page-range"];
                        if (doc.title!=null && doc.author!=null && doc["journal-title"] !=null && doc["publication-volume"]!=null && doc["volume-number"]!=null) {
                            data += $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;">citation: </td><td colspan="2" class="textlenght"><span class="text2"><b>' + doc.title + '</b>' +", "+doc.author+'.'+" In: "+doc["journal-title"]+" ,vol."+doc["publication-volume"]+", no."+doc["volume-number"]+ ", p." + doc["page-range"] +" ("+doc["date-original"]+")"+ '</span></td></tr>');
                        } else if (doc.title!=null && doc.author!=null && doc["journal-title"] !=null && doc["publication-volume"]!=null) {
                            data += $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;">citation: </td><td colspan="2" class="textlenght"><span class="text2"><b>' + doc.title + '</b>' +", "+doc.author+'.'+" In: "+doc["journal-title"]+" ,vol."+doc["publication-volume"]+ ", p." + doc["page-range"] +" ("+doc["date-original"]+")"+ '</span></td></tr>');
                        } else if (doc.title!=null && doc.author!=null && doc["journal-title"] !=null && doc["volume-number"]!=null) {
                            data += $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;">citation: </td><td colspan="2" class="textlenght"><span class="text2"><b>' + doc.title + '</b>' +", "+doc.author+'.'+", no."+doc["volume-number"]+ ", p." + doc["page-range"] +" ("+doc["date-original"]+")"+ '</span></td></tr>');
                        } else if (doc.title!=null && doc.author!=null && doc["journal-title"] !=null) {
                            data += $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;">citation: </td><td colspan="2" class="textlenght"><span class="text2"><b>' + doc.title + '</b>' +", "+doc.author+'.'+" In: "+doc["journal-title"]+ '</span></td></tr>');
                        }else if (doc.title!=null && doc.author!=null) {
                            data += $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;">citation: </td><td colspan="2" class="textlenght"><span class="text2"><b>' + doc.title + '</b>' +", "+doc.author+'.'+ '</span></td></tr>');
                        } else if (doc.title!=null) {
                            data += $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;">citation: </td><td colspan="2" class="textlenght"><span class="text2"><b>' + doc.title +  '</span></td></tr>');
                        }else if (doc.author!=null) {
                            data += $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;">citation: </td><td colspan="2" class="textlenght"><span class="text2">' +doc.author+'.'+")"+ '</span></td></tr>');
                        } else {
                            data += $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;">citation: </td><td colspan="2" class="textlenght"><span class="text2">In:'+doc["journal-title"]+ ", p." + doc["page-range"] +" ("+doc["date"]+")"+ '</span></td></tr>');
                        }
                    }
                }

                if (doc.text==null) {
                    if (doc.date!=null &&  doc.author!=null && doc.volume!=null) {
                        data += $('#docs').append('<tr><th colspan="3"><hr class="line3"><td>');
                        data += $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;">citation: </td><td colspan="2" class="textlenght" ><span class="text2"><b>'+ doc.title + ", " + doc.responsibility + '. ' + doc.author +'. ' + doc.date  + '</b>,  p.' + doc.page + " (vol. "+doc.volume+", p. "+doc.position_vol +")"+'</span></td></tr>');
                    }
                    else if (doc.date!=null &&  doc.author!=null) {
                        data += $('#docs').append('<tr><th colspan="3"><hr class="line3"><td>');
                        data += $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;">citation: </td><td colspan="2" class="textlenght" ><span class="text2"><b>'+ doc.title + ", " + doc.responsibility + '. ' + doc.author +'. ' + doc.date  + '</b>,  p.' + doc.page + ""+'</span></td></tr>');
                    }
                    else if (doc.date!=null) {
                        data += $('#docs').append('<tr><th colspan="3"><hr class="line3"><td>');
                        data += $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;">citation: </td><td colspan="2" class="textlenght" class="textlenght" ><span class="text2"><b>'+ doc.title + ", " + doc.responsibility + '. ' + doc.date  + '</b>,  p.' + doc.page + ""+ '</span></td></tr>');
                    } else if (doc.author!=null ) {
                        data += $('#docs').append('<tr><th colspan="3"><hr class="line3"><td>');
                        data += $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;">citation: </td><td colspan="2" class="textlenght" ><span class="text2"><b>'+ doc.title + ", " + doc.responsibility + '. ' + ", " + doc.author  + '</b>.  p.' + doc.page + ""+ '</span></td></tr>');
                    }  else  {
                        data += $('#docs').append('<tr><th colspan="3"><hr class="line3"><td>');
                        data +=  $('#docs').append('<tr><td colspan="1" class="text" style="vertical-align: top;">citation: </td><td colspan="2" class="textlenght"><span class="text2"><b>'+ doc.title + ", " + doc.responsibility + '. ' + '</b>,  p.'+doc.page+ ""+'</span></td></tr>');
                    }
                }
                if (doc.author != null) {
                    data += $('#docs').append('<tr><td colspan="1"><span class="text">' + 'author: </span></td><td colspan="2" class="textlenght"><span class="text2">' + doc.author +'</span></td></tr>');
                }
                if (doc.wholeDate!= null) {
                    data += $('#docs').append('<tr><td colspan="1"><span class="text"> date: </span></td><td colspan="2" class="textlenght"><span class="text2">' + rightDate + '</span></td></tr>');
                }

                if (doc.description != null) {
                        data += $('#docs').append('<tr><td colspan="1"><span class="text">' + 'note: </span></td><td colspan="2" class="textlenght"><span class="text2">' + doc.description + '</span></td></tr>');
                }

                if (doc.format != null) {
                    data += $('#docs').append('<tr><td colspan="1"><span class="text">' + 'format: </span></td><td colspan="2" class="textlenght"><span class="text2">' + doc.format + '</span></td></tr>');
                }
                data += $('#docs').append('<tr><td colspan="1"><span class="text">collection: </span></td><td colspan="2" class="textlenght"><span class="text2"> ' + doc.collection + '</span></td></tr>');

                if (doc.collection==="Renmin Ribao") {
                    var  link = databaseIcon.link(doc.url);
                    var provider_link = databaseIcon.link(doc.erflink);
                } else if (doc.collection==="Missionary, Sinology, and Literary Periodicals (1817-1949)") {
                    var link = pageIcon.link(doc.url);
                    var provider_link = pageIcon.link(doc.erflink);
                }

                data += $("#docs").append('<tr>' +
                        '<td width="145"><span class="text" id="link">' + 'CrossAsia licence: </span></td><td width="145"><span class="textlink">' + provider_link + '</span>&nbsp;&nbsp;&nbsp;' +
                        '<span id="link" class="text">' + 'provider link: </span><td><span class="textlink2">' + link + '</span></td>' +
                        '</tr>');

                articles +=data;
            }

            else if (doc.hasModel=='Book') {
                $('a[href^="http://"]').attr('target','_blank');

                if (doc.title!=null && doc.responsibility!=null && doc.author!=null && doc.date!=null) {
                    if  (cur_doc_highlighting_title=='') {
                        snippet += '<table class="books"><tr><th colspan="3"><hr class="line3"><span class="texttitle">' + doc.title +  ", "+ doc.responsibility+". " +  doc.date+'</span></th></tr>';
                    }
                }else if (doc.title!=null &&  doc.responsibility!=null && doc.date!=null) {
                    if  (cur_doc_highlighting_title=='') {
                        snippet += '<table class="books"><tr><th colspan="3"><hr class="line3"><span class="texttitle">' + doc.title + ", " + doc.responsibility + ". "+ doc.date+'</span></th></tr>';
                    }
                }else if (doc.title!=null &&  doc.responsibility!=null && doc.author!=null) {
                    if  (cur_doc_highlighting_title=='') {
                        snippet += '<table class="books"><tr><th colspan="3"><hr class="line3"><span class="texttitle">' + doc.title + ", " + doc.responsibility +  '</span></th></tr>';
                    }
                }else if (doc.title!=null &&  doc.author!=null && doc.date!=null) {
                    if  (cur_doc_highlighting_title=='') {
                        snippet += '<table class="books"><tr><th colspan="3"><hr class="line3"><span class="texttitle">' + doc.title + ", " + doc.author + ". "+ doc.date+'</span></th></tr>';
                    }
                }else if (doc.title!=null && doc.author!=null){
                    if  (cur_doc_highlighting_title=='') {
                        snippet += '<table class="books"><tr><th colspan="3"><hr class="line3"><span class="texttitle">' + doc.title + ", "+ doc.author+'</span></th></tr>';
                    }
                }else if (doc.title!=null && doc.date!=null){
                    if  (cur_doc_highlighting_title=='') {
                        snippet += '<table class="books"><tr><th colspan="3"><hr class="line3"><span class="texttitle">' + doc.title + ", "+ doc.date+'</span></th></tr>';
                    }
                }else {
                    if  (cur_doc_highlighting_title=='') {
                        snippet += '<table class="books"><tr><th colspan="3"><hr class="line3"><span class="texttitle">' + doc.title +  '</span></th></tr>';
                    }
                }

                if (doc.author!=null) {snippet +=  '<tr><td colspan="1"><span class="text">'+'author: </span></td><td colspan="2" class="textlenght"><span class="text2">' + doc.author; + '</span></td></tr>'}
                if (doc.date!=null) {
                    snippet +=  '<tr><td colspan="1"><span class="text"> date: </span></td><td colspan="2" class="textlenght"><span class="text2">' + doc.date+'</span></td></tr>';
                } else if (doc.date!=null && doc.issued!=null )
                {
                    snippet +=  '<tr><td colspan="1"><span class="text"> date: </span></td><td colspan="2" class="textlenght"><span class="text2">' + doc.date+'/'+ doc.issued+'</span></td></tr>';
                }
                if (doc.edition!=null) {snippet +=  '<tr><td colspan="1" class="text" style="vertical-align: top;">edition: </td><td colspan="2" class="textlenght"><span class="text2">' + doc.edition; + '</span></td></tr>'}

                //if (doc.subject!=null) {snippet +=  '<tr><td colspan="1" class="text" style="vertical-align: top;">subject: </td><td colspan="2" class="textlenght"><span class="text2">' + doc.subject; + '</span></td></tr>'}
                if (doc.series_title!=null) {snippet +=  '<tr><td colspan="1" class="text" style="vertical-align: top;">series: </td><td colspan="2" class="textlenght"><span class="text2">' + doc.series_title; + '</span></td></tr>'}

                if (doc.keywords!=null) {snippet +=  '<tr><td colspan="1" class="text" style="vertical-align: top;">note: </td><td colspan="2" class="textlenght"><span class="text2">' +
                    doc.keywords.toString().replace(/,/g,", ");+ '</span></td></tr>'}

                if (doc.noOfpages!=null) {snippet +=  '<tr><td colspan="1" class="text" style="vertical-align: top;">note: </td><td colspan="2" class="textlenght"><span class="text2">' + doc.noOfpages + ' pp.' + '</span></td></tr>'}

                if (doc.collection!="Xuxiu Siku quanshu") {
                    if (doc.publisher != null && doc.publication_place != null) {
                        snippet += '<tr><td colspan="1" class="text" style="vertical-align: top;">publisher: </td><td colspan="2" class="textlenght"><span class="text2">' + doc.publication_place + ":" + doc.publisher;
                        +'</span></td></tr>'
                    }
                     else if (doc.publisher!=null) {snippet +=  '<tr><td colspan="1" class="text" style="vertical-align: top;">publisher: </td><td colspan="2" class="textlenght"><span class="text2">' + doc.publisher; + '</span></td></tr>'}
                }
                //if (doc.medium!=null) {snippet +=  '<tr><td colspan="1" class="text" style="vertical-align: top;">medium: </td><td colspan="2" class="textlenght"><span class="text2">' + doc.medium; + '</span></td></tr>'}
                if (doc.description!=null && doc.extent!=null) {
                    snippet +=  '<tr><td colspan="1" class="text" style="vertical-align: top;">note: </td><td colspan="2" class="textlenght"><span class="text2">'+doc.extent+". " + doc.description; + '</span></td></tr>'
                }
                else if (doc.description!=null) {snippet +=  '<tr><td colspan="1" class="text" style="vertical-align: top;">note: </td><td colspan="2" class="textlenght"><span class="text2">' + doc.description; + '</span></td></tr>'}
                else if (doc.extent!=null) {snippet +=  '<tr><td colspan="1" class="text" style="vertical-align: top;">note: </td><td colspan="2" class="textlenght"><span class="text2">' + doc.extent; + '</span></td></tr>'}
                /*if (doc.note!=null) {
                    var note = doc.note.toString();
                    var note2 = note.replace("type=\"statement of responsibility\"","").replace("[","").replace("]","");
                    snippet +=  '<tr><td colspan="1"><span class="text">'+'note: </span></td><td colspan="2" class="textlenght"><span class="text2">' + note2; + '</span></td></tr>'
                }*/
                snippet +=   '<tr><td colspan="1"><span class="text">collection: </span></td><td colspan="2" class="textlenght"><span class="text2"> '+ doc.collection+'</span></td></tr>';

                if (doc.identifier!=null || doc.url) {
                    $('a[href^="http://"]').attr('target','_blank');

                    if (doc.collection==="China Comprehensive Gazetteers") {
                        $('a[href^="http://"]').attr('target','_blank');
                        var    link = bookIcon.link(doc.url);
                        var    provider_link = bookIcon.link(doc.erflink);
                    }
                    else if (doc.collection==="Local Gazetteer") {
                        $('a[href^="http://"]').attr('target','_blank');
                        var link = databaseIcon.link(doc.url);
                        var provider_link = databaseIcon.link(doc.erflink);
                    }
                    else if (doc.collection==="Local Gazetteer (Diaolong)") {
                        $('a[href^="http://"]').attr('target','_blank');
                        var    link = bookIcon.link(doc.url);
                        var    provider_link = bookIcon.link(doc.erflink);
                    }
                    else if (doc.collection==="SBB digital : Western language Asia collection"){
                        $('a[href^="http://"]').attr('target','_blank');
                        var link = bookIcon.link(doc.url);
                    }
                    else if (doc.collection==="Adam Matthew - China America Pacific") {
                        $('a[href^="http://"]').attr('target','_blank');
                        var    link = bookIcon.link(doc.url);
                        var    provider_link = bookIcon.link(doc.erflink);
                    }
                    else if (doc.collection==="Adam Matthew - China Trade & Politics") {
                        $('a[href^="http://"]').attr('target','_blank');
                        var    link = bookIcon.link(doc.url);
                        var    provider_link = bookIcon.link(doc.erflink);
                    }
                    else if (doc.collection==="Adam Matthew - Foreign Office Files China & Japan") {
                        $('a[href^="http://"]').attr('target','_blank');
                        var    link = bookIcon.link(doc.url);
                        var    provider_link = bookIcon.link(doc.erflink);
                    }
                    else if (doc.collection==="Airiti") {
                        $('a[href^="http://"]').attr('target','_blank');
                        var    link = bookIcon.link(doc.url);
                        var    provider_link = bookIcon.link(doc.erflink);
                    }
                    else if (doc.collection==="Gujin tushu jicheng") {
                        $('a[href^="http://"]').attr('target','_blank');
                        var    link = bookIcon.link(doc.url);
                        var    provider_link = bookIcon.link(doc.erflink);
                    }
                    else if (doc.collection==="Xuxiu Siku quanshu") {
                        $('a[href^="http://"]').attr('target','_blank');
                        var    link = bookIcon.link(doc.url);
                        var    provider_link = bookIcon.link(doc.erflink);
                    }
                    else if (doc.collection==="Adam Matthew - Meiji Japan"){
                        $('a[href^="http://"]').attr('target','_blank');
                        var    link = bookIcon.link(doc.url);
                        var    provider_link = bookIcon.link(doc.erflink);
                    }
                    else if (doc.collection==="China and the Modern World: Records of the Maritime Customs Service of China (1854-1949)") {
                        $('a[href^="http://"]').attr('target','_blank');
                        var    link = bookIcon.link(doc.url);
                        var    provider_link = bookIcon.link(doc.erflink);
                    }
                    else if (doc.collection==="Classical Works of Japan") {
                        $('a[href^="http://"]').attr('target','_blank');
                        var    link = bookIcon.link(doc.url);
                        var    provider_link = bookIcon.link(doc.erflink);
                    }
                    else if (doc.collection==="CNKI eBooks") {
                        $('a[href^="http://"]').attr('target','_blank');
                        var    link = bookIcon.link(doc.url);
                        var    provider_link = bookIcon.link(doc.erflink);
                    }
                    else if (doc.collection==="Siku quanshu") {
                        $('a[href^="http://"]').attr('target','_blank');
                        var    link = bookIcon.link(doc.url);
                        var    provider_link = bookIcon.link(doc.erflink);
                    }
                    else if (doc.collection==="Daozang jiyao") {
                        $('a[href^="http://"]').attr('target','_blank');
                        var    link = bookIcon.link(doc.url);
                        var    provider_link = bookIcon.link(doc.erflink);
                    }
                    else if (doc.collection==="Fulltext search in print books") {
                        $('a[href^="http://"]').attr('target','_blank');
                        var    link = bookIcon.link(doc.url);
                        var    provider_link = bookIcon.link(doc.erflink);
                    }
                    else if (doc.collection==="Early Twentieth Century Chinese Books (1912-1949)") {
                        $('a[href^="http://"]').attr('target','_blank');
                        var link = bookIcon.link(doc.url);
                        var    provider_link = bookIcon.link(doc.erflink);
                        /*var url = doc.url;
                        var http="http://erf.sbb.spk-berlin.de/han/NLCminguo/";
                        var vor_link2 = url.replace(url,http+url.replace("http://",""));
                        var provider_link = bookIcon.link(vor_link2);*/
                    }
                    else if (doc.collection==="Qingdai shiliao") {
                        $('a[href^="http://"]').attr('target','_blank');
                        var    link = bookIcon.link(doc.url);
                        var    provider_link = bookIcon.link(doc.erflink);
                    }
                    else if (doc.collection==="Xuxiu") {
                        $('a[href^="http://"]').attr('target','_blank');
                        var    link = bookIcon.link(doc.url);
                        var    provider_link = bookIcon.link(doc.erflink);
                    }

                    if (doc.collection==="SBB digital : Western language Asia collection") {
                        $('a[href^="http://"]').attr('target','_blank');
                        var link = bookIcon.link(doc.url);
                        snippet +=  '<tr>' +
                            '<td width="145"><span class="text" id="link">'+'Digital SBB: </span></td><td width="145"><span class="textlink3">' + link + '</span>&nbsp;&nbsp;&nbsp;' +
                            '</span></td>'+
                            '</tr>';
                    }
                    else {
                        $('a[href^="http://"]').attr('target','_blank');
                        snippet +=  '<tr>' +
                            '<td width="145"><span class="text" id="link">'+'CrossAsia licence: </span></td><td width="145"><span class="textlink">' + provider_link + '</span>&nbsp;&nbsp;&nbsp;' +
                            '<span id="link" class="text">'+'provider link: </span><td><span class="textlink4">' + link + '</span></td>'+
                            '</tr>';
                    }

                }
                snippet =  snippet + '</table></div>';
            }

            else if (doc.hasModel=="Chapter") {
                    $('a[href^="http://"]')
                        .attr('target','_blank');

                    data+= $("#docs").append("<tr><th colspan='3'><hr class='line3'><span class='texttitle'>"+doc.title_chapter+"</span></th></tr>");
                    if (doc.date!=null && doc.author!=null) {
                        data += $("#docs").append('<tr><td colspan="1" class="text" style="vertical-align: top;">citation: </td>' +
                            '<td colspan="2" class="textlenght"><span class="text2">' + doc.title + ', ' + doc.author +'. '+doc.date  + ', p.' + doc.pageStart + '-' + doc.pageEnd + '</span></td></tr>');
                    } else if (doc.date!=null) {
                        data += $("#docs").append('<tr><td colspan="1" class="text" style="vertical-align: top;">citation: </td>' +
                            '<td colspan="2" class="textlenght"><span class="text2">' + doc.title + ', ' +  docs.author + '. p.' + doc.pageStart + '-' + doc.pageEnd + '</span></td></tr>');
                    } else if (doc.author!=null) {
                        data += $("#docs").append('<tr><td colspan="1" class="text" style="vertical-align: top;">citation: </td>' +
                            '<td colspan="2" class="textlenght"><span class="text2">' + doc.title + ', ' + doc.date +  ', p.' + doc.pageStart + '-' + doc.pageEnd + '</span></td></tr>');
                    } else {
                        data += $("#docs").append('<tr><td colspan="1" class="text" style="vertical-align: top;">citation: </td>' +
                            '<td colspan="2" class="textlenght"><span class="text2">' + doc.title  +  '. p.' + doc.pageStart + '-' + doc.pageEnd + '</span></td></tr>');
                    }

                data +=   $("#docs").append('<tr><td colspan="1"><span class="text">collection: </span></td><td colspan="2" class="textlenght"><span class="text2"> '+ doc.collection+'</span></td></tr>');
                data +=   $("#docs").append('<tr>' +
                        '<td width="145"><span class="text" id="link">'+'CrossAsia licence: </span></td><td width="145"><span class="textlink">' + databaseIcon.link(doc.erflink) + '</span>&nbsp;&nbsp;&nbsp;' +
                        '<span id="link" class="text">'+'provider link: </span><td><span class="textlink2">' + databaseIcon.link(doc.url) + '</span></td>'+
                        '</tr>');
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
