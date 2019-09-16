/*
This is a useful alternative to Ajax-Solr's TagcloudWidget.js and enables faceted filtering similar to many popular e-commerce sites such as Amazon.com, Walmart.com, etc. (i.e. facet values in ordered lists selected by checking checkboxes). Whereas TagcloudWidget.js shows facet values as a tag cloud and users can select a single facet value (and only a single facet value) by clicking on it, MultiSelectWidget.js shows the top facet values in a list ordered by count with checkboxes that the user can check to choose facet values (and more than one facet value for a facet can be selected, resulting in an "OR" query for the selected values). In addition to showing the top (e.g. top 20) facet values and allowing them to be easily selected by checking a checkbox, it also has a Jquery UI autocomplete where the user can choose any facet value (JSONP queries to Solr are done based on the users typed text in the autocomplete). Finally, it also supports binned ranges for numerical values (e.g. "0 TO 24", "25 TO 49", etc.), allowing sorting of the facet values based on the ranges instead of the counts (which can be more intuitive).

Configuration example, showing all configuration fields:

Manager.addWidget(new AjaxSolr.MultiSelectWidget({
                                                  id: fields[i], //Same as for TagcloudWidget.js
                                target: '#' + fields[i], //Same as for TagcloudWidget.js
                                field: fields[i], //Same as for TagcloudWidget.js
                                autocomplete_field: fields[i] + '_ci', //Name of Solr index field to use for autocomplete
                                autocomplete_field_case: 'lower', //'lower' or 'upper'; must exactly match case if not defined
                                max_show: 10, //maximum number of facet values to show before '+more' link
                                max_facets: 20, //maximum number of facet values to show after '+more' clicked
                                sort_type: 'count' //possible values: 'range', 'lex', 'count'
                               }));

                               Notes:

This widget also allows users to search all possible facet values via a Jquery UI autocomplete. If a value for 'autocomplete_field' is given, that
field will be searched by the Jquery UI autocomplete (i.e. it will issue Solr JSONP requests against that field). This can simply be the same value
as specified for 'field', or a separate case-insensitive version of that field. 'autocomplete_field_case' should specify what the case of
'autocomplete_field' is ('lower' or 'upper'). If no value is specified for 'autocomplete_field', then the widget will simply fetch all values
of the facet field, and then filter them case-insensitively in JavaScript; this should be fine for facet fields with a small number of values, but
could be very slow for facet fields with many facet values, and 'autocomplete_field' should be specified in these cases.

The top facet values will be sorted based on the value specified for 'sort_type':

'range' will assume the facet values are ranges, e.g. like "0 TO 24", "25 TO 49", etc., and will sort them numerically based on the
left side of the range
'count' will sort them based on their count in the current result set (i.e. how many documents in the current result set have the facet value)
'lex' will sort them alphabetically
*/

(function ($) {

    AjaxSolr.MultiSelectWidget = AjaxSolr.AbstractFacetWidget.extend({

        checkboxChange: function(facet) {
            var self = this;

            var innerCheckboxChange = function() {
                return(self.updateQueryDoRequest(facet,this.checked));
            };
            return(innerCheckboxChange);
        },

        autocompleteSelect: function() {
            var self = this;

            var innerAutocompleteSelect = function(event, ui) {
                return(self.updateQueryDoRequest(ui.item.value,true));
            };
            return(innerAutocompleteSelect);
        },

        autocompleteAjaxFunction: function() {
            var self = this;

            var autocompleteDoAjax = function(req,resp) {

                var autocompleteDoAjax_callback_gen = function(req,resp) {

                    var autocompleteDoAjax_callback = function(data) {
                        var field_facet_counts = data.facet_counts.facet_fields[self.field];
                        var matches_arr = [];
                        var match_regex = new RegExp(req.term,"i");
                        $.map(field_facet_counts, function(v,i) { if (i.match(match_regex)) { matches_arr.push(i); }});
                        matches_arr.sort(function(a,b) { return(field_facet_counts[b] - field_facet_counts[a]); });
                        resp(matches_arr);
                    };

                    return(autocompleteDoAjax_callback);
                };

                var search_term = req.term;
                var search_string;
                if (typeof self.autocomplete_field == 'undefined') { //Just get all facets and filter & sort in Javascript
                    search_string = 'facet=true&q=*:*&facet.field=' + self.field + '&facet.mincount=1&facet.threads=-1&json.nl=map';
                    //search_string = 'rows=0&facet=true&facet.limit=-1&q=*:*&facet.field=' + self.field + '&facet.mincount=1&facet.threads=-1&json.nl=map';
                } else { //have Solr do the filtering (but will still need to filter in JavaScript, for multi-valued fields),
                    //e.g. on a separate case-insensitive version of the field --- see here for how to set one up:
                    //http://stackoverflow.com/questions/2053214/how-to-create-a-case-insensitive-copy-of-a-string-field-in-solr
                    var search_query;
                    if (self.autocomplete_field_case == 'upper') {
                        search_query = self.autocomplete_field + ':*' + search_term.toUpperCase() + '*';
                    } else if (self.autocomplete_field_case == 'lower') {
                        search_query = self.autocomplete_field + ':*' + search_term.toLowerCase() + '*';
                    } else { //leave as-is
                        search_query = self.autocomplete_field + ':*' + search_term + '*';
                    }
                    search_string = 'facet=true&q=' + search_query + '&facet.field=' + self.field + '&facet.mincount=1&facet.threads=-1&json.nl=map';
                    //search_string = 'rows=0&facet=true&facet.limit=-1&q=' + search_query + '&facet.field=' + self.field + '&facet.mincount=1&facet.threads=-1&json.nl=map';
                }
                self.manager.executeRequest('select',search_string,autocompleteDoAjax_callback_gen(req,resp));
            };

            return(autocompleteDoAjax);
        },

        updateQueryDoRequest: function(facet, checked_flag) {

            var self = this;
            var check_state = self.check_state;
            if (typeof check_state == 'undefined') { self.check_state = {}; check_state = self.check_state; }
            if (checked_flag) { check_state[facet] = true; } else { delete check_state[facet]; }
            var checked_facets_arr = $.map(check_state, function(v,i) { return '"' + i + '"'; });
            self.manager.store.removeByValue('fq', new RegExp('^' + self.field));
            self.manager.store.removeByValue('facet.query', new RegExp('^' + self.field));
            if (checked_facets_arr.length > 0) {
                var solr_query;
                if (checked_facets_arr.length == 1) {
                    solr_query = self.field + ':' + checked_facets_arr[0];
                } else {
                    solr_query = self.field + ':(' + checked_facets_arr.join(" OR ") + ')';
                }
                self.manager.store.addByValue('fq' , solr_query);
                //Need to do explicit facet queries for user-chosen items (facet.field queries are not necessarily
                //returning full results each request, only up to facet.limit, and so it is possible user-chosen ones
                //wouldn't be among top returned values so need to explicitly get their counts)
                for (var i=0; i < checked_facets_arr.length; i++) {
                    var cur_facet_query = self.field + ':' + checked_facets_arr[i];
                    self.manager.store.addByValue('facet.query' , cur_facet_query);
                }
            }
            self.doRequest();
            return false;
        },

        sortFacets: function(objectedItems) {
            var sort_type = this.sort_type;
            if (typeof sort_type == 'undefined') { sort_type = 'count'; }
            if (sort_type == 'range') { //All the facet values should be like '20 TO 40', '50 TO 100', etc. or this sort type won't work
                objectedItems.sort(function (a, b) {
                    if (typeof a.start == 'undefined') { return 1; }
                    if (typeof b.start == 'undefined') { return -1; }
                    return a.start < b.start ? -1 : 1;
                });
            } else if (sort_type == 'lex') { //sort facets alphabetically
                objectedItems.sort(function (a, b) {
                    return a.facet < b.facet ? -1 : 1;
                });
            } else if (sort_type == 'count') { //the count in the current result set
                objectedItems.sort(function (a, b) {
                    return b.count < a.count ? -1 : 1;
                });
            }
        },

        toggleExtra: function(show_more_div_id) {
            var self = this;
            var clickFunc = function() {
                var el = document.getElementById(show_more_div_id);
                var el_txt = document.getElementById(show_more_div_id + '_txt');

                if (el && el_txt) {
                    if ( el.style.display != 'none' ) {
                        el.style.display = 'none';
                        el_txt.innerHTML = '+more';
                        //el_txt.innerHTML = numberMore;
                        self.display_style = 'none';
                    } else {
                        el.style.display = '';
                        el_txt.innerHTML = '-less';
                        self.display_style = '';
                    }
                }
                return false;
            };
            return(clickFunc);
        },

        setRangeFacetStartEnd: function(facet, facet_rec) {
            var start_matches = facet.match(/^(\d+)/);
            var end_matches = facet.match(/(\d+)$/);
            if (start_matches && start_matches.length > 1) {
                facet_rec.start = parseInt(start_matches[1]);
            }
            if (end_matches && end_matches.length > 1) {
                facet_rec.end = parseInt(end_matches[1]);
            }
        },

        afterRequest: function () {

            var returned_facets = this.manager.response.facet_counts.facet_fields[this.field];
            //console.log(Object.keys(returned_facets).length);


            if (returned_facets === undefined) {
                returned_facets = {};
            }

            if (!(this.manager.store.find('fq', new RegExp('^' + this.field)))) { //reset --> all checks off
                this.check_state = {};
            }

            if (typeof this.display_style == 'undefined') {
                this.display_style = 'none';
            }

            var checked_objectedItems = [];
            var unchecked_objectedItems = [];
            var cur_facets_hash = {};

            for (var facet in returned_facets) {
                var count = parseInt(returned_facets[facet]);
                var facet_rec = { facet: facet, count: count };
                if (this.sort_type == 'range') {
                    this.setRangeFacetStartEnd(facet, facet_rec);
                }

                if (this.check_state && this.check_state[facet]) {
                    checked_objectedItems.push(facet_rec);
                } else {
                    unchecked_objectedItems.push(facet_rec);
                }
                cur_facets_hash[facet] = facet_rec;
            }

            if (typeof this.check_state != 'undefined') {
                var num_checked_facets = Object.keys(this.check_state).length;
                if (num_checked_facets > checked_objectedItems.length) { //some checked items not present in current result set, need to add them from full result set
                    for (var cur_checked_facet in this.check_state) {
                        if (!cur_facets_hash[cur_checked_facet]) { //Add a new record, getting count from facet query done for it)
                            var new_facet_rec = { facet: cur_checked_facet };
                            if (this.sort_type == 'range') {
                                this.setRangeFacetStartEnd(facet, new_facet_rec);
                            }

                            new_facet_rec.count = parseInt(this.manager.response.facet_counts.facet_queries[this.field + ':"' + cur_checked_facet + '"']);
                            if (typeof new_facet_rec.count == 'undefined') { new_facet_rec.count = 0; } //if for some strange reason no facet query value...
                            checked_objectedItems.push(new_facet_rec);
                            cur_facets_hash[cur_checked_facet] = new_facet_rec;
                        }
                    }
                }
            }

            this.sortFacets(checked_objectedItems);
            this.sortFacets(unchecked_objectedItems);

            var objectedItems = checked_objectedItems.concat(unchecked_objectedItems);

            if (typeof this.init_objectedItems == 'undefined') {
                //  $.extend(cur_facets_hash_copy, cur_facets_hash );
                var objectedItems_copy = JSON.parse(JSON.stringify(objectedItems));
                var cur_facets_hash_copy = JSON.parse(JSON.stringify(cur_facets_hash));
                this.init_objectedItems = objectedItems_copy;
                this.init_facets_hash = cur_facets_hash_copy;
            }

            if (typeof this.max_facets != 'undefined') {
                if (objectedItems.length < this.max_facets) {
                    var num_to_add_from_init = this.max_facets - objectedItems.length;
                    if (num_to_add_from_init > this.init_objectedItems.length) {
                        num_to_add_from_init = this.init_objectedItems.length;
                    }
                    for (var i=0; i < this.init_objectedItems.length; i++) {
                        if (!cur_facets_hash[this.init_objectedItems[i].facet]) {
                            objectedItems.push(this.init_objectedItems[i]);
                            if (--num_to_add_from_init <= 0) { break; }
                        }
                    }
                } else if (objectedItems.length > this.max_facets) { //bug: if user checks a lot, some won't be shown; fixed below, but check it more
                    if (checked_objectedItems.length >= this.max_facets) {
                        objectedItems = checked_objectedItems;
                    } else {
                        objectedItems.length = this.max_facets;
                    }
                }
            } else {
                var num_to_add_from_init = this.init_objectedItems.length;
                for (var i=0; i < num_to_add_from_init; i++) {
                    if (!cur_facets_hash[this.init_objectedItems[i].facet]) {
                        objectedItems.push(this.init_objectedItems[i]);
                    }
                }
            }

            var show_more_div_id = 'more_' + this.field;
            $(this.target).empty();
            var num_hidden = 0;
            var ac_id = this.field + '_all_extra';
            if (num_hidden > 0) {
                //$('#' + show_more_div_id).append('Or search: ');

                $('#' + show_more_div_id).append($('<input id="' + ac_id + '">'+'<br>'));


            } else {
                //$(this.target).append('Or search: ');
                $(this.target).append($('<input id="' + ac_id + '">'+'<br>'));
            }

            for (var i = 0; i < objectedItems.length; i++) {
                var facet = objectedItems[i].facet;
                var count ='undefined';
                var cur_facet_count = (typeof cur_facets_hash[facet] != 'undefined') ? cur_facets_hash[facet].count : 0;
                var all_facet_cout = objectedItems.length;
                var facet_num= all_facet_cout-10;

                var checked_txt = '';
                if (this.check_state && this.check_state[facet]) {
                    checked_txt = ' checked=true';
                }
                if ((typeof this.max_show == 'undefined') ||
                    (i < this.max_show)) {
                    if (cur_facet_count != 0) {
                        $(this.target).append(
                            $('<input type=checkbox class="cheki" id="' + this.field + '_' + facet + '_checkbox"' + checked_txt + '></input>')
                                .change(this.checkboxChange(facet))
                        );
                    }

                    var thechosenone="";

                    if (this.field==='collection' && cur_facet_count != 0) {
                        //console.log(facet);
                        if (facet==="Renmin Ribao" ) {
                            $(this.target).append($('<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo\');" onmouseover="" style="cursor: pointer;">' +
                                '<svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" style="font-size: 2em; color: rgb(180, 24, 21);">' +
                                '<path d="M1024 1376v-160q0-14-9-23t-23-9h-96v-512q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v160q0 14 9 23t23 9h96v320h-96q-14 0-23 9t-9 23v160q0 14 9 23t23 9h448q14 0 23-9t9-23zM896 480v-160q0-14-9-23t-23-9h-192q-14 0-23 9t-9 23v160q0 14 9 23t23 9h192q14 0 23-9t9-23zM1536 896q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"></path>  <!----></svg></a>' +
                                '' +
                                '<div class="menu" id="foo" style="display:none"><a onclick="show_hidePopUpWindow(\'foo\');"> <svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" id="close_button" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1490 1322q0 40-28 68l-136 136q-28 28-68 28t-68-28l-294-294-294 294q-28 28-68 28t-68-28l-136-136q-28-28-28-68t28-68l294-294-294-294q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294 294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68l-294 294 294 294q28 28 28 68z"/>  <!----></svg></a><b>人民日报 : People\'s Daily </b>\n' +
                                '<br><b>CONTENT:</b> Fulltexts of all articles from the inception of the People\'s Daily in 1946 to end of August 2009. Articles will be shown as individual hits of the issue of a certain day.\n' +
                                '<br><b>NOTE:</b> To see the image-PDF of the issue you will have go to the database (http://erf.sbb.spk-berlin.de/han/RenminRibao1/) and open the issue via the calendar browse function provided in the database.\n</div>'));
                        }
                        if (facet==="Airiti") {
                            $(this.target).append($('<span> </span> <a class="airiti2" onclick="show_hidePopUpWindow(\'foo2\');" onmouseover="" style="cursor: pointer;"> <svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1024 1376v-160q0-14-9-23t-23-9h-96v-512q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v160q0 14 9 23t23 9h96v320h-96q-14 0-23 9t-9 23v160q0 14 9 23t23 9h448q14 0 23-9t9-23zM896 480v-160q0-14-9-23t-23-9h-192q-14 0-23 9t-9 23v160q0 14 9 23t23 9h192q14 0 23-9t9-23zM1536 896q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"></path>  <!----></svg></i></a>' +
                                '' +
                                '<div class="menu" id="foo2" style="display:none"> <a class="click" onclick="show_hidePopUpWindow(\'foo2\');"><svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" id="close_button" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1490 1322q0 40-28 68l-136 136q-28 28-68 28t-68-28l-294-294-294 294q-28 28-68 28t-68-28l-136-136q-28-28-28-68t28-68l294-294-294-294q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294 294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68l-294 294 294 294q28 28 28 68z"/>  <!----></svg></a><b>Airiti eBooks </b>\n' +
                                '<br><b>CONTENT:</b>  Currently 75 titles of the Airiti eBook platform have been licenced and are available for fulltext search. The corpus of licenced titles will be update yearly. For the Airiti ebook database go to 華藝中文電子書 : airitiBooks <a href="http://erf.sbb.spk-berlin.de/han/airiti/www.airitibooks.com/">LINK</a>\n' +
                                '<br><b>NOTE:</b> To see your hit page, please follow the link provided next to the fulltext hit. Due to the licence agreement it is only possible to open one double-page (window) per book at the same time. If you can\'t find the hit on the pages shown, please check the previous or subsequent pages, or perform a search within the book.\n</div>'));

                        }
                        if (facet==="Adam Matthew - Foreign Office Files China & Japan") {
                            $(this.target).append($('<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo3\');" onmouseover="" style="cursor: pointer;"> <svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" style="font-size: 2em; color: rgb(180, 24, 21);">' +
                                '<path d="M1024 1376v-160q0-14-9-23t-23-9h-96v-512q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v160q0 14 9 23t23 9h96v320h-96q-14 0-23 9t-9 23v160q0 14 9 23t23 9h448q14 0 23-9t9-23zM896 480v-160q0-14-9-23t-23-9h-192q-14 0-23 9t-9 23v160q0 14 9 23t23 9h192q14 0 23-9t9-23zM1536 896q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"></path>  <!----></svg></a>' +
                                '' +
                                '<div class="menu" id="foo3" style="display:none"> <a onclick="show_hidePopUpWindow(\'foo3\');"><svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" id="close_button" style="font-size: 2em; color: rgb(180, 24, 21);">' +
                                '<path d="M1490 1322q0 40-28 68l-136 136q-28 28-68 28t-68-28l-294-294-294 294q-28 28-68 28t-68-28l-136-136q-28-28-28-68t28-68l294-294-294-294q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294 294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68l-294 294 294 294q28 28 28 68z"/>  <!----></svg></a><b>Adam Matthew - Foreign Office Files China & Japan </b>\n' +
                                '<br><b>CONTENT:</b> The collection of Foreign Office Files for China is based on the holdings of the National Archives, Kew, the official archive of the United Kingdom; that for Japan is sourced from the rich FO 371 and FO 262 series at The National Archives, UK, including some formerly restricted Japan-specific documents, and is further enhanced by the addition of a selection of FO 371 Far Eastern General sub-series, and Western and American Department papers. The Foreign Office Files contain diplomatic correspondence, letters, reports, surveys, material from newspapers, statistical analyses, published pamphlets, ephemera, military papers, profiles of prominent individuals, maps and many other types of document. The China and Japan series are subdivided into time segments of specific political interest. \n' +
                                /*'The collection is divided into the six parts: \n' +
                                '<br>1919-1929: Kuomintang, CCP and the Third International \n' +
                                '<br>1930-1937: The Long March, civil war in China and the Manchurian Crisis \n' +
                                '<br>1938-1948: Open Door, Japanese war and the seeds of communist victory \n' +
                                '<br>1949-1956: The Communist revolution \n' +
                                '<br>1957-1966: The Great Leap Forward \n' +
                                '<br>1967-1980: The Cultural Revolution\n' +*/
                                '<br><b>NOTE:</b> The full text was done by OCR from partly handwritten material, thus the text is often of minor quality.</div>'));

                        }
                        if (facet==="Early Twentieth Century Chinese Books (1912-1949)") {
                            $(this.target).append($('<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo35\');" onmouseover="" style="cursor: pointer;"> <svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1024 1376v-160q0-14-9-23t-23-9h-96v-512q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v160q0 14 9 23t23 9h96v320h-96q-14 0-23 9t-9 23v160q0 14 9 23t23 9h448q14 0 23-9t9-23zM896 480v-160q0-14-9-23t-23-9h-192q-14 0-23 9t-9 23v160q0 14 9 23t23 9h192q14 0 23-9t9-23zM1536 896q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"></path>  <!----></svg></a>' +
                                '' +
                                '<div class="menu" id="foo35" style="display:none"> <a onclick="show_hidePopUpWindow(\'foo35\');"><svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" id="close_button" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1490 1322q0 40-28 68l-136 136q-28 28-68 28t-68-28l-294-294-294 294q-28 28-68 28t-68-28l-136-136q-28-28-28-68t28-68l294-294-294-294q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294 294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68l-294 294 294 294q28 28 28 68z"/>  <!----></svg></a><b>Early Twentieth Century Book in China (1912-1949) </b>\n' +
                                '<br><b>CONTENT:</b> Covering the Republican Period of mainland China fulltexts (and images) of over 180,000 titles of the whole spectrum of topics are included in this resource (Early Twentieth Century Book in China (1912-1949) / 民國圖書數據庫). Books are mostly Chinese, but are actually in Japanese. Unfortunately the metadata does not provide this information.\n'+
                                '<br><b>NOTE:</b> Fulltext has been done with OCR, so a certain amount of mistakes are to be expected. In cases where no “meaningful” content could be produced no fulltext page exists. Links to the book and the individual pages are provided in the list of hits.</div>'));

                        }
                        if (facet==="Local Gazetteer") {
                            $(this.target).append($('<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo4\');" onmouseover="" style="cursor: pointer;"> ' +
                                '<svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" style="font-size: 2em; color: rgb(180, 24, 21);">' +
                                '<path d="M1024 1376v-160q0-14-9-23t-23-9h-96v-512q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v160q0 14 9 23t23 9h96v320h-96q-14 0-23 9t-9 23v160q0 14 9 23t23 9h448q14 0 23-9t9-23zM896 480v-160q0-14-9-23t-23-9h-192q-14 0-23 9t-9 23v160q0 14 9 23t23 9h192q14 0 23-9t9-23zM1536 896q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"></path>  <!----></svg></a>' +
                                '' +
                                '<div class="menu" id="foo4" style="display:none"> <a onclick="show_hidePopUpWindow(\'foo4\');"><svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" id="close_button" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1490 1322q0 40-28 68l-136 136q-28 28-68 28t-68-28l-294-294-294 294q-28 28-68 28t-68-28l-136-136q-28-28-28-68t28-68l294-294-294-294q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294 294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68l-294 294 294 294q28 28 28 68z"/>  <!----></svg></a><b>Local Gazetters </b>\n' +
                                '<br><b>CONTENT:</b> This collection currently contains the first two batches of the Erudition database 中國方志庫 of together 3,997 local gazetteer titles with about 4,65 mio. pages. \n' +
                                '<br><b>NOTE:</b> For the Erudition corpus currently no link to the book title in the database is possible. To see your hit page in the database please call-up the Erudition database (link provided with the title), search for your book (title as given in the hit) and go the image/page given for your hit page.\n</div>'));

                        }
                        if (facet==="Missionary, Sinology, and Literary Periodicals (1817-1949)") {
                            $(this.target).append($('<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo47\');" onmouseover="" style="cursor: pointer;"> ' +
                                '<svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" style="font-size: 2em; color: rgb(180, 24, 21);">' +
                                '<path d="M1024 1376v-160q0-14-9-23t-23-9h-96v-512q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v160q0 14 9 23t23 9h96v320h-96q-14 0-23 9t-9 23v160q0 14 9 23t23 9h448q14 0 23-9t9-23zM896 480v-160q0-14-9-23t-23-9h-192q-14 0-23 9t-9 23v160q0 14 9 23t23 9h192q14 0 23-9t9-23zM1536 896q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"></path>  <!----></svg></a>' +
                                '' +
                                '<div class="menu" id="foo47" style="display:none"> <a onclick="show_hidePopUpWindow(\'foo47\');"><svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" id="close_button" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1490 1322q0 40-28 68l-136 136q-28 28-68 28t-68-28l-294-294-294 294q-28 28-68 28t-68-28l-136-136q-28-28-28-68t28-68l294-294-294-294q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294 294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68l-294 294 294 294q28 28 28 68z"/>  <!----></svg></a><b>Missionary, Sinology, and Literary Periodicals (1817-1949) </b>\n' +
                                '<br><b>CONTENT:</b> The resource contains the main English-language periodicals published in or about China covering the period from 1817 until the founding of the People’s Republic of China in 1949. The journals feature photographs and articles the on the founding and development of Christian higher education in China. \n' +
                                '<br><b>NOTE:</b> The fulltexts are not split into the actual pages, but contain the whole article. The links provided thus open the article at the start page and the search term may appear only on a later page. To get to the correct page please use the “Search within – Article” to left of the article display in the database. \n</div>'));

                        }
                        if (facet==='Local Gazetteer (Diaolong)') {
                            //console.log(facet);
                            $(this.target).append($('<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo45\');" onmouseover="" style="cursor: pointer;"><svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1024 1376v-160q0-14-9-23t-23-9h-96v-512q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v160q0 14 9 23t23 9h96v320h-96q-14 0-23 9t-9 23v160q0 14 9 23t23 9h448q14 0 23-9t9-23zM896 480v-160q0-14-9-23t-23-9h-192q-14 0-23 9t-9 23v160q0 14 9 23t23 9h192q14 0 23-9t9-23zM1536 896q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"></path>  <!----></svg></a>' +
                                '' +
                                '<div class="menu" id="foo45" style="display:none"> <a onclick="show_hidePopUpWindow(\'foo45\');"><svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" id="close_button" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1490 1322q0 40-28 68l-136 136q-28 28-68 28t-68-28l-294-294-294 294q-28 28-68 28t-68-28l-136-136q-28-28-28-68t28-68l294-294-294-294q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294 294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68l-294 294 294 294q28 28 28 68z"/>  <!----></svg></a><b>Local Gazetteers (Diaolong) </b>\n' +
                                '<br><b>CONTENT:</b> Containing 2194 titles in the first and 1935 in the sequel collection this resource of historical local gazetteers covers the period from Song to Republican times grouped into 31 regional areas. The names of these areas and their sub-regions appear as subject/spatial for filtering the search results. \n' +
                                '<br><b>NOTE:</b> No links to the individual pages in the database are possible. To find your hit page in the database you have to open the title (follow the \'book\' link) and then go to the page number given in the page hit. \n</div>'));

                        }
                        if (facet==='Qingdai shiliao') {
                            //console.log(facet);
                            $(this.target).append($('<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo41\');" onmouseover="" style="cursor: pointer;"><svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1024 1376v-160q0-14-9-23t-23-9h-96v-512q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v160q0 14 9 23t23 9h96v320h-96q-14 0-23 9t-9 23v160q0 14 9 23t23 9h448q14 0 23-9t9-23zM896 480v-160q0-14-9-23t-23-9h-192q-14 0-23 9t-9 23v160q0 14 9 23t23 9h192q14 0 23-9t9-23zM1536 896q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"></path>  <!----></svg></a>' +
                                '' +
                                '<div class="menu" id="foo41" style="display:none"> <a onclick="show_hidePopUpWindow(\'foo41\');"><svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" id="close_button" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1490 1322q0 40-28 68l-136 136q-28 28-68 28t-68-28l-294-294-294 294q-28 28-68 28t-68-28l-136-136q-28-28-28-68t28-68l294-294-294-294q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294 294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68l-294 294 294 294q28 28 28 68z"/>  <!----></svg></a><b>清代史料 </b>\n' +
                                '<br><b>CONTENT:</b> The collection contains historical sources of the Qing dynasty published by the Qing state. They belong to five types of documents: Veritable Records (實錄), Collected Statutes (會典), Records of Officials (缙绅錄), different editions of  the Guide to the Qing board of war (大清中樞備覽) as well as the Qing Essentials for Governance (大清輔政要覽全書), and  finally materials closely related to the emperor such as the Court Diaries (起居注, currently only Tongzhi 同治). \n' +
                                '<br><b>NOTE:</b> No links to the individual pages in the database are possible. To find your hit page in the database you have to open the title (follow the \'book\' link in the title data) and then go to the page number given in the page hit.\n</div>'));

                        }
                        if (facet==='Western language East Asia Collection (SBB Digital Collection)') {
                            //console.log(facet);
                            $(this.target).append($('<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo401\');" onmouseover="" style="cursor: pointer;"><svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1024 1376v-160q0-14-9-23t-23-9h-96v-512q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v160q0 14 9 23t23 9h96v320h-96q-14 0-23 9t-9 23v160q0 14 9 23t23 9h448q14 0 23-9t9-23zM896 480v-160q0-14-9-23t-23-9h-192q-14 0-23 9t-9 23v160q0 14 9 23t23 9h192q14 0 23-9t9-23zM1536 896q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"></path>  <!----></svg></a>' +
                                '' +
                                '<div class="menu" id="foo401" style="display:none"> <a onclick="show_hidePopUpWindow(\'foo401\');"><svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" id="close_button" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1490 1322q0 40-28 68l-136 136q-28 28-68 28t-68-28l-294-294-294 294q-28 28-68 28t-68-28l-136-136q-28-28-28-68t28-68l294-294-294-294q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294 294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68l-294 294 294 294q28 28 28 68z"/>  <!----></svg></a><b>Western language East Asia Collection (SBB Digital Collection) </b>\n' +
                                '<br><b>CONTENT:</b> In the current version the dataset contains the OCR  fulltexts of 4653 titles of the East Asia Collection (Ostasiatica) digitized in the “SSG 6.25 digital“ project funded by the DFG. The titles were selected according to their allocation as materials concerning East and Southeast Asia in the “Alte Realkatalog”  <a href="http://ark.staatsbibliothek-berlin.de">(http://ark.staatsbibliothek-berlin.de)</a>. The material is mainly in Dutch, English, German and French, but does also contain texts in Spanish, Italian, Latin, Russian and Portuguese. \n' +
                                '<br><b>NOTE:</b> The fulltext is produced by OCR. For the hits we provide links to the book or journal and the individual page display in the Digital Collection of the SBB. The material is in the public domain.\n</div>'));

                        }
                        if (facet==='Daozang jiyao') {
                            //console.log(facet);
                            $(this.target).append($('<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo42\');" onmouseover="" style="cursor: pointer;"><svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1024 1376v-160q0-14-9-23t-23-9h-96v-512q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v160q0 14 9 23t23 9h96v320h-96q-14 0-23 9t-9 23v160q0 14 9 23t23 9h448q14 0 23-9t9-23zM896 480v-160q0-14-9-23t-23-9h-192q-14 0-23 9t-9 23v160q0 14 9 23t23 9h192q14 0 23-9t9-23zM1536 896q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"></path>  <!----></svg></a>' +
                                '' +
                                '<div class="menu" id="foo42" style="display:none"> <a onclick="show_hidePopUpWindow(\'foo42\');"><svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" id="close_button" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1490 1322q0 40-28 68l-136 136q-28 28-68 28t-68-28l-294-294-294 294q-28 28-68 28t-68-28l-136-136q-28-28-28-68t28-68l294-294-294-294q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294 294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68l-294 294 294 294q28 28 28 68z"/>  <!----></svg></a><b>道藏輯要 </b>\n' +
                                '<br><b>CONTENT:</b> The "Essentials of the Daoist Canon" counts as the main collection of Daoist texts after the Daozang. Its bibliographical history is rather complicated and subject to discussion. After a first version of the "Essentials" was compiled around 1700, in the 18th and 19th century several re-editions and addition were made to the set of texts until in 1906 He Longxiang 賀龍驤 and Peng Hanran 彭瀚然 published the 重刊道藏輯要 in Chengdu. The texts of the "Essentials" chiefly derive from Zhengtong Daozang 正統到藏 edition (1445) but it also contains some additional texts or other editions of Zhengtong texts. The 299 texts and scans in this collection are those of the 1906 printed version of the Daozang jiyao. \n' +
                                '<br><b>NOTE:</b> No links to the individual pages in the database are possible. To find your hit page in the database you have to open the title (follow the \'book\' link in the title data) and then go to the page number given in the page hit.\n</div>'));
                        }
                        if (facet==='Xuxiu Siku quanshu') {
                            //console.log(facet);
                            $(this.target).append($('<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo5\');" onmouseover="" style="cursor: pointer;"><svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1024 1376v-160q0-14-9-23t-23-9h-96v-512q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v160q0 14 9 23t23 9h96v320h-96q-14 0-23 9t-9 23v160q0 14 9 23t23 9h448q14 0 23-9t9-23zM896 480v-160q0-14-9-23t-23-9h-192q-14 0-23 9t-9 23v160q0 14 9 23t23 9h192q14 0 23-9t9-23zM1536 896q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"></path>  <!----></svg></a>' +
                                '' +
                                '<div class="menu" id="foo5" style="display:none"> <a onclick="show_hidePopUpWindow(\'foo5\');"><svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" id="close_button" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1490 1322q0 40-28 68l-136 136q-28 28-68 28t-68-28l-294-294-294 294q-28 28-68 28t-68-28l-136-136q-28-28-28-68t28-68l294-294-294-294q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294 294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68l-294 294 294 294q28 28 28 68z"/>  <!----></svg></a><b>Xuxiu Siku Quanshu 續修四庫全書 </b>\n' +
                                '<br><b>CONTENT:</b> With over 5000 titles the \'Sequel to the Siku quanshu\', continues emperor Qianlong\'s project of the late 18th century. The Xuxiu Siku quanshu project ran from the 1920ies on aiming to collect titles produced after the finishing of the Siku quanshu collection (SKQS) in 1782, to reproduce editions better and less corrupted than those included in the SKQS, to include novels and other literary styles considered too lowly by the SKQS editors asf. In 1942 the project came to a full stop with over 30 thousand book abstracts written. In 1949 the drafts of these abstracts went into the possession of the library of the Chinese Academy of Science (中科院) in Beijing; finally in 1996 these abstracts were published in 37 volumes under the title 续修四库全书总目提要 (稿本); between 1995 and 2002 facsimiles of over 5213 titles of the Xuxiu SKQS were published in 1800 volumes by Shanghai guji chubanshe. The publishing of a fulltext database of all titles from the Shanghai edition (and 100+ additional titles) can be considered another milestone for everyone working in one or the other way on historical China. \n' +
                                '<br><b>NOTE:</b> No links to the individual pages in the database are possible. To find your hit page in the database you have to open the title (follow the \'book\' link in the title data) and then go to the page number given in the page hit.\n</div>'));

                        }
                        if (facet==='Adam Matthew - China America Pacific') {
                            $(this.target).append($('<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo6\');" onmouseover="" style="cursor: pointer;"> <svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1024 1376v-160q0-14-9-23t-23-9h-96v-512q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v160q0 14 9 23t23 9h96v320h-96q-14 0-23 9t-9 23v160q0 14 9 23t23 9h448q14 0 23-9t9-23zM896 480v-160q0-14-9-23t-23-9h-192q-14 0-23 9t-9 23v160q0 14 9 23t23 9h192q14 0 23-9t9-23zM1536 896q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"></path>  <!----></svg></a>' +
                                '' +
                                '<div class="menu" id="foo6" style="display:none"> <a onclick="show_hidePopUpWindow(\'foo6\');"><svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" id="close_button" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1490 1322q0 40-28 68l-136 136q-28 28-68 28t-68-28l-294-294-294 294q-28 28-68 28t-68-28l-136-136q-28-28-28-68t28-68l294-294-294-294q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294 294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68l-294 294 294 294q28 28 28 68z"/>  <!----></svg></a><b>Adam Matthew - China America Pacific </b>\n'
                                +
                                '<br><b>CONTENT:</b> Collection of archival material held by different American institutions and libraries like the American Philosophical Society Library, Boston Athenæum, Bridgeman Art Library, California Historical Society, Hagley Museum and Library, Massachusetts Historical Society, Hawaiian Historical Society etc. It contains material related to the trading and cultural relationships that emerged between China, America and the Pacific region between the 18th and early 20th centuries like manuscript sources, rare printed texts, visual images, objects and maps.\n' +
                                '\n' +
                                '<br><b>NOTE:</b> The full text was done by OCR from partly handwritten material, thus the text is often of minor quality. For each hit in the search links to the bibliographical unit and to the individual page are provided.\n'+
                                '</div>'));

                        }
                        if (facet==='Adam Matthew - China Trade & Politics') {
                            $(this.target).append($('<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo7\');" onmouseover="" style="cursor: pointer;"> <svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1024 1376v-160q0-14-9-23t-23-9h-96v-512q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v160q0 14 9 23t23 9h96v320h-96q-14 0-23 9t-9 23v160q0 14 9 23t23 9h448q14 0 23-9t9-23zM896 480v-160q0-14-9-23t-23-9h-192q-14 0-23 9t-9 23v160q0 14 9 23t23 9h192q14 0 23-9t9-23zM1536 896q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"></path>  <!----></svg></a>' +
                                '' +
                                '<div class="menu" id="foo7" style="display:none"> <a onclick="show_hidePopUpWindow(\'foo7\');"> <svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" id="close_button" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1490 1322q0 40-28 68l-136 136q-28 28-68 28t-68-28l-294-294-294 294q-28 28-68 28t-68-28l-136-136q-28-28-28-68t28-68l294-294-294-294q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294 294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68l-294 294 294 294q28 28 28 68z"/>  <!----></svg></a><b>Adam Matthew - China Trade & Politics </b>\n'
                                +'<br><b>CONTENT:</b> The collection contains a wide variety of sources in English relating to China and the West, 1793-1980, such as maps, color paintings, photographs, papers of key individuals involved in the Chinese Maritime Customs service, records of major diplomatic missions to China ranging from the late 18th to the 20th century (Macartney, Amherst to Nixon), papers of missionaries, as well as the Chinese Recorder and Missionary Journal (1867-1941) and North China Mission resp. North China Shantung Mission quarterly paper (1893-1936).\n' +
                                '\n' +
                                '<br><b>NOTE:</b> The full text was done by OCR from partly handwritten material, thus the text is often of minor quality. For each hit in the search links to the bibliographical unit and to the individual page are provided.\n'+
                                '</div>'));

                        }
                        if (facet==='Adam Matthew - Meiji Japan') {
                            $(this.target).append($('<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo8\');" onmouseover="" style="cursor: pointer;"> <svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1024 1376v-160q0-14-9-23t-23-9h-96v-512q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v160q0 14 9 23t23 9h96v320h-96q-14 0-23 9t-9 23v160q0 14 9 23t23 9h448q14 0 23-9t9-23zM896 480v-160q0-14-9-23t-23-9h-192q-14 0-23 9t-9 23v160q0 14 9 23t23 9h192q14 0 23-9t9-23zM1536 896q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"></path>  <!----></svg></a>' +
                                '' +
                                '<div class="menu" id="foo8" style="display:none"><a onclick="show_hidePopUpWindow(\'foo8\');"> ' +
                                '<svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" id="close_button" style="font-size: 2em; color: rgb(180, 24, 21);">' +
                                '<path d="M1490 1322q0 40-28 68l-136 136q-28 28-68 28t-68-28l-294-294-294 294q-28 28-68 28t-68-28l-136-136q-28-28-28-68t28-68l294-294-294-294q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294 294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68l-294 294 294 294q28 28 28 68z"/>  <!----></svg>' +
                                '</a>' +
                                '<b>Adam Matthew - Meiji Japan </b>' +
                                '<br><b>CONTENT:</b> The collection contains the diaries and correspondence of Edward S Morse (1838-1925), one of the first Americans to live in Japan for a longer period while teaching science at the Imperial University of Tokyo. A polymath especially interested in the fields natural history, ethnography and art history, he was an accomplished draughtsman and his drawings and sketches enliven his diaries and letters. In addition to preserving the household records of a samurai family and many accounts of the tea ceremony, Morse made notes on subjects as diverse as shop signs, fireworks, hairpins, agricultural tools, artists’ studios, music, games, printing, carpentry, the Ainu, gardens, household construction, art and architecture. His correspondence include exchanges with Alexander and Louis Agassiz, William Sturgis Bigelow, Charles Darwin, Ernest Fenollosa, Yukichi Fukuzawa, Isabella Stewart Gardner, John M Gould, Oliver Wendell Holmes, Ernest Ingersoll, Hiroyuki Kato, Percival Lowell, The Museum of Fine Arts in Boston, Charles Eliot Norton, Frederick Putnam, Hideo Takamine, Seiichi Tejima, Charles Townsend, Charles Weld and Yu Kil-chun.\n' +
                                '\n' +
                                '<br><b>NOTE:</b> As all items in this collection are either handwritten or images, none of them has provided fulltext yet. Thus only the metadata can be searched.\n'+
                                '</div>'));

                        }
                        if (facet==='CNKI eBooks') {
                            $(this.target).append($('<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo9\');" onmouseover="" style="cursor: pointer;"> <svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1024 1376v-160q0-14-9-23t-23-9h-96v-512q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v160q0 14 9 23t23 9h96v320h-96q-14 0-23 9t-9 23v160q0 14 9 23t23 9h448q14 0 23-9t9-23zM896 480v-160q0-14-9-23t-23-9h-192q-14 0-23 9t-9 23v160q0 14 9 23t23 9h192q14 0 23-9t9-23zM1536 896q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"></path>  <!----></svg></a>' +
                                '' +
                                '<div class="menu" id="foo9" style="display:none"><a onclick="show_hidePopUpWindow(\'foo9\');"> ' +
                                '<svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" id="close_button" style="font-size: 2em; color: rgb(180, 24, 21);">' +
                                '<path d="M1490 1322q0 40-28 68l-136 136q-28 28-68 28t-68-28l-294-294-294 294q-28 28-68 28t-68-28l-136-136q-28-28-28-68t28-68l294-294-294-294q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294 294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68l-294 294 294 294q28 28 28 68z"/>  <!----></svg>' +
                                '</a>' +
                                '<b>CNKI eBooks </b>' +
                                '<br><b>CONTENT:</b> Currently 140 titles of the CNKI Digital Collection on China Studies (中国学术典藏图书库) are included with their full text into the CrossAsia fulltext search. This number will increase yearly with new acquisitions based on the PDA (Patron driven acquisition) model. The complete set of titles can be searched via their database portal <a href="http://erf.sbb.spk-berlin.de/han/cnki-books/">LINK</a> \n' +
                                '\n' +
                                '<br><b>NOTE:</b> To see the complete text of a hit page, please follow the link provided next to the fulltext hit. After login the page will open in the database.\n'+
                                '</div>'));

                        }
                        if (facet==='China Comprehensive Gazetteers') {
                            $(this.target).append($('<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo93\');" onmouseover="" style="cursor: pointer;"> <svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1024 1376v-160q0-14-9-23t-23-9h-96v-512q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v160q0 14 9 23t23 9h96v320h-96q-14 0-23 9t-9 23v160q0 14 9 23t23 9h448q14 0 23-9t9-23zM896 480v-160q0-14-9-23t-23-9h-192q-14 0-23 9t-9 23v160q0 14 9 23t23 9h192q14 0 23-9t9-23zM1536 896q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"></path>  <!----></svg></a>' +
                                '' +
                                '<div class="menu" id="foo93" style="display:none"><a onclick="show_hidePopUpWindow(\'foo93\');"> ' +
                                '<svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" id="close_button" style="font-size: 2em; color: rgb(180, 24, 21);">' +
                                '<path d="M1490 1322q0 40-28 68l-136 136q-28 28-68 28t-68-28l-294-294-294 294q-28 28-68 28t-68-28l-136-136q-28-28-28-68t28-68l294-294-294-294q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294 294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68l-294 294 294 294q28 28 28 68z"/>  <!----></svg>' +
                                '</a>' +
                                '<b>China Comprehensive Gazetteers : 中國綜合方誌庫 </b>' +
                                '<br><b>CONTENT:</b> The collection contains about 6600 digitized local gazetteer titles, mainly from the holdings of the National Library of China. Currently 3017 of the titles are also available in fulltext.  \n' +
                                '\n' +
                                '<br><b>NOTE:</b> The book can be accessed using the link provided. There is no direct link to the page. Some title searchable in fulltext here, do not have the fulltext included in the database platform yet, meaning you find more hits in the CrossAsia fulltext search than currently in the database itself.\n'+
                                '</div>'));

                        }
                        if (facet==='Fulltext search in print books') {
                            $(this.target).append($('<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo91\');" onmouseover="" style="cursor: pointer;"> <svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1024 1376v-160q0-14-9-23t-23-9h-96v-512q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v160q0 14 9 23t23 9h96v320h-96q-14 0-23 9t-9 23v160q0 14 9 23t23 9h448q14 0 23-9t9-23zM896 480v-160q0-14-9-23t-23-9h-192q-14 0-23 9t-9 23v160q0 14 9 23t23 9h192q14 0 23-9t9-23zM1536 896q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"></path>  <!----></svg></a>' +
                                '' +
                                '<div class="menu" id="foo91" style="display:none"><a onclick="show_hidePopUpWindow(\'foo91\');"> ' +
                                '<svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" id="close_button" style="font-size: 2em; color: rgb(180, 24, 21);">' +
                                '<path d="M1490 1322q0 40-28 68l-136 136q-28 28-68 28t-68-28l-294-294-294 294q-28 28-68 28t-68-28l-136-136q-28-28-28-68t28-68l294-294-294-294q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294 294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68l-294 294 294 294q28 28 28 68z"/>  <!----></svg>' +
                                '</a>' +
                                '<b>Fulltext search in print books </b>' +
                                '<br><b>CONTENT:</b> CrossAsia is working on bridging the gap between printed materials in our stacks and electronic full text searches. Matching our collection with Duxiu fulltexts and allowing users to search in Duxiu fulltexts to find and borrow items from our printed collection is one way. The other way is producing our own fulltexts from printed books and offer them in our fulltext search. As a test case this collection includes 15 titles prepared in this way. \n' +
                                '\n' +
                                '<br><b>NOTE:</b> To see your full hit page you have to borrow the book (via the link to our OPAC provided with the title) and find the correct page. Please note that the "page number" given for your search hit is the "image number", so you have to add a certain number to find the correct printed page. But the idea is to help you find books of interest for your research of general interest.\n'+
                                '</div>'));

                        }
                        if (facet==='Classical Works of Japan') {
                            $(this.target).append($('<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo92\');" onmouseover="" style="cursor: pointer;"> <svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1024 1376v-160q0-14-9-23t-23-9h-96v-512q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v160q0 14 9 23t23 9h96v320h-96q-14 0-23 9t-9 23v160q0 14 9 23t23 9h448q14 0 23-9t9-23zM896 480v-160q0-14-9-23t-23-9h-192q-14 0-23 9t-9 23v160q0 14 9 23t23 9h192q14 0 23-9t9-23zM1536 896q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"></path>  <!----></svg></a>' +
                                '' +
                                '<div class="menu" id="foo92" style="display:none"><a onclick="show_hidePopUpWindow(\'foo92\');"> ' +
                                '<svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" id="close_button" style="font-size: 2em; color: rgb(180, 24, 21);">' +
                                '<path d="M1490 1322q0 40-28 68l-136 136q-28 28-68 28t-68-28l-294-294-294 294q-28 28-68 28t-68-28l-136-136q-28-28-28-68t28-68l294-294-294-294q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294 294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68l-294 294 294 294q28 28 28 68z"/>  <!----></svg>' +
                                '</a>' +
                                '<b>日本古典書籍 : Classical  Works of Japan </b>' +
                                '<br><b>CONTENT:</b> The collection contains a selection of important historical and literary compilations, as well as the encyclopedia  Koji ruien 古事類苑 (compiled between 1896 and 1914) and two dictionaries, namely the Wamyô ruijushô 倭名類聚抄 of the 10th and the Shinsen jikyô 新撰字鏡 of the late 9th century. The historical collections included are the collection of historical resources Kokushi taikei 国史大系 with its sequel (both compiled between 1897 and 1904) and the Rikkokushi  六国史,the six national histories of Japan; the literary collections consist of the Honchô monzui 本朝文粹  presenting Chinese prose and poetry for a Japanese audience compiled in the 11th century and of various collections with Japanese poems in Chinese style covering the period from 7th to the 20th centuries (segment called: Nihon kanshi 日本漢詩). \n' +
                                '\n' +
                                '<br><b>NOTE:</b> No links to the individual pages in the database are possible. To find your hit page in the database you have to open the title (follow the \'book\' link in the title data) and then go to the page number given in the page hit. \n'+
                                '</div>'));

                        }

                        if (facet==='Siku quanshu') {
                            $(this.target).append($('<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo920\');" onmouseover="" style="cursor: pointer;"> <svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1024 1376v-160q0-14-9-23t-23-9h-96v-512q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v160q0 14 9 23t23 9h96v320h-96q-14 0-23 9t-9 23v160q0 14 9 23t23 9h448q14 0 23-9t9-23zM896 480v-160q0-14-9-23t-23-9h-192q-14 0-23 9t-9 23v160q0 14 9 23t23 9h192q14 0 23-9t9-23zM1536 896q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"></path>  <!----></svg></a>' +
                                '' +
                                '<div class="menu" id="foo920" style="display:none"><a onclick="show_hidePopUpWindow(\'foo920\');"> ' +
                                '<svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" id="close_button" style="font-size: 2em; color: rgb(180, 24, 21);">' +
                                '<path d="M1490 1322q0 40-28 68l-136 136q-28 28-68 28t-68-28l-294-294-294 294q-28 28-68 28t-68-28l-136-136q-28-28-28-68t28-68l294-294-294-294q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294 294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68l-294 294 294 294q28 28 28 68z"/>  <!----></svg>' +
                                '</a>' +
                                '<b>Siku quanshu 四庫全書 </b>' +
                                '<br><b>CONTENT:</b> This famous collecting and editing project of the Qianlong emperor (reg. 1735-1796/1799) contains 3540 titles. The books in this project all went through an editing and “correcting” process by the Qing compilation team and seven neat manuscript copies were produced to be displayed at different locations of the empire. The one digitized here is the Wenyuan pavilion 文淵閣 today housed at the Taiwan Palace Museum. \n' +
                                '\n' +
                                '<br><b>NOTE:</b> No links to the individual pages in the database are possible. To find your hit page in the database you have to open the title (follow the \'book\' link in the title data) and then go to the page number given in the page hit. \n'+
                                '</div>'));

                        }

                        if (facet==='China and the Modern World: Records of the Maritime Customs Service of China (1854-1949)') {
                            $(this.target).append($('<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo94\');" onmouseover="" style="cursor: pointer;"> <svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1024 1376v-160q0-14-9-23t-23-9h-96v-512q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v160q0 14 9 23t23 9h96v320h-96q-14 0-23 9t-9 23v160q0 14 9 23t23 9h448q14 0 23-9t9-23zM896 480v-160q0-14-9-23t-23-9h-192q-14 0-23 9t-9 23v160q0 14 9 23t23 9h192q14 0 23-9t9-23zM1536 896q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"></path>  <!----></svg></a>' +
                                '' +
                                '<div class="menu" id="foo94" style="display:none"><a onclick="show_hidePopUpWindow(\'foo94\');"> ' +
                                '<svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" id="close_button" style="font-size: 2em; color: rgb(180, 24, 21);">' +
                                '<path d="M1490 1322q0 40-28 68l-136 136q-28 28-68 28t-68-28l-294-294-294 294q-28 28-68 28t-68-28l-136-136q-28-28-28-68t28-68l294-294-294-294q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294 294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68l-294 294 294 294q28 28 28 68z"/>  <!----></svg>' +
                                '</a>' +
                                '<b>Records of the Maritime Customs Service of China (1854-1949) </b>' +
                                '<br><b>CONTENT:</b> The resource contains official correspondence, despatches, reports, memoranda, as well as private and confidential  letter of the Maritime Customs Service of China, an international, although predominantly British-staffed bureaucracy (at senior levels) under the control of successive Chinese central governments from its founding in 1854 until January 1950. With 720 documents and almost 300.000 pages it provides evidence Chinese life, the economy and politics of of late Qing and Republican times until the founding of the People’s Republic of China in 1949. \n' +
                                '\n' +
                                '<br><b>NOTE:</b> The documents are scanned from microfilm and the fulltext derives from uncleaned OCR. As many documents are handwritten the text quality thus often inferior. The link provided for the individual text pages lead to the corresponding scan unfortunately without the document’s context. \n'+
                                '</div>'));

                        }
                        if (facet==='Beschreibung') {
                            $(this.target).append($('<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo1\');" onmouseover="" style="cursor: pointer;"> <svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1024 1376v-160q0-14-9-23t-23-9h-96v-512q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v160q0 14 9 23t23 9h96v320h-96q-14 0-23 9t-9 23v160q0 14 9 23t23 9h448q14 0 23-9t9-23zM896 480v-160q0-14-9-23t-23-9h-192q-14 0-23 9t-9 23v160q0 14 9 23t23 9h192q14 0 23-9t9-23zM1536 896q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"></path>  <!----></svg></a>' +
                                '' +
                                '<div class="menu" id="foo1" style="display:none"><a onclick="show_hidePopUpWindow(\'foo1\');"> ' +
                                '<svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" id="close_button" style="font-size: 2em; color: rgb(180, 24, 21);">' +
                                '<path d="M1490 1322q0 40-28 68l-136 136q-28 28-68 28t-68-28l-294-294-294 294q-28 28-68 28t-68-28l-136-136q-28-28-28-68t28-68l294-294-294-294q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294 294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68l-294 294 294 294q28 28 28 68z"/>  <!----></svg>' +
                                '</a>' +
                                '<b>CrossAsia Fulltext Search (Beta version, type B)</b><br>'+
                                '<br> In this second version of the CrossAsia Fulltext Search metadata and fulltexts are searched at the same time. You can use the filter "Type of Object" to reduce your result set or presetting your search to the contents of the "Pages" or the metadata of the "Books" or "Chapters" or to the content - and metadata - of "Articles".'+
                                '<br>The list of resources included in this search can be viewed from the list of filters directly underneath the search slot'+
                                '\n' +
                                '<br><br><b>FEATURES:</b>'+
                                '<br>- searching metadata and fulltext at the same time'+
                                '<br>- ranking of search hits by Solr score (note: be aware that if you do not enclose your search term in "" texts with a high frequency of one word/character of your search term will score higher than those where your two search words/characters appear next to each other)'+
                                '<br>- for each hit two types of link are provided: one - in red - for authenticated CrossAsia users, another one - in grey - for all other users who will then need to enter their individual authorization or access the ressource from within a subscriber\'s IP range. Please note that not all databases provide links to directly call-up a specific page of a ressource, some even do not have direct links to an item in their database (for example Erudition Local Gazetteers or Renmin ribao).\n'+
                                '<br>'+
                                '<br>For feedback, questions etc. please contact: <a href="mailto:x-asia@sbb.spk-berlin.de">x-asia@sbb.spk-berlin.de</a>'+
                                '</div>'));

                        }

                        if (facet==='Gujin tushu jicheng') {
                            $(this.target).append($('<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo810\');" onmouseover="" style="cursor: pointer;"> <svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1024 1376v-160q0-14-9-23t-23-9h-96v-512q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v160q0 14 9 23t23 9h96v320h-96q-14 0-23 9t-9 23v160q0 14 9 23t23 9h448q14 0 23-9t9-23zM896 480v-160q0-14-9-23t-23-9h-192q-14 0-23 9t-9 23v160q0 14 9 23t23 9h192q14 0 23-9t9-23zM1536 896q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"></path>  <!----></svg></a>' +
                                '' +
                                '<div class="menu" id="foo810" style="display:none"><a onclick="show_hidePopUpWindow(\'foo810\');"> ' +
                                '<svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" id="close_button" style="font-size: 2em; color: rgb(180, 24, 21);">' +
                                '<path d="M1490 1322q0 40-28 68l-136 136q-28 28-68 28t-68-28l-294-294-294 294q-28 28-68 28t-68-28l-136-136q-28-28-28-68t28-68l294-294-294-294q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294 294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68l-294 294 294 294q28 28 28 68z"/>  <!----></svg>' +
                                '</a>' +
                                '<b>Qing Imperial Encyclopedia (Gujin tushu jicheng) \n' +
                                '古今圖書集成\n </b>' +
                                '<br><b>CONTENT:</b> With 6,117 topical sections on over 800,000 pages, the Gujin tushu jicheng 古今圖書集成 is the largest still extent encyclopedic compilation of Chinese history. Started by Chen Menglei 陳夢雷under the imperial order of the Kangxi emperor 康熙 (r. 1661-1722) between 1701 und 1706 it was published and printed with moveable copper type in 1726 under the supervision of Jiang Tingxi 蔣廷錫.Each section assembles excerpts from a great variety of sources from early writings up to the 17th century.\n' +
                                '\n' +
                                '<br><b>NOTE:</b> No links to the individual pages in the database are possible. To find your hit page in the database you have to click the \'book\' link that will open the respective section and then go to the page number given in the page hit.\n'+
                                '</div>'));

                        }
                    }

                    if (this.field==='title_facet' && cur_facet_count != 0) {
                        if (facet.length>40) {
                            var new_facet = facet.substring(0,40)+'...';
                            $(this.target).append($('<span class="text_facet" style="padding-left: 2px; font-size: small;"></span>').text(new_facet));
                            $(this.target).append($('<br1>'));
                        } else {
                            $(this.target).append($('<span class="text_facet" style="padding-left: 2px; font-size: small;"></span>').text(facet));
                        }
                    } else {
                        //$(this.target).append($('<span class="text_facet" style="padding-left: 2px; font-size: small;"></span>').text(facet));
                    }

                    if (Object.values(returned_facets).length>0) {
                        if (this.field==='person_facet'){document.getElementById('personHide').style.display = "block";}
                        if (this.field==='spatial_facet'){document.getElementById('spatialHide').style.display = "block";}
                        if (this.field==='author_facet'){document.getElementById('authorHide').style.display = "block";}
                        if (this.field==='edition_facet'){document.getElementById('editionHide').style.display = "block";}
                        if (this.field==='title_facet'){document.getElementById('titleHide').style.display = "block";}
                        if (this.field==='date'){document.getElementById('dateHide').style.display = "block";}
                        if (this.field==='language'){document.getElementById('languageHide').style.display = "block";}
                    } else {
                        if (this.field==='person_facet'){document.getElementById('personHide').style.display = "none";}
                        if (this.field==='spatial_facet'){document.getElementById('spatialHide').style.display = "none";}
                        if (this.field==='title_facet'){document.getElementById('titleHide').style.display = "none";}
                        if (this.field==='date'){document.getElementById('dateHide').style.display = "none";}
                        if (this.field==='author_facet'){document.getElementById('authorHide').style.display = "none";}
                        if (this.field==='edition_facet'){document.getElementById('editionHide').style.display = "none";}
                        if (this.field==='language'){document.getElementById('languageHide').style.display = "none";}
                    }

                    if (Object.values(returned_facets).length<10) {
                        if (this.field==='person_facet'){document.getElementById('person_facet_all_extra').style.display = "none";}
                        if (this.field==='spatial_facet'){document.getElementById('spatial_facet_all_extra').style.display = "none";}
                        //if (this.field==='title_facet'){document.getElementById('titleHide').style.display = "none";}
                        if (this.field==='date'){document.getElementById('date_all_extra').style.display = "none";}
                        if (this.field==='author_facet'){document.getElementById('author_facet_all_extra').style.display = "none";}
                        if (this.field==='edition_facet'){document.getElementById('edition_facet_all_extra').style.display = "none";}
                        if (this.field==='language'){document.getElementById('language_all_extra').style.display = "none";}
                    }

                    if (cur_facet_count != 0) {
                        if (this.field!='title_facet') {
                            $(this.target).append($('<span class="text_facet" style="padding-left: 2px; font-size: small;"></span>').text(facet));
                        }

                        $(this.target).append($('<span id="number" style="font-size: x-small"></span>').text(' (' + cur_facet_count + ')'));
                        $(this.target).append($('<br>'));
                    }

                }

                if ((typeof this.max_show != 'undefined') && (i == (this.max_show - 1))) {
                    var display_style_txt = (this.display_style == 'none') ? ' style="display:none"' : '';
                    $(this.target).append('<div id="'+ show_more_div_id + '"' + display_style_txt + '></div>');
                }

                if ((typeof this.max_show != 'undefined') &&
                    (i >= this.max_show)) {
                    if (cur_facet_count != 0) {
                        $('#' + show_more_div_id).append(
                            $('<input type=checkbox class="cheki" id="' + this.field + '_' + facet + '_checkbox"' + checked_txt + '></input>')
                                .change(this.checkboxChange(facet))
                        );

                    }
                    if (this.field==='title_facet' && cur_facet_count != 0) {
                        if (facet.length>40) {
                            var new_facet = facet.substring(0,40)+'...';
                            $('#' + show_more_div_id).append($('<span class="text_facet" style="padding-left: 2px; font-size: small;"></span>').text(new_facet));
                        } else {
                            $('#' + show_more_div_id).append($('<span class="text_facet" style="padding-left: 2px; font-size: small;"></span>').text(facet));
                        }
                    } else {
                    }

                    if (Object.values(returned_facets).length>0) {
                        if (this.field==='person_facet'){document.getElementById('personHide').style.display = "block";}
                        if (this.field==='spatial_facet'){document.getElementById('spatialHide').style.display = "block";}
                        if (this.field==='author_facet'){document.getElementById('authorHide').style.display = "block";}
                        if (this.field==='edition_facet'){document.getElementById('editionHide').style.display = "block";}
                        if (this.field==='subject_facet'){document.getElementById('subjectHide').style.display = "block";}
                        if (this.field==='title_facet'){document.getElementById('titleHide').style.display = "block";}
                        if (this.field==='date'){document.getElementById('dateHide').style.display = "block";}
                        if (this.field==='language'){document.getElementById('languageHide').style.display = "block";}
                    } else {
                        if (this.field==='person_facet'){document.getElementById('personHide').style.display = "none";}
                        if (this.field==='spatial_facet'){document.getElementById('spatialHide').style.display = "none";}
                        if (this.field==='title_facet'){document.getElementById('titleHide').style.display = "none";}
                        if (this.field==='date'){document.getElementById('dateHide').style.display = "none";}
                        if (this.field==='author_facet'){document.getElementById('authorHide').style.display = "none";}
                        if (this.field==='edition_facet'){document.getElementById('editionHide').style.display = "none";}
                        if (this.field==='subject_facet'){document.getElementById('subjectHide').style.display = "none";}
                        if (this.field==='language'){document.getElementById('languageHide').style.display = "none";}
                    }

                    if (Object.values(returned_facets).length<10) {
                        if (this.field==='person_facet'){document.getElementById('person_facet_all_extra').style.display = "none";}
                        if (this.field==='spatial_facet'){document.getElementById('spatial_facet_all_extra').style.display = "none";}
                        //if (this.field==='title_facet'){document.getElementById('titleHide').style.display = "none";}
                        if (this.field==='date'){document.getElementById('date_all_extra').style.display = "none";}
                        if (this.field==='author_facet'){document.getElementById('author_facet_all_extra').style.display = "none";}
                        if (this.field==='edition_facet'){document.getElementById('edition_facet_all_extra').style.display = "none";}
                        if (this.field==='subject_facet'){document.getElementById('subject_facet_all_extra').style.display = "none";}
                        if (this.field==='language'){document.getElementById('language_all_extra').style.display = "none";}
                    }

                    if (cur_facet_count != 0) {
                        if ( this.field=='collection') {
                            if (facet==="Renmin Ribao" ) {
                                $('#' + 'more_collection').append($('<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo\');" onmouseover="" style="cursor: pointer;">' +
                                    '<svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" style="font-size: 2em; color: rgb(180, 24, 21);">' +
                                    '<path d="M1024 1376v-160q0-14-9-23t-23-9h-96v-512q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v160q0 14 9 23t23 9h96v320h-96q-14 0-23 9t-9 23v160q0 14 9 23t23 9h448q14 0 23-9t9-23zM896 480v-160q0-14-9-23t-23-9h-192q-14 0-23 9t-9 23v160q0 14 9 23t23 9h192q14 0 23-9t9-23zM1536 896q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"></path>  <!----></svg></a>' +
                                    '' +
                                    '<div class="menu" id="foo" style="display:none"><a onclick="show_hidePopUpWindow(\'foo\');"> <svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" id="close_button" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1490 1322q0 40-28 68l-136 136q-28 28-68 28t-68-28l-294-294-294 294q-28 28-68 28t-68-28l-136-136q-28-28-28-68t28-68l294-294-294-294q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294 294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68l-294 294 294 294q28 28 28 68z"/>  <!----></svg></a><b>人民日报 : People\'s Daily </b>\n' +
                                    '<br><b>CONTENT:</b> Fulltexts of all articles from the inception of the People\'s Daily in 1946 to end of August 2009. Articles will be shown as individual hits of the issue of a certain day.\n' +
                                    '<br><b>NOTE:</b> To see the image-PDF of the issue you will have go to the database (http://erf.sbb.spk-berlin.de/han/RenminRibao1/) and open the issue via the calendar browse function provided in the database.\n</div>'));
                            }
                            if (facet==="Airiti") {
                                $('#' + 'more_collection').append($('<span> </span> <a class="airiti2" onclick="show_hidePopUpWindow(\'foo2\');" onmouseover="" style="cursor: pointer;"> <svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1024 1376v-160q0-14-9-23t-23-9h-96v-512q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v160q0 14 9 23t23 9h96v320h-96q-14 0-23 9t-9 23v160q0 14 9 23t23 9h448q14 0 23-9t9-23zM896 480v-160q0-14-9-23t-23-9h-192q-14 0-23 9t-9 23v160q0 14 9 23t23 9h192q14 0 23-9t9-23zM1536 896q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"></path>  <!----></svg></i></a>' +
                                    '' +
                                    '<div class="menu" id="foo2" style="display:none"> <a class="click" onclick="show_hidePopUpWindow(\'foo2\');"><svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" id="close_button" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1490 1322q0 40-28 68l-136 136q-28 28-68 28t-68-28l-294-294-294 294q-28 28-68 28t-68-28l-136-136q-28-28-28-68t28-68l294-294-294-294q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294 294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68l-294 294 294 294q28 28 28 68z"/>  <!----></svg></a><b>Airiti eBooks </b>\n' +
                                    '<br><b>CONTENT:</b>  Currently 75 titles of the Airiti eBook platform have been licenced and are available for fulltext search. The corpus of licenced titles will be update yearly. For the Airiti ebook database go to 華藝中文電子書 : airitiBooks <a href="http://erf.sbb.spk-berlin.de/han/airiti/www.airitibooks.com/">LINK</a>\n' +
                                    '<br><b>NOTE:</b> To see your hit page, please follow the link provided next to the fulltext hit. Due to the licence agreement it is only possible to open one double-page (window) per book at the same time. If you can\'t find the hit on the pages shown, please check the previous or subsequent pages, or perform a search within the book.\n</div>'));
                            }
                            if (facet==='Adam Matthew - China Trade & Politics') {
                                $('#' + 'more_collection').append($('<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo7\');" onmouseover="" style="cursor: pointer;"> <svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1024 1376v-160q0-14-9-23t-23-9h-96v-512q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v160q0 14 9 23t23 9h96v320h-96q-14 0-23 9t-9 23v160q0 14 9 23t23 9h448q14 0 23-9t9-23zM896 480v-160q0-14-9-23t-23-9h-192q-14 0-23 9t-9 23v160q0 14 9 23t23 9h192q14 0 23-9t9-23zM1536 896q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"></path>  <!----></svg></a>' +
                                    '' +
                                    '<div class="menu" id="foo7" style="display:none"> <a onclick="show_hidePopUpWindow(\'foo7\');"> <svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" id="close_button" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1490 1322q0 40-28 68l-136 136q-28 28-68 28t-68-28l-294-294-294 294q-28 28-68 28t-68-28l-136-136q-28-28-28-68t28-68l294-294-294-294q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294 294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68l-294 294 294 294q28 28 28 68z"/>  <!----></svg></a><b>Adam Matthew - China Trade & Politics </b>\n'
                                    +'<br><b>CONTENT:</b> The collection contains a wide variety of sources in English relating to China and the West, 1793-1980, such as maps, color paintings, photographs, papers of key individuals involved in the Chinese Maritime Customs service, records of major diplomatic missions to China ranging from the late 18th to the 20th century (Macartney, Amherst to Nixon), papers of missionaries, as well as the Chinese Recorder and Missionary Journal (1867-1941) and North China Mission resp. North China Shantung Mission quarterly paper (1893-1936).\n' +
                                    '\n' +
                                    '<br><b>NOTE:</b> The full text was done by OCR from partly handwritten material, thus the text is often of minor quality. For each hit in the search links to the bibliographical unit and to the individual page are provided.\n'+
                                    '</div>'));
                            }
                            if (facet==="Missionary, Sinology, and Literary Periodicals (1817-1949)") {
                                $('#' + 'more_collection').append($('<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo47\');" onmouseover="" style="cursor: pointer;"> ' +
                                    '<svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" style="font-size: 2em; color: rgb(180, 24, 21);">' +
                                    '<path d="M1024 1376v-160q0-14-9-23t-23-9h-96v-512q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v160q0 14 9 23t23 9h96v320h-96q-14 0-23 9t-9 23v160q0 14 9 23t23 9h448q14 0 23-9t9-23zM896 480v-160q0-14-9-23t-23-9h-192q-14 0-23 9t-9 23v160q0 14 9 23t23 9h192q14 0 23-9t9-23zM1536 896q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"></path>  <!----></svg></a>' +
                                    '' +
                                    '<div class="menu" id="foo47" style="display:none"> <a onclick="show_hidePopUpWindow(\'foo47\');"><svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" id="close_button" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1490 1322q0 40-28 68l-136 136q-28 28-68 28t-68-28l-294-294-294 294q-28 28-68 28t-68-28l-136-136q-28-28-28-68t28-68l294-294-294-294q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294 294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68l-294 294 294 294q28 28 28 68z"/>  <!----></svg></a><b>Missionary, Sinology, and Literary Periodicals (1817-1949) </b>\n' +
                                    '<br><b>CONTENT:</b> The resource contains the main English-language periodicals published in or about China covering the period from 1817 until the founding of the People’s Republic of China in 1949. The journals feature photographs and articles the on the founding and development of Christian higher education in China. \n' +
                                    '<br><b>NOTE:</b> The fulltexts are not split into the actual pages, but contain the whole article. The links provided thus open the article at the start page and the search term may appear only on a later page. To get to the correct page please use the “Search within – Article” to left of the article display in the database. \n</div>'));
                            }
                            if (facet==='Qingdai shiliao') {
                                //console.log(facet);
                                $('#' + 'more_collection').append($('<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo41\');" onmouseover="" style="cursor: pointer;"><svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1024 1376v-160q0-14-9-23t-23-9h-96v-512q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v160q0 14 9 23t23 9h96v320h-96q-14 0-23 9t-9 23v160q0 14 9 23t23 9h448q14 0 23-9t9-23zM896 480v-160q0-14-9-23t-23-9h-192q-14 0-23 9t-9 23v160q0 14 9 23t23 9h192q14 0 23-9t9-23zM1536 896q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"></path>  <!----></svg></a>' +
                                    '' +
                                    '<div class="menu" id="foo41" style="display:none"> <a onclick="show_hidePopUpWindow(\'foo41\');"><svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" id="close_button" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1490 1322q0 40-28 68l-136 136q-28 28-68 28t-68-28l-294-294-294 294q-28 28-68 28t-68-28l-136-136q-28-28-28-68t28-68l294-294-294-294q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294 294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68l-294 294 294 294q28 28 28 68z"/>  <!----></svg></a><b>清代史料 </b>\n' +
                                    '<br><b>CONTENT:</b> The collection contains historical sources of the Qing dynasty published by the Qing state. They belong to five types of documents: Veritable Records (實錄), Collected Statutes (會典), Records of Officials (缙绅錄), different editions of  the Guide to the Qing board of war (大清中樞備覽) as well as the Qing Essentials for Governance (大清輔政要覽全書), and  finally materials closely related to the emperor such as the Court Diaries (起居注, currently only Tongzhi 同治). \n' +
                                    '<br><b>NOTE:</b> No links to the individual pages in the database are possible. To find your hit page in the database you have to open the title (follow the \'book\' link in the title data) and then go to the page number given in the page hit.\n</div>'));

                            }
                            if (facet==='CNKI eBooks') {
                                $('#' + 'more_collection').append($('<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo9\');" onmouseover="" style="cursor: pointer;"> <svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1024 1376v-160q0-14-9-23t-23-9h-96v-512q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v160q0 14 9 23t23 9h96v320h-96q-14 0-23 9t-9 23v160q0 14 9 23t23 9h448q14 0 23-9t9-23zM896 480v-160q0-14-9-23t-23-9h-192q-14 0-23 9t-9 23v160q0 14 9 23t23 9h192q14 0 23-9t9-23zM1536 896q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"></path>  <!----></svg></a>' +
                                    '' +
                                    '<div class="menu" id="foo9" style="display:none"><a onclick="show_hidePopUpWindow(\'foo9\');"> ' +
                                    '<svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" id="close_button" style="font-size: 2em; color: rgb(180, 24, 21);">' +
                                    '<path d="M1490 1322q0 40-28 68l-136 136q-28 28-68 28t-68-28l-294-294-294 294q-28 28-68 28t-68-28l-136-136q-28-28-28-68t28-68l294-294-294-294q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294 294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68l-294 294 294 294q28 28 28 68z"/>  <!----></svg>' +
                                    '</a>' +
                                    '<b>CNKI eBooks </b>' +
                                    '<br><b>CONTENT:</b> Currently 140 titles of the CNKI Digital Collection on China Studies (中国学术典藏图书库) are included with their full text into the CrossAsia fulltext search. This number will increase yearly with new acquisitions based on the PDA (Patron driven acquisition) model. The complete set of titles can be searched via their database portal <a href="http://erf.sbb.spk-berlin.de/han/cnki-books/">LINK</a> \n' +
                                    '\n' +
                                    '<br><b>NOTE:</b> To see the complete text of a hit page, please follow the link provided next to the fulltext hit. After login the page will open in the database.\n'+
                                    '</div>'));
                            }
                            if (facet==='Classical Works of Japan') {
                                $('#' + 'more_collection').append($('<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo92\');" onmouseover="" style="cursor: pointer;"> <svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1024 1376v-160q0-14-9-23t-23-9h-96v-512q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v160q0 14 9 23t23 9h96v320h-96q-14 0-23 9t-9 23v160q0 14 9 23t23 9h448q14 0 23-9t9-23zM896 480v-160q0-14-9-23t-23-9h-192q-14 0-23 9t-9 23v160q0 14 9 23t23 9h192q14 0 23-9t9-23zM1536 896q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"></path>  <!----></svg></a>' +
                                    '' +
                                    '<div class="menu" id="foo92" style="display:none"><a onclick="show_hidePopUpWindow(\'foo92\');"> ' +
                                    '<svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" id="close_button" style="font-size: 2em; color: rgb(180, 24, 21);">' +
                                    '<path d="M1490 1322q0 40-28 68l-136 136q-28 28-68 28t-68-28l-294-294-294 294q-28 28-68 28t-68-28l-136-136q-28-28-28-68t28-68l294-294-294-294q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294 294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68l-294 294 294 294q28 28 28 68z"/>  <!----></svg>' +
                                    '</a>' +
                                    '<b>日本古典書籍 : Classical  Works of Japan </b>' +
                                    '<br><b>CONTENT:</b> The collection contains a selection of important historical and literary compilations, as well as the encyclopedia  Koji ruien 古事類苑 (compiled between 1896 and 1914) and two dictionaries, namely the Wamyô ruijushô 倭名類聚抄 of the 10th and the Shinsen jikyô 新撰字鏡 of the late 9th century. The historical collections included are the collection of historical resources Kokushi taikei 国史大系 with its sequel (both compiled between 1897 and 1904) and the Rikkokushi  六国史,the six national histories of Japan; the literary collections consist of the Honchô monzui 本朝文粹  presenting Chinese prose and poetry for a Japanese audience compiled in the 11th century and of various collections with Japanese poems in Chinese style covering the period from 7th to the 20th centuries (segment called: Nihon kanshi 日本漢詩). \n' +
                                    '\n' +
                                    '<br><b>NOTE:</b> No links to the individual pages in the database are possible. To find your hit page in the database you have to open the title (follow the \'book\' link in the title data) and then go to the page number given in the page hit. \n'+
                                    '</div>'));

                            }
                            if (facet==='Daozang jiyao') {
                                $('#' + 'more_collection').append($('<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo42\');" onmouseover="" style="cursor: pointer;"><svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1024 1376v-160q0-14-9-23t-23-9h-96v-512q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v160q0 14 9 23t23 9h96v320h-96q-14 0-23 9t-9 23v160q0 14 9 23t23 9h448q14 0 23-9t9-23zM896 480v-160q0-14-9-23t-23-9h-192q-14 0-23 9t-9 23v160q0 14 9 23t23 9h192q14 0 23-9t9-23zM1536 896q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"></path>  <!----></svg></a>' +
                                    '' +
                                    '<div class="menu" id="foo42" style="display:none"> <a onclick="show_hidePopUpWindow(\'foo42\');"><svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" id="close_button" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1490 1322q0 40-28 68l-136 136q-28 28-68 28t-68-28l-294-294-294 294q-28 28-68 28t-68-28l-136-136q-28-28-28-68t28-68l294-294-294-294q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294 294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68l-294 294 294 294q28 28 28 68z"/>  <!----></svg></a><b>道藏輯要 </b>\n' +
                                    '<br><b>CONTENT:</b> The "Essentials of the Daoist Canon" counts as the main collection of Daoist texts after the Daozang. Its bibliographical history is rather complicated and subject to discussion. After a first version of the "Essentials" was compiled around 1700, in the 18th and 19th century several re-editions and addition were made to the set of texts until in 1906 He Longxiang 賀龍驤 and Peng Hanran 彭瀚然 published the 重刊道藏輯要 in Chengdu. The texts of the "Essentials" chiefly derive from Zhengtong Daozang 正統到藏 edition (1445) but it also contains some additional texts or other editions of Zhengtong texts. The 299 texts and scans in this collection are those of the 1906 printed version of the Daozang jiyao. \n' +
                                    '<br><b>NOTE:</b> No links to the individual pages in the database are possible. To find your hit page in the database you have to open the title (follow the \'book\' link in the title data) and then go to the page number given in the page hit.\n</div>'));
                            }
                            if (facet==='Fulltext search in print books') {
                                $('#' + 'more_collection').append($('<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo91\');" onmouseover="" style="cursor: pointer;"> <svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1024 1376v-160q0-14-9-23t-23-9h-96v-512q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v160q0 14 9 23t23 9h96v320h-96q-14 0-23 9t-9 23v160q0 14 9 23t23 9h448q14 0 23-9t9-23zM896 480v-160q0-14-9-23t-23-9h-192q-14 0-23 9t-9 23v160q0 14 9 23t23 9h192q14 0 23-9t9-23zM1536 896q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"></path>  <!----></svg></a>' +
                                    '' +
                                    '<div class="menu" id="foo91" style="display:none"><a onclick="show_hidePopUpWindow(\'foo91\');"> ' +
                                    '<svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" id="close_button" style="font-size: 2em; color: rgb(180, 24, 21);">' +
                                    '<path d="M1490 1322q0 40-28 68l-136 136q-28 28-68 28t-68-28l-294-294-294 294q-28 28-68 28t-68-28l-136-136q-28-28-28-68t28-68l294-294-294-294q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294 294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68l-294 294 294 294q28 28 28 68z"/>  <!----></svg>' +
                                    '</a>' +
                                    '<b>Fulltext search in print books </b>' +
                                    '<br><b>CONTENT:</b> CrossAsia is working on bridging the gap between printed materials in our stacks and electronic full text searches. Matching our collection with Duxiu fulltexts and allowing users to search in Duxiu fulltexts to find and borrow items from our printed collection is one way. The other way is producing our own fulltexts from printed books and offer them in our fulltext search. As a test case this collection includes 15 titles prepared in this way. \n' +
                                    '\n' +
                                    '<br><b>NOTE:</b> To see your full hit page you have to borrow the book (via the link to our OPAC provided with the title) and find the correct page. Please note that the "page number" given for your search hit is the "image number", so you have to add a certain number to find the correct printed page. But the idea is to help you find books of interest for your research of general interest.\n'+
                                    '</div>'));
                            }
                            if (facet==='Adam Matthew - China America Pacific') {
                                $('#' + 'more_collection').append($('<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo6\');" onmouseover="" style="cursor: pointer;"> <svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1024 1376v-160q0-14-9-23t-23-9h-96v-512q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v160q0 14 9 23t23 9h96v320h-96q-14 0-23 9t-9 23v160q0 14 9 23t23 9h448q14 0 23-9t9-23zM896 480v-160q0-14-9-23t-23-9h-192q-14 0-23 9t-9 23v160q0 14 9 23t23 9h192q14 0 23-9t9-23zM1536 896q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"></path>  <!----></svg></a>' +
                                    '' +
                                    '<div class="menu" id="foo6" style="display:none"> <a onclick="show_hidePopUpWindow(\'foo6\');"><svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" id="close_button" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1490 1322q0 40-28 68l-136 136q-28 28-68 28t-68-28l-294-294-294 294q-28 28-68 28t-68-28l-136-136q-28-28-28-68t28-68l294-294-294-294q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294 294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68l-294 294 294 294q28 28 28 68z"/>  <!----></svg></a><b>Adam Matthew - China America Pacific </b>\n'
                                    +
                                    '<br><b>CONTENT:</b> Collection of archival material held by different American institutions and libraries like the American Philosophical Society Library, Boston Athenæum, Bridgeman Art Library, California Historical Society, Hagley Museum and Library, Massachusetts Historical Society, Hawaiian Historical Society etc. It contains material related to the trading and cultural relationships that emerged between China, America and the Pacific region between the 18th and early 20th centuries like manuscript sources, rare printed texts, visual images, objects and maps.\n' +
                                    '\n' +
                                    '<br><b>NOTE:</b> The full text was done by OCR from partly handwritten material, thus the text is often of minor quality. For each hit in the search links to the bibliographical unit and to the individual page are provided.\n'+
                                    '</div>'));

                            }
                            if (facet==='SBB digital : Western language Asia collection') {
                                //console.log(facet);
                                $('#' + 'more_collection').append($('<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo401\');" onmouseover="" style="cursor: pointer;"><svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1024 1376v-160q0-14-9-23t-23-9h-96v-512q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v160q0 14 9 23t23 9h96v320h-96q-14 0-23 9t-9 23v160q0 14 9 23t23 9h448q14 0 23-9t9-23zM896 480v-160q0-14-9-23t-23-9h-192q-14 0-23 9t-9 23v160q0 14 9 23t23 9h192q14 0 23-9t9-23zM1536 896q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"></path>  <!----></svg></a>' +
                                    '' +
                                    '<div class="menu" id="foo401" style="display:none"> <a onclick="show_hidePopUpWindow(\'foo401\');"><svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" id="close_button" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1490 1322q0 40-28 68l-136 136q-28 28-68 28t-68-28l-294-294-294 294q-28 28-68 28t-68-28l-136-136q-28-28-28-68t28-68l294-294-294-294q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294 294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68l-294 294 294 294q28 28 28 68z"/>  <!----></svg></a><b>SBB digital : Western language Asia collection </b>\n' +
                                    '<br><b>CONTENT:</b> In the current version the dataset contains the OCR  fulltexts of 4653 titles of the East Asia Collection (Ostasiatica) digitized in the “SSG 6.25 digital“ project funded by the DFG. The titles were selected according to their allocation as materials concerning East and Southeast Asia in the “Alte Realkatalog”  <a href="http://ark.staatsbibliothek-berlin.de">(http://ark.staatsbibliothek-berlin.de)</a>. The material is mainly in Dutch, English, German and French, but does also contain texts in Spanish, Italian, Latin, Russian and Portuguese. \n' +
                                    '<br><b>NOTE:</b> The fulltext is produced by OCR. For the hits we provide links to the book or journal and the individual page display in the Digital Collection of the SBB. The material is in the public domain.\n</div>'));

                            }

                            if (facet==='China and the Modern World: Records of the Maritime Customs Service of China (1854-1949)') {
                                $('#' + 'more_collection').append($('<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo94\');" onmouseover="" style="cursor: pointer;"> <svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1024 1376v-160q0-14-9-23t-23-9h-96v-512q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v160q0 14 9 23t23 9h96v320h-96q-14 0-23 9t-9 23v160q0 14 9 23t23 9h448q14 0 23-9t9-23zM896 480v-160q0-14-9-23t-23-9h-192q-14 0-23 9t-9 23v160q0 14 9 23t23 9h192q14 0 23-9t9-23zM1536 896q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"></path>  <!----></svg></a>' +
                                    '' +
                                    '<div class="menu" id="foo94" style="display:none"><a onclick="show_hidePopUpWindow(\'foo94\');"> ' +
                                    '<svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" id="close_button" style="font-size: 2em; color: rgb(180, 24, 21);">' +
                                    '<path d="M1490 1322q0 40-28 68l-136 136q-28 28-68 28t-68-28l-294-294-294 294q-28 28-68 28t-68-28l-136-136q-28-28-28-68t28-68l294-294-294-294q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294 294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68l-294 294 294 294q28 28 28 68z"/>  <!----></svg>' +
                                    '</a>' +
                                    '<b>Records of the Maritime Customs Service of China (1854-1949) </b>' +
                                    '<br><b>CONTENT:</b> The resource contains official correspondence, despatches, reports, memoranda, as well as private and confidential  letter of the Maritime Customs Service of China, an international, although predominantly British-staffed bureaucracy (at senior levels) under the control of successive Chinese central governments from its founding in 1854 until January 1950. With 720 documents and almost 300.000 pages it provides evidence Chinese life, the economy and politics of of late Qing and Republican times until the founding of the People’s Republic of China in 1949. \n' +
                                    '\n' +
                                    '<br><b>NOTE:</b> The documents are scanned from microfilm and the fulltext derives from uncleaned OCR. As many documents are handwritten the text quality thus often inferior. The link provided for the individual text pages lead to the corresponding scan unfortunately without the document’s context. \n'+
                                    '</div>'));

                            }

                            if (facet==='Adam Matthew - Meiji Japan') {
                                $('#' + 'more_collection').append($('<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo8\');" onmouseover="" style="cursor: pointer;"> <svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1024 1376v-160q0-14-9-23t-23-9h-96v-512q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v160q0 14 9 23t23 9h96v320h-96q-14 0-23 9t-9 23v160q0 14 9 23t23 9h448q14 0 23-9t9-23zM896 480v-160q0-14-9-23t-23-9h-192q-14 0-23 9t-9 23v160q0 14 9 23t23 9h192q14 0 23-9t9-23zM1536 896q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"></path>  <!----></svg></a>' +
                                    '' +
                                    '<div class="menu" id="foo8" style="display:none"><a onclick="show_hidePopUpWindow(\'foo8\');"> ' +
                                    '<svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" id="close_button" style="font-size: 2em; color: rgb(180, 24, 21);">' +
                                    '<path d="M1490 1322q0 40-28 68l-136 136q-28 28-68 28t-68-28l-294-294-294 294q-28 28-68 28t-68-28l-136-136q-28-28-28-68t28-68l294-294-294-294q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294 294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68l-294 294 294 294q28 28 28 68z"/>  <!----></svg>' +
                                    '</a>' +
                                    '<b>Adam Matthew - Meiji Japan </b>' +
                                    '<br><b>CONTENT:</b> The collection contains the diaries and correspondence of Edward S Morse (1838-1925), one of the first Americans to live in Japan for a longer period while teaching science at the Imperial University of Tokyo. A polymath especially interested in the fields natural history, ethnography and art history, he was an accomplished draughtsman and his drawings and sketches enliven his diaries and letters. In addition to preserving the household records of a samurai family and many accounts of the tea ceremony, Morse made notes on subjects as diverse as shop signs, fireworks, hairpins, agricultural tools, artists’ studios, music, games, printing, carpentry, the Ainu, gardens, household construction, art and architecture. His correspondence include exchanges with Alexander and Louis Agassiz, William Sturgis Bigelow, Charles Darwin, Ernest Fenollosa, Yukichi Fukuzawa, Isabella Stewart Gardner, John M Gould, Oliver Wendell Holmes, Ernest Ingersoll, Hiroyuki Kato, Percival Lowell, The Museum of Fine Arts in Boston, Charles Eliot Norton, Frederick Putnam, Hideo Takamine, Seiichi Tejima, Charles Townsend, Charles Weld and Yu Kil-chun.\n' +
                                    '\n' +
                                    '<br><b>NOTE:</b> As all items in this collection are either handwritten or images, none of them has provided fulltext yet. Thus only the metadata can be searched.\n'+
                                    '</div>'));

                            }
                            if (facet==='Gujin tushu jicheng') {
                                $('#' + 'more_collection').append($('<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo810\');" onmouseover="" style="cursor: pointer;"> <svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1024 1376v-160q0-14-9-23t-23-9h-96v-512q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v160q0 14 9 23t23 9h96v320h-96q-14 0-23 9t-9 23v160q0 14 9 23t23 9h448q14 0 23-9t9-23zM896 480v-160q0-14-9-23t-23-9h-192q-14 0-23 9t-9 23v160q0 14 9 23t23 9h192q14 0 23-9t9-23zM1536 896q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"></path>  <!----></svg></a>' +
                                    '' +
                                    '<div class="menu" id="foo810" style="display:none"><a onclick="show_hidePopUpWindow(\'foo810\');"> ' +
                                    '<svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" id="close_button" style="font-size: 2em; color: rgb(180, 24, 21);">' +
                                    '<path d="M1490 1322q0 40-28 68l-136 136q-28 28-68 28t-68-28l-294-294-294 294q-28 28-68 28t-68-28l-136-136q-28-28-28-68t28-68l294-294-294-294q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294 294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68l-294 294 294 294q28 28 28 68z"/>  <!----></svg>' +
                                    '</a>' +
                                    '<b>Qing Imperial Encyclopedia (Gujin tushu jicheng) \n' +
                                    '古今圖書集成\n </b>' +
                                    '<br><b>CONTENT:</b> With 6,117 topical sections on over 800,000 pages, the Gujin tushu jicheng 古今圖書集成 is the largest still extent encyclopedic compilation of Chinese history. Started by Chen Menglei 陳夢雷under the imperial order of the Kangxi emperor 康熙 (r. 1661-1722) between 1701 und 1706 it was published and printed with moveable copper type in 1726 under the supervision of Jiang Tingxi 蔣廷錫.Each section assembles excerpts from a great variety of sources from early writings up to the 17th century.\n' +
                                    '\n' +
                                    '<br><b>NOTE:</b> No links to the individual pages in the database are possible. To find your hit page in the database you have to click the \'book\' link that will open the respective section and then go to the page number given in the page hit.\n'+
                                    '</div>'));

                            }


                        }

                        if ( this.field!='title_facet') {
                            $('#' + show_more_div_id).append($('<span class="text_facet" style="padding-left: 2px; font-size: small;"></span>').text(facet));
                        }

                        $('#' + show_more_div_id).append($('<span id="number" style="font-size: x-small"></span>').text(' (' + cur_facet_count + ')'));
                    }

                    if (cur_facet_count != 0) {
                        $('#' + show_more_div_id).append($('<br>'));
                    }
                    num_hidden++;
                }
            }

            var ac_id = this.field + '_all_extra';
            var returned_facets2 = returned_facets;

            var count2 = ac_id[facet];
            var count3 = (returned_facets2[facet]);

            if (Object.values(returned_facets).length >12) {

                //var more_or_less_txt = (this.display_style == 'none') ? '+more('+(facet_num)+')' : '-less'+'('+facet_num+')';
                var more_or_less_txt = (this.display_style == 'none') ? '+more' :  '-less'+'('+facet_num+')';
                if  (this.field==='collection'){

                }
                $(this.target).append('<a id="' + show_more_div_id + '_txt" href="#">' + more_or_less_txt + '</a>');
                $('#' + show_more_div_id + '_txt').click(this.toggleExtra(show_more_div_id));

            }  else {
            }

            if (Object.values(returned_facets).length < 12){
                var more_or_less_txt = (this.display_style == 'none') ? '' : '';
                $(this.target).append('<a id="' + show_more_div_id + '_txt" href="#">' + more_or_less_txt + '</a>');
                $('#' + show_more_div_id + '_txt').click(this.toggleExtra(show_more_div_id));

            }

            $('#' + ac_id).autocomplete({
                source: this.autocompleteAjaxFunction(),
                minLength: 1,
                appendTo: this.target,
                select: this.autocompleteSelect()
            });

        }
    });

})(jQuery);
