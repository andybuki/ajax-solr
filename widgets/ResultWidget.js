(function ($) {

    AjaxSolr.ResultWidget = AjaxSolr.AbstractWidget.extend({
        start: 0,

        beforeRequest: function () {
            $(this.target).html($('<img>').attr('src', 'images/ajax-loader.gif'));
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
                items = items.concat(this.facetLinks('topics', doc.topics));
                items = items.concat(this.facetLinks('organisations', doc.organisations));
                items = items.concat(this.facetLinks('exchanges', doc.exchanges));

                var $links = $('#links_' + doc.id);
                $links.empty();
                for (var j = 0, m = items.length; j < m; j++) {
                    $links.append($('<li></li>').append(items[j]));
                }
            }
            /*for (var i = 0, l = this.manager.response.grouped.position.groups.length; i < l; i++) {
                for (var j = 0, m = this.manager.response.grouped.position.groups[i].doclist.docs.length; j < m; j++) {
                    var doc = this.manager.response.grouped.position.groups[i].doclist.docs[j];
                }
            }*/
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
            var url3 = this.manager.solrUrl+"select?fq=book_id="+doc.page_id+"&q=hasModel:Page&wt=json&rows=0&json.wrf=?&callback=?";
            var titles = "";
            var titles2 = "";
            var data="";
            var data2 ="";
            var str = "link";

            if (doc.hasModel=="Page") {
                $.when($.getJSON(url2), $.getJSON(url3)).then(function(data,data2){
                    if (data[0].response.docs[0].date!=0){
                        data =  $('#titles').append('<h4>'+
                            data[0].response.docs[0].title + '.  ' + data[0].response.docs[0].date+  ',  p.'+doc.position+'</h4>');
                    } else if (data[0].response.docs[0].issued!=null && data[0].response.docs[0].publisher=="Foreign Office"){
                        data =  $('#titles').append('<h4>'+
                            data[0].response.docs[0].title + '.  ' + data[0].response.docs[0].issued+  ',  p.'+doc.position+'</h4>');
                    } else if (data[0].response.docs[0].identifier!=null && data[0].response.docs[0].source=="Airiti eBook (lic.)") {
                        var page = parseInt(doc.position);
                        var combineLink = '&GoToPage='+page;
                        var link2 = (data[0].response.docs[0].identifier).replace('http://www.airitibooks.com/detail.aspx?','http://www.airitibooks.com.airiti.erf.sbb.spk-berlin.de/pdfViewer/index.aspx?');
                        var link = str.link(link2+combineLink);
                        data =  $('#titles').append('<h4>'+
                            data[0].response.docs[0].title + '.  ' + data[0].response.docs[0].issued+  ',  p.'+doc.position+'</h4>');

                        if (doc.text && doc.text.length > 300) {
                            if (doc.text!=null) {
                                data2 += $('#titles').append(doc.text.substring(0, 300));
                                data2 += $('#titles').append('<span style="display:none;">' + doc.text.substring(300));
                                data2 += $('#titles').append('</span> <a href="#" class="more">more</a>');
                                data2 += $('#titles').append('</br>'+'<p id="link">' + link + '</p>');
                            }
                        } else {
                            data2 += $('#titles').append(doc.text);
                            data2 += $('#titles').append('</br>'+'<p id="link">' + link + '</p>');
                        }

                    } else {
                        data =  $('#titles').append('<h4>'+
                            data[0].response.docs[0].title + '.  ' +  ',  p.'+doc.position+'</h4>');
                    }

                    if (doc.image_url!=null) {
                        var link = str.link(doc.image_url).replace("http://www.archivesdirect.amdigital.co.uk/Documents/Images/","http://www.archivesdirect.amdigital.co.uk.officefileschina.erf.sbb.spk-berlin.de/Documents/Images/");
                        if (doc.text && doc.text.length > 300) {
                            if (doc.text!=null) {
                                data2 += $('#titles').append(doc.text.substring(0, 300)+cur_doc_highlighting_txt);
                                data2 += $('#titles').append('<span style="display:none;">' + doc.text.substring(300)+cur_doc_highlighting_txt);
                                data2 += $('#titles').append('<br>'+doc.score);
                                data2 += $('#titles').append('</span> <a href="#" class="more">more</a>');
                                data2 += $('#titles').append('</br>'+'<p id="link">' + link + '</p>');
                            }
                        }

                    } else if (doc.page_id!=null) {
                        if (doc.text && doc.text.length > 300) {
                            if (doc.text!=null) {
                                data2 += $('#titles').append(doc.text.substring(0, 300)+cur_doc_highlighting_txt);
                                data2 += $('#titles').append('<span style="display:none;">' + doc.text.substring(300)+cur_doc_highlighting_txt);
                                data2 += $('#titles').append('<br>'+doc.score);
                                data2 += $('#titles').append('</span> <a href="#" class="more">more</a>');
                            }
                        } else {
                            data2 = $('#titles').append(doc.text)+cur_doc_highlighting_txt;
                        }
                    }
                });
                var output = '<div><span><span id="titles"></span></br>';
            }

            else if (doc.hasModel=='Book') {
                var output = '<div><h4>'  + doc.title + '</h4>';
                if (doc.author!=null) {
                    snippet +=  '<b>'+'Author = </b>' + doc.author; +'<br>'}

                //if (doc.title_transcription!=null) {snippet += '<br><b> ' +'Title transcription = </b>'+ doc.title_transcription;}
                /*if (doc.creator_transcription!=null) {
                    if (cur_doc_highlighting_txt!="......") {
                        snippet += '<br><b> ' +'Creator transcription = </b>'+doc.creator_transcription+cur_doc_highlighting_txt;
                    } else {
                        snippet += '<br><b> ' +'Creator transcription = </b>'+doc.creator_transcription;
                    }

                }*/
                //if (doc.medium!=null) {snippet +=  ' <br><b>' +'Medium = </b>'+ doc.medium}
                //if (doc.keywords!=null) {snippet +=  ' <br><b>' +'Keywords = </b>'+ doc.keywords;}
                if (doc.publisher!=null) {snippet +=  ' <b>' +'Edition = </b>'+ doc.publisher;}
                if (doc.publication_name!=null) {snippet +=  ','+ doc.publication_name;}
                if (doc.edition!=null) {snippet +=  ','+ doc.edition;}
                //if (doc.source!=null) {snippet +=  ' <br><b>' +'Source = </b>'+ doc.source;}
                //if (doc.issued!=null) {snippet +=  '<br><b> IssueNumber = </b>' + doc.issued;}
                if (doc.date!=null) {snippet +=  '<br><b> Date = </b>' + doc.date;
                    if (doc.issued!=null) {snippet +=  '/' + doc.issued;}
                }
                if (doc.date==null) {
                    if (doc.issued!=null) {snippet += '<br><b> Date = </b>' + doc.issued;}
                }

                if (doc.responsibility!=null) {
                    snippet +=  ' <br><b>' +'Note = </b>'+ doc.responsibility;
                }

                if (doc.series_title!=null) { snippet += ' <br><b>' +'Note = </b>'+ doc.series_title;
                    if (doc.source!=null) {snippet +=  ' ,'+ doc.source;}
                }

                if (doc.series_title==null) {
                    if (doc.source!=null) {snippet +=   ' <br><b>' +'Note = </b>'+ doc.source;}
                }

                if (doc.url!=null) {
                    var str = "link";
                    var link = str.link(doc.url);
                    snippet +=  ' <br>'+ '<span id="link">'+ link+'</span>';
                }

                if (doc.identifier!=null) {
                    var str = "link";
                    var link = str.link(doc.identifier).replace("http://www.airitibooks.com/detail.aspx?","http://erf.sbb.spk-berlin.de/han/airiti/www.airitibooks.com/Detail/Detail?");
                    snippet +=  ' <br>'+ '<span id="link">'+ link+'</span>';
                }
            }

            else if (doc.hasModel=="Chapter") {
                $.when($.getJSON(url2), $.getJSON(url3)).then(function(data,data2) {
                    data =  $('#titles').append('<h4>'+data[0].response.docs[0].title + '.  ' + data[0].response.docs[0].date+  ', '+doc.pageStart+'-'+doc.pageEnd +' p.</h4>');
                    data2 = $('#titles').append(doc.title);
                    //var output = '<div><h4>'  + doc.id + '</h4>';
                    //if (doc.title!=null) {snippet +=  doc.title;}
                });
                var output = '<div><span><span id="titles"></span>';
            }
            else {
                if (doc.id!=null) { snippet += doc.id+cur_doc_highlighting_txt;}
            }

            output += '<p>' + snippet + '</p></div>';
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