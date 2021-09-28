(function ($) {
    AjaxSolr.MultiSelectWidget = AjaxSolr.AbstractFacetWidget.extend({
        checkboxChange: function (facet) {
            var self = this;
            var innerCheckboxChange = function () {
                return self.updateQueryDoRequest(facet, this.checked);
            };
            return innerCheckboxChange;
        },

        toggle(element){
        if (element.style.display !== "none")
            element.style.display = "none";
        else element.style.display = "block";
        },
        autocompleteSelect: function () {
            var self = this;
            var innerAutocompleteSelect = function (event, ui) {
                return self.updateQueryDoRequest(ui.item.value, true);
            };
            return innerAutocompleteSelect;
        },
        autocompleteAjaxFunction: function () {
            var self = this;
            var autocompleteDoAjax = function (req, resp) {
                var autocompleteDoAjax_callback_gen = function (req, resp) {
                    var autocompleteDoAjax_callback = function (data) {
                        var field_facet_counts = data.facet_counts.facet_fields[self.field];
                        var matches_arr = [];
                        var match_regex = new RegExp(req.term, "i");
                        $.map(field_facet_counts, function (v, i) {
                            if (i.match(match_regex)) {
                                matches_arr.push(i);
                            }
                        });
                        matches_arr.sort(function (a, b) {
                            return field_facet_counts[b] - field_facet_counts[a];
                        });
                        resp(matches_arr);
                    };
                    return autocompleteDoAjax_callback;
                };
                var search_term = req.term;
                var search_string;
                if (typeof self.autocomplete_field == "undefined") {
                    //Just get all facets and filter & sort in Javascript
                    search_string =
                        "facet=true&q=*:*&facet.field=" +
                        self.field +
                        "&facet.mincount=1&facet.threads=-1&json.nl=map";
                    //search_string = 'rows=0&facet=true&facet.limit=-1&q=*:*&facet.field=' + self.field + '&facet.mincount=1&facet.threads=-1&json.nl=map';
                } else {
                    //have Solr do the filtering (but will still need to filter in JavaScript, for multi-valued fields),
                    //e.g. on a separate case-insensitive version of the field --- see here for how to set one up:
                    //http://stackoverflow.com/questions/2053214/how-to-create-a-case-insensitive-copy-of-a-string-field-in-solr
                    var search_query;
                    if (self.autocomplete_field_case == "upper") {
                        search_query =
                            self.autocomplete_field + ":*" + search_term.toUpperCase() + "*";
                    } else if (self.autocomplete_field_case == "lower") {
                        search_query =
                            self.autocomplete_field + ":*" + search_term.toLowerCase() + "*";
                    } else {
                        //leave as-is
                        search_query = self.autocomplete_field + ":*" + search_term + "*";
                    }
                    search_string =
                        "facet=true&q=" +
                        search_query +
                        "&facet.field=" +
                        self.field +
                        "&facet.mincount=1&facet.threads=-1&json.nl=map";
                    //search_string = 'rows=0&facet=true&facet.limit=-1&q=' + search_query + '&facet.field=' + self.field + '&facet.mincount=1&facet.threads=-1&json.nl=map';
                }
                self.manager.executeRequest(
                    "ajax",
                    search_string,
                    autocompleteDoAjax_callback_gen(req, resp)
                );
            };
            return autocompleteDoAjax;
        },
        updateQueryDoRequest: function (facet, checked_flag) {
            var self = this;
            var check_state = self.check_state;
            if (typeof check_state == "undefined") {
                self.check_state = {};
                check_state = self.check_state;
            }
            if (checked_flag) {
                check_state[facet] = true;
            } else {
                delete check_state[facet];
            }
            var checked_facets_arr = $.map(check_state, function (v, i) {
                return '"' + i + '"';
            });
            self.manager.store.removeByValue("fq", new RegExp("^" + self.field));
            self.manager.store.removeByValue(
                "facet.query",
                new RegExp("^" + self.field)
            );
            if (checked_facets_arr.length > 0) {
                var solr_query;
                if (checked_facets_arr.length == 1) {
                    solr_query = self.field + ":" + checked_facets_arr[0];
                } else {
                    solr_query =
                        self.field + ":(" + checked_facets_arr.join(" OR ") + ")";
                }
                self.manager.store.addByValue("fq", solr_query);
                //Need to do explicit facet queries for user-chosen items (facet.field queries are not necessarily
                //returning full results each request, only up to facet.limit, and so it is possible user-chosen ones
                //wouldn't be among top returned values so need to explicitly get their counts)
                for (var i = 0; i < checked_facets_arr.length; i++) {
                    var cur_facet_query = self.field + ":" + checked_facets_arr[i];
                    self.manager.store.addByValue("facet.query", cur_facet_query);
                }
            }
            self.doRequest();
            return false;
        },
        sortFacets: function (objectedItems) {
            var sort_type = this.sort_type;
            if (typeof sort_type == "undefined") {
                sort_type = "count";
            }
            if (sort_type == "range") {
                //All the facet values should be like '20 TO 40', '50 TO 100', etc. or this sort type won't work
                objectedItems.sort(function (a, b) {
                    if (typeof a.start == "undefined") {
                        return 1;
                    }
                    if (typeof b.start == "undefined") {
                        return -1;
                    }
                    return a.start < b.start ? -1 : 1;
                });
            } else if (sort_type == "lex") {
                //sort facets alphabetically
                objectedItems.sort(function (a, b) {
                    return a.facet < b.facet ? -1 : 1;
                });
            } else if (sort_type == "count") {
                //the count in the current result set
                objectedItems.sort(function (a, b) {
                    return b.count < a.count ? -1 : 1;
                });
            }
        },
        toggleExtra: function (show_more_div_id) {
            var self = this;
            var clickFunc = function () {
                var el = document.getElementById(show_more_div_id);
                var el_txt = document.getElementById(show_more_div_id + "_txt");
                if (el && el_txt) {
                    if (el.style.display != "none") {
                        el.style.display = "none";
                        el_txt.innerHTML = "+more";
                        //el_txt.innerHTML = numberMore;
                        self.display_style = "none";
                    } else {
                        el.style.display = "";
                        el_txt.innerHTML = "-less";
                        self.display_style = "";
                    }
                }
                return false;
            };
            return clickFunc;
        },
        setRangeFacetStartEnd: function (facet, facet_rec) {
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
            var returned_facets = this.manager.response.facet_counts.facet_fields[
                this.field
                ];
            //console.log(Object.keys(returned_facets).length);
            if (returned_facets === undefined) {
                returned_facets = {};
            }
            if (!this.manager.store.find("fq", new RegExp("^" + this.field))) {
                //reset --> all checks off
                this.check_state = {};
            }
            if (typeof this.display_style == "undefined") {
                this.display_style = "none";
            }
            var checked_objectedItems = [];
            var unchecked_objectedItems = [];
            var cur_facets_hash = {};
            for (var facet in returned_facets) {
                var count = parseInt(returned_facets[facet]);
                var facet_rec = {
                    facet: facet,
                    count: count,
                };
                if (this.sort_type == "range") {
                    this.setRangeFacetStartEnd(facet, facet_rec);
                }
                if (this.check_state && this.check_state[facet]) {
                    checked_objectedItems.push(facet_rec);
                } else {
                    unchecked_objectedItems.push(facet_rec);
                }
                cur_facets_hash[facet] = facet_rec;
            }
            if (typeof this.check_state != "undefined") {
                var num_checked_facets = Object.keys(this.check_state).length;
                if (num_checked_facets > checked_objectedItems.length) {
                    //some checked items not present in current result set, need to add them from full result set
                    for (var cur_checked_facet in this.check_state) {
                        if (!cur_facets_hash[cur_checked_facet]) {
                            //Add a new record, getting count from facet query done for it)
                            var new_facet_rec = {
                                facet: cur_checked_facet,
                            };
                            if (this.sort_type == "range") {
                                this.setRangeFacetStartEnd(facet, new_facet_rec);
                            }
                            new_facet_rec.count = parseInt(
                                this.manager.response.facet_counts.facet_queries[
                                this.field + ':"' + cur_checked_facet + '"'
                                    ]
                            );
                            if (typeof new_facet_rec.count == "undefined") {
                                new_facet_rec.count = 0;
                            } //if for some strange reason no facet query value...
                            checked_objectedItems.push(new_facet_rec);
                            cur_facets_hash[cur_checked_facet] = new_facet_rec;
                        }
                    }
                }
            }
            this.sortFacets(checked_objectedItems);
            this.sortFacets(unchecked_objectedItems);
            var objectedItems = checked_objectedItems.concat(unchecked_objectedItems);
            if (typeof this.init_objectedItems == "undefined") {
                //  $.extend(cur_facets_hash_copy, cur_facets_hash );
                var objectedItems_copy = JSON.parse(JSON.stringify(objectedItems));
                var cur_facets_hash_copy = JSON.parse(JSON.stringify(cur_facets_hash));
                this.init_objectedItems = objectedItems_copy;
                this.init_facets_hash = cur_facets_hash_copy;
            }
            if (typeof this.max_facets != "undefined") {
                if (objectedItems.length < this.max_facets) {
                    var num_to_add_from_init = this.max_facets - objectedItems.length;
                    if (num_to_add_from_init > this.init_objectedItems.length) {
                        num_to_add_from_init = this.init_objectedItems.length;
                    }
                    for (var i = 0; i < this.init_objectedItems.length; i++) {
                        if (!cur_facets_hash[this.init_objectedItems[i].facet]) {
                            objectedItems.push(this.init_objectedItems[i]);
                            if (--num_to_add_from_init <= 0) {
                                break;
                            }
                        }
                    }
                } else if (objectedItems.length > this.max_facets) {
                    //bug: if user checks a lot, some won't be shown; fixed below, but check it more
                    if (checked_objectedItems.length >= this.max_facets) {
                        objectedItems = checked_objectedItems;
                    } else {
                        objectedItems.length = this.max_facets;
                    }
                }
            } else {
                var num_to_add_from_init = this.init_objectedItems.length;
                for (var i = 0; i < num_to_add_from_init; i++) {
                    if (!cur_facets_hash[this.init_objectedItems[i].facet]) {
                        objectedItems.push(this.init_objectedItems[i]);
                    }
                }
            }
            var show_more_div_id = "more_" + this.field;
            $(this.target).empty();
            var num_hidden = 0;
            var ac_id = this.field + "_all_extra";
            if (num_hidden > 0) {
                //$('#' + show_more_div_id).append('Or search: ');
                $("#" + show_more_div_id).append(
                    $('<input id="' + ac_id + '">' + "<br>")
                );
            } else {
                //$(this.target).append('Or search: ');
                $(this.target).append($('<input id="' + ac_id + '">' + "<br>"));
            }
            for (var i = 0; i < objectedItems.length; i++) {
                var facet = objectedItems[i].facet;
                var count = "undefined";
                var cur_facet_count =
                    typeof cur_facets_hash[facet] != "undefined" ?
                        cur_facets_hash[facet].count :
                        0;
                var all_facet_cout = objectedItems.length;
                var facet_num = all_facet_cout - 10;
                var checked_txt = "";
                var info_button =
                    '<svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1024 1376v-160q0-14-9-23t-23-9h-96v-512q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v160q0 14 9 23t23 9h96v320h-96q-14 0-23 9t-9 23v160q0 14 9 23t23 9h448q14 0 23-9t9-23zM896 480v-160q0-14-9-23t-23-9h-192q-14 0-23 9t-9 23v160q0 14 9 23t23 9h192q14 0 23-9t9-23zM1536 896q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"></path>  <!----></svg>';
                var close_button =
                    '<svg data-v-1a31d9e4="" version="1.1" role="presentation" width="20" height="20" viewBox="0 0 1536 1792" class="fa-icon" id="close_button" style="font-size: 2em; color: rgb(180, 24, 21);"><path d="M1490 1322q0 40-28 68l-136 136q-28 28-68 28t-68-28l-294-294-294 294q-28 28-68 28t-68-28l-136-136q-28-28-28-68t28-68l294-294-294-294q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294 294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68l-294 294 294 294q28 28 28 68z"/>  <!----></svg>';
                if (this.check_state && this.check_state[facet]) {
                    checked_txt = " checked=true";
                }
                if (typeof this.max_show == "undefined" || i < this.max_show) {
                    if (cur_facet_count != 0) {
                        $(this.target).append(
                            $(
                                '<input type=checkbox class="cheki" id="' +
                                this.field +
                                "_" +
                                facet +
                                '_checkbox"' +
                                checked_txt +
                                "></input>"
                            ).change(this.checkboxChange(facet))
                        );
                    }
                    var thechosenone = "";

                    function toggle(element){
                        if (element.style.display !== "none")
                            element.style.display = "none";
                        else element.style.display = "block";
                    }

                    if (this.field === "collection" && cur_facet_count != 0) {
                        if (facet === "Renmin Ribao") {
                            $(this.target).append($('<a class="click" id="btn-rmrb" style="cursor: pointer;">' +
                                info_button +
                                '</a><span id="rmrb"></span>'));

                            $('#btn-rmrb').click(function (e) {
                                $.ajax({
                                    url: 'collections/rmrb.html',
                                    type: 'get',
                                    success: function  (data) {
                                        $('#rmrb').html(data).toggle();
                                    }
                                })
                            });
                        }
                        if (facet === "Airiti") {
                            $(this.target).append($('<button class="click" id="btn-airiti">' +
                                info_button +
                                '</button> <span id="airiti"></span>'));

                            $('#btn-airiti').click(function (e) {
                                $.ajax({
                                    url: 'collections/airiti.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#airiti').html(data).toggle();
                                    }
                                })
                            });
                        }
                        if (facet === "Adam Matthew - Foreign Office Files China & Japan") {
                            $(this.target).append($('<button class="click" id="btn-adammatthew">' +
                                info_button +
                                '</button> <span id="adammatthew"></span>'));

                            $('#btn-adammatthew').click(function (e) {
                                $.ajax({
                                    url: 'collections/adammatthew.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#adammatthew').html(data).toggle();
                                    }
                                })
                            });
                        }
                        if (facet === "Early Twentieth Century Chinese Books (1912-1949)") {
                            $(this.target).append($('<button class="click" id="btn-minguo">' +
                                info_button +
                                '</button> <span id="minguo"></span>'));

                            $('#btn-minguo').click(function (e) {
                                $.ajax({
                                    url: 'collections/minguo.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#minguo').html(data).toggle();
                                    }
                                })
                            });
                        }
                        if (facet === "SBB digital : Asian language collection (selection)") {
                            $(this.target).append($('<button class="click" id="btn-sbb-digital">' +
                                info_button +
                                '</button> <span id="sbb-digital"></span>'));

                            $('#btn-sbb-digital').click(function (e) {
                                $.ajax({
                                    url: 'collections/sbb-digital.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#sbb-digital').html(data).toggle();
                                    }
                                })
                            });
                        }
                        if (facet === "Local Gazetteer") {
                            $(this.target).append($('<button class="click" id="btn-locgaz">' +
                                info_button +
                                '</button> <span id="locgaz"></span>'));

                            $('#btn-locgaz').click(function (e) {
                                $.ajax({
                                    url: 'collections/locgaz.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#locgaz').html(data).toggle();
                                    }
                                })
                            });
                        }
                        if (facet === "Missionary, Sinology, and Literary Periodicals (1817-1949)") {
                            $(this.target).append($('<button class="click" id="btn-gale-cfer">' +
                                info_button +
                                '</button> <span id="gale-cfer"></span>'));

                            $('#btn-gale-cfer').click(function (e) {
                                $.ajax({
                                    url: 'collections/gale-cfer.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#gale-cfer').html(data).toggle();
                                    }
                                })
                            });
                        }
                        if (facet === "Local Gazetteer (Diaolong)") {

                            $(this.target).append($('<button class="click" id="btn-dfz">' +
                                info_button +
                                '</button> <span id="dfz"></span>'));

                            $('#btn-dfz').click(function (e) {
                                $.ajax({
                                    url: 'collections/dfz.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#dfz').html(data).toggle();
                                    }
                                })
                            });
                        }
                        if (facet === "Qingdai shiliao") {
                            $(this.target).append($('<button class="click" id="btn-dl-shiliao">' +
                                info_button +
                                '</button> <span id="dl-shiliao"></span>'));

                            $('#btn-dl-shiliao').click(function (e) {
                                $.ajax({
                                    url: 'collections/dl-shiliao.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#dl-shiliao').html(data).toggle();
                                    }
                                })
                            });
                        }
                        if (facet === "Sibu congkan") {
                            $(this.target).append($('<button class="click" id="btn-sbck">' +
                                info_button +
                                '</button> <span id="sbck"></span>'));

                            $('#btn-sbck').click(function (e) {
                                $.ajax({
                                    url: 'collections/sbck.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#sbck').html(data).toggle();
                                    }
                                })
                            });
                        }
                        if (facet === "SBB digital : Western language Asia collection") {
                            $(this.target).append($('<button class="click" id="btn-sbb-digital">' +
                                info_button +
                                '</button> <span id="sbb-digital"></span>'));

                            $('#btn-sbb-digital').click(function (e) {
                                $.ajax({
                                    url: 'collections/sbb-digital.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#sbb-digital').html(data).toggle();
                                    }
                                })
                            });
                        }
                        if (facet === "The Chinese Students’ Monthly Online") {
                            $(this.target).append($('<button class="click" id="btn-brill-csmo">' +
                                info_button +
                                '</button> <span id="brill-csmo"></span>'));

                            $('#btn-brill-csmo').click(function (e) {
                                $.ajax({
                                    url: 'collections/brill-csmo.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#brill-csmo').html(data).toggle();
                                    }
                                })
                            });
                        }
                        if (facet === "The North China Herald Online") {
                            $(this.target).append($('<button class="click" id="btn-brill-ncho">' +
                                info_button +
                                '</button> <span id="brill-ncho"></span>'));

                            $('#btn-brill-ncho').click(function (e) {
                                $.ajax({
                                    url: 'collections/brill-ncho.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#brill-ncho').html(data).toggle();
                                    }
                                })
                            });
                        }
                        if (facet === "Japan Chronicle Online") {
                            $(this.target).append($('<button class="click" id="btn-brill-jpco">' +
                                info_button +
                                '</button> <span id="brill-jpco"></span>'));

                            $('#btn-brill-jpco').click(function (e) {
                                $.ajax({
                                    url: 'collections/brill-jpco.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#brill-jpco').html(data).toggle();
                                    }
                                })
                            });
                        }
                        if (facet === "Daozang jiyao") {
                            $(this.target).append($('<button class="click" id="btn-dl-jiyao">' +
                                info_button +
                                '</button> <span id="dl-jiyao"></span>'));

                            $('#btn-dl-jiyao').click(function (e) {
                                $.ajax({
                                    url: 'collections/dl-jiyao.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#dl-jiyao').html(data).toggle();
                                    }
                                })
                            });
                        }
                        if (facet === "Xuxiu Siku quanshu") {
                            $(this.target).append($('<button class="click" id="btn-xuxiu">' +
                                info_button +
                                '</button> <span id="xuxiu"></span>'));

                            $('#btn-xuxiu').click(function (e) {
                                $.ajax({
                                    url: 'collections/xuxiu.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#xuxiu').html(data).toggle();
                                    }
                                })
                            });
                        }
                        if (facet === "Adam Matthew - China America Pacific") {
                            $(this.target).append($('<button class="click" id="btn-china-pacific">' +
                                info_button +
                                '</button> <span id="china-pacific"></span>'));

                            $('#btn-china-pacific').click(function (e) {
                                $.ajax({
                                    url: 'collections/china-pacific.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#china-pacific').html(data).toggle();
                                    }
                                })
                            });
                        }
                        if (facet === "Adam Matthew - China Trade & Politics") {
                            $(this.target).append($('<button class="click" id="btn-china-trade">' +
                                info_button +
                                '</button> <span id="china-trade"></span>'));
                            $('#btn-china-trade').click(function (e) {
                                $.ajax({
                                    url: 'collections/china-trade.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#china-trade').html(data).toggle();
                                    }
                                })
                            });
                        }
                        if (facet === "Adam Matthew - Meiji Japan") {
                            $(this.target).append($('<button class="click" id="btn-meiji-japan">' +
                                info_button +
                                '</button> <span id="meiji-japan"></span>'));

                            $('#btn-meiji-japan').click(function (e) {
                                $.ajax({
                                    url: 'collections/meiji-japan.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#meiji-japan').html(data).toggle();
                                    }
                                })
                            });
                        }
                        if (facet === "CNKI eBooks") {
                            $(this.target).append($('<button class="click" id="btn-cnki">' +
                                info_button +
                                '</button> <span id="cnki"></span>'));

                            $('#btn-cnki').click(function (e) {
                                $.ajax({
                                    url: 'collections/cnki.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#cnki').html(data).toggle();
                                    }
                                })
                            });
                        }
                        if (facet === "China Comprehensive Gazetteers") {
                            $(this.target).append($('<button class="click" id="btn-eastview-ccg">' +
                                info_button +
                                '</button> <span id="eastview-ccg"></span>'));

                            $('#btn-eastview-ccg').click(function (e) {
                                $.ajax({
                                    url: 'collections/eastview-ccg.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#eastview-ccg').html(data).toggle();
                                    }
                                })
                            });
                        }
                        if (facet === "Fulltext search in print books") {
                            $(this.target).append($('<button class="click" id="btn-cibtc">' +
                                info_button +
                                '</button> <span id="cibtc"></span>'));

                            $('#btn-cibtc').click(function (e) {
                                $.ajax({
                                    url: 'collections/cibtc.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#cibtc').html(data).toggle();
                                    }
                                })
                            });
                        }
                        if (facet === "Zhengtong Daozang") {
                            $(this.target).append($('<button class="click" id="btn-daozang">' +
                                info_button +
                                '</button> <span id="daozang"></span>'));

                            $('#btn-daozang').click(function (e) {
                                $.ajax({
                                    url: 'collections/daozang.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#daozang').html(data).toggle();
                                    }
                                })
                            });
                        }
                        if (facet === "Classical Works of Japan") {
                            $(this.target).append($('<button class="click" id="btn-riben">' +
                                info_button +
                                '</button> <span id="riben"></span>'));

                            $('#btn-riben').click(function (e) {
                                $.ajax({
                                    url: 'collections/riben.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#riben').html(data).toggle();
                                    }
                                })
                            });
                        }
                        if (facet === "Siku quanshu") {
                            $(this.target).append($('<button class="click" id="btn-siku">' +
                                info_button +
                                '</button> <span id="siku"></span>'));

                            $('#btn-siku').click(function (e) {
                                $.ajax({
                                    url: 'collections/siku.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#siku').html(data).toggle();
                                    }
                                })
                            });
                        }
                        if (facet === "Yongle dadian") {
                            $(this.target).append($('<button class="click" id="btn-dl-yldd">' +
                                info_button +
                                '</button> <span id="dl-yldd"></span>'));

                            $('#btn-dl-yldd').click(function (e) {
                                $.ajax({
                                    url: 'collections/dl-yldd.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#dl-yldd').html(data).toggle();
                                    }
                                })
                            });
                        }
                        if (facet === "China and the Modern World: Records of the Maritime Customs Service of China (1854-1949)") {
                            $(this.target).append($('<button class="click" id="btn-gale-cfer2">' +
                                info_button +
                                '</button> <span id="gale-cfer2"></span>'));

                            $('#btn-gale-cfer2').click(function (e) {
                                $.ajax({
                                    url: 'collections/gale-cfer2.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#gale-cfer2').html(data).toggle();
                                    }
                                })
                            });

                        }
                        if (facet === "Beschreibung") {
                            $(this.target).append($('<button class="click" id="btn-beschreibung">' +
                                info_button +
                                '</button> <span id="beschreibung"></span>'));

                            $('#btn-beschreibung').click(function (e) {
                                $.ajax({
                                    url: 'collections/beschreibung.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#beschreibung').html(data).toggle();
                                    }
                                })
                            });
                        }
                        if (facet === "Gujin tushu jicheng") {
                            $(this.target).append($('<button class="click" id="btn-gujin">' +
                                info_button +
                                '</button> <span id="gujin"></span>'));

                            $('#btn-gujin').click(function (e) {
                                $.ajax({
                                    url: 'collections/gujin.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#gujin').html(data).toggle();
                                    }
                                })
                            });
                        }
                        if (facet === "Sibu beiyao") {
                            $(this.target).append($('<button class="click" id="btn-sbby">' +
                                info_button +
                                '</button> <span id="sbby"></span>'));

                            $('#btn-sbby').click(function (e) {
                                $.ajax({
                                    url: 'collections/sbby.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#sbby').html(data).toggle();
                                    }
                                })
                            });
                        }
                        if (facet === "The Ta Kung Pao 大公報") {
                            $(this.target).append($('<button class="click" id="btn-kungpao">' +
                                info_button +
                                '</button> <span id="kungpao"></span>'));

                            $('#btn-kungpao').click(function (e) {
                                $.ajax({
                                    url: 'collections/kungpao.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#kungpao').html(data).toggle();
                                    }
                                })
                            });
                        }
                        if (facet === "North China Daily News") {
                            $(this.target).append($('<button class="click" id="btn-brill-ncdn">' +
                                info_button +
                                '</button> <span id="brill-ncdn"></span>'));

                            $('#btn-brill-ncdn').click(function (e) {
                                $.ajax({
                                    url: 'collections/brill-ncdn.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#brill-ncdn').html(data).toggle();
                                    }
                                })
                            });
                        }
                        if (facet === "North China Standard Online") {
                            $(this.target).append($('<button class="click" id="btn-brill-ncso">' +
                                info_button +
                                '</button> <span id="brill-ncso"></span>'));

                            $('#btn-brill-ncso').click(function (e) {
                                $.ajax({
                                    url: 'collections/brill-ncso.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#brill-ncso').html(data).toggle();
                                    }
                                })
                            });
                        }
                        if (facet === "Mobilizing East Asia, 1931-1954") {
                            $(this.target).append($('<button class="click" id="btn-brill-meao">' +
                                info_button +
                                '</button> <span id="brill-meao"></span>'));

                            $('#btn-brill-meao').click(function (e) {
                                $.ajax({
                                    url: 'collections/brill-meao.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#brill-meao').html(data).toggle();
                                    }
                                })
                            });
                        }
                        if (facet === "Dunhuang Historical Material") {
                            $(this.target).append($('<button class="click" id="btn-dunhuang">' +
                                info_button +
                                '</button> <span id="dunhuang"></span>'));

                            $('#btn-dunhuang').click(function (e) {
                                $.ajax({
                                    url: 'collections/dunhuang.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#dunhuang').html(data).toggle();
                                    }
                                })
                            });
                        }
                        if (facet === "Area Studies Japan, China, and Southeast Asia") {
                            $(this.target).append($('<button class="click" id="btn-amd-areastudies">' +
                                info_button +
                                '</button> <span id="amd-areastudies"></span>'));

                            $('#btn-amd-areastudies').click(function (e) {
                                $.ajax({
                                    url: 'collections/amd-areastudies.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#amd-areastudies').html(data).toggle();
                                    }
                                })
                            });
                        }
                        if (facet === "Asian Studies (ISEAS publishing)") {
                            $(this.target).append($('<button class="click" id="btn-iseas">' +
                                info_button +
                                '</button> <span id="iseas"></span>'));

                            $('#btn-iseas').click(function (e) {
                                $.ajax({
                                    url: 'collections/iseas.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#iseas').html(data).toggle();
                                    }
                                })
                            });
                        }
                    }
                    if (this.field === "title_facet" && cur_facet_count != 0) {
                        if (facet.length > 40) {
                            var new_facet = facet.substring(0, 40) + "...";
                            $(this.target).append(
                                $(
                                    '<span class="text_facet" title="' + facet + '"style="padding-left: 2px; font-size: small;"></span>'
                                ).text(new_facet)
                            );
                            $(this.target).append($("<br1>"));
                        } else {
                            $(this.target).append(
                                $(
                                    '<span class="text_facet" title="' + facet + '"style="padding-left: 2px; font-size: small;"></span>'
                                ).text(facet)
                            );
                        }
                    } else {
                        //$(this.target).append($('<span class="text_facet" style="padding-left: 2px; font-size: small;"></span>').text(facet));
                    }
                    if (Object.values(returned_facets).length > 0) {
                        if (this.field === "person_facet") {
                            document.getElementById("personHide").style.display = "block";
                        }
                        if (this.field === "spatial_facet") {
                            document.getElementById("spatialHide").style.display = "block";
                        }
                        if (this.field === "author_facet") {
                            document.getElementById("authorHide").style.display = "block";
                        }
                        if (this.field === "edition_facet") {
                            document.getElementById("editionHide").style.display = "block";
                        }
                        if (this.field === "title_facet") {
                            document.getElementById("titleHide").style.display = "block";
                        }
                        if (this.field === "date") {
                            document.getElementById("dateHide").style.display = "block";
                        }
                        if (this.field === "language") {
                            document.getElementById("languageHide").style.display = "block";
                        }
                        if (this.field === "collection") {
                            document.getElementById("collectionHide").style.display = "block";
                        }
                    } else {
                        if (this.field === "person_facet") {
                            document.getElementById("personHide").style.display = "none";
                        }
                        if (this.field === "spatial_facet") {
                            document.getElementById("spatialHide").style.display = "none";
                        }
                        if (this.field === "title_facet") {
                            document.getElementById("titleHide").style.display = "none";
                        }
                        if (this.field === "date") {
                            document.getElementById("dateHide").style.display = "none";
                        }
                        if (this.field === "author_facet") {
                            document.getElementById("authorHide").style.display = "none";
                        }
                        if (this.field === "edition_facet") {
                            document.getElementById("editionHide").style.display = "none";
                        }
                        if (this.field === "language") {
                            document.getElementById("languageHide").style.display = "none";
                        }
                        if (this.field === "collection") {
                            document.getElementById("collectionHide").style.display = "none";
                        }
                    }
                    if (Object.values(returned_facets).length < 10) {
                        if (this.field === "person_facet") {
                            document.getElementById("person_facet_all_extra").style.display =
                                "none";
                        }
                        if (this.field === "spatial_facet") {
                            document.getElementById("spatial_facet_all_extra").style.display =
                                "none";
                        }
                        if (this.field === "date") {
                            document.getElementById("date_all_extra").style.display = "none";
                        }
                        if (this.field === "author_facet") {
                            document.getElementById("author_facet_all_extra").style.display =
                                "none";
                        }
                        if (this.field === "edition_facet") {
                            document.getElementById("edition_facet_all_extra").style.display =
                                "none";
                        }
                        if (this.field === "language") {
                            document.getElementById("language_all_extra").style.display =
                                "none";
                        }
                        if (this.field === "collection") {
                            document.getElementById("collection_all_extra").style.display =
                                "none";
                        }
                    }
                    if (cur_facet_count != 0) {
                        if (this.field != "title_facet") {
                            $(this.target).append(
                                $(
                                    '<span class="text_facet" title="' + facet + '"style="padding-left: 2px; font-size: small;"></span>'
                                ).text(facet)
                            );
                        }
                        $(this.target).append(
                            $('<span id="number" style="font-size: x-small"></span>').text(
                                " (" + cur_facet_count + ")"
                            )
                        );
                        $(this.target).append($("<br>"));
                    }
                }
                if (typeof this.max_show != "undefined" && i == this.max_show - 1) {
                    var display_style_txt =
                        this.display_style == "none" ? ' style="display:none"' : "";
                    $(this.target).append(
                        '<div id="' + show_more_div_id + '"' + display_style_txt + "></div>"
                    );
                }
                if (typeof this.max_show != "undefined" && i >= this.max_show) {
                    if (cur_facet_count != 0) {
                        $("#" + show_more_div_id).append(
                            $(
                                '<input type=checkbox class="cheki" id="' +
                                this.field +
                                "_" +
                                facet +
                                '_checkbox"' +
                                checked_txt +
                                "></input>"
                            ).change(this.checkboxChange(facet))
                        );
                    }
                    if (this.field === "title_facet" && cur_facet_count != 0) {
                        if (facet.length > 40) {
                            var new_facet = facet.substring(0, 40) + "...";
                            $("#" + show_more_div_id).append(
                                $(
                                    '<span class="text_facet" title="' + facet + '"style="padding-left: 2px; font-size: small;"></span>'
                                ).text(new_facet)
                            );

                        } else {
                            $("#" + show_more_div_id).append(
                                $(
                                    '<span class="text_facet" title="' + facet + '"style="padding-left: 2px; font-size: small;"></span>'
                                ).text(facet)
                            );
                        }
                    } else {
                    }
                    if (Object.values(returned_facets).length > 0) {
                        if (this.field === "person_facet") {
                            document.getElementById("personHide").style.display = "block";
                        }
                        if (this.field === "spatial_facet") {
                            document.getElementById("spatialHide").style.display = "block";
                        }
                        if (this.field === "author_facet") {
                            document.getElementById("authorHide").style.display = "block";
                        }
                        if (this.field === "edition_facet") {
                            document.getElementById("editionHide").style.display = "block";
                        }
                        if (this.field === "subject_facet") {
                            document.getElementById("subjectHide").style.display = "block";
                        }
                        if (this.field === "title_facet") {
                            document.getElementById("titleHide").style.display = "block";
                        }
                        if (this.field === "date") {
                            document.getElementById("dateHide").style.display = "block";
                        }
                        if (this.field === "language") {
                            document.getElementById("languageHide").style.display = "block";
                        }
                        if (this.field === "collection") {
                            document.getElementById("collectionHide").style.display = "block";
                        }
                    } else {
                        if (this.field === "person_facet") {
                            document.getElementById("personHide").style.display = "none";
                        }
                        if (this.field === "spatial_facet") {
                            document.getElementById("spatialHide").style.display = "none";
                        }
                        if (this.field === "title_facet") {
                            document.getElementById("titleHide").style.display = "none";
                        }
                        if (this.field === "date") {
                            document.getElementById("dateHide").style.display = "none";
                        }
                        if (this.field === "author_facet") {
                            document.getElementById("authorHide").style.display = "none";
                        }
                        if (this.field === "edition_facet") {
                            document.getElementById("editionHide").style.display = "none";
                        }
                        if (this.field === "subject_facet") {
                            document.getElementById("subjectHide").style.display = "none";
                        }
                        if (this.field === "language") {
                            document.getElementById("languageHide").style.display = "none";
                        }
                        if (this.field === "collection") {
                            document.getElementById("collectionHide").style.display = "none";
                        }
                    }
                    if (Object.values(returned_facets).length < 10) {
                        if (this.field === "person_facet") {
                            document.getElementById("person_facet_all_extra").style.display =
                                "none";
                        }
                        if (this.field === "spatial_facet") {
                            document.getElementById("spatial_facet_all_extra").style.display =
                                "none";
                        }
                        if (this.field === "date") {
                            document.getElementById("date_all_extra").style.display = "none";
                        }
                        if (this.field === "author_facet") {
                            document.getElementById("author_facet_all_extra").style.display =
                                "none";
                        }
                        if (this.field === "edition_facet") {
                            document.getElementById("edition_facet_all_extra").style.display =
                                "none";
                        }
                        if (this.field === "subject_facet") {
                            document.getElementById("subject_facet_all_extra").style.display =
                                "none";
                        }
                        if (this.field === "language") {
                            document.getElementById("language_all_extra").style.display =
                                "none";
                        }
                        if (this.field === "collection") {
                            document.getElementById("collection_all_extra").style.display =
                                "none";
                        }
                    }
                    if (cur_facet_count != 0) {
                        if (this.field == "collection") {
                            /*if (facet === "Renmin Ribao") {
                                $("#" + "more_collection").append(
                                    $(
                                        '<span> </span><a class="click" onclick="show_hidePopUpWindow(\'foo\');" onmouseover="" style="cursor: pointer;"> ' +
                                        info_button +
                                        "</a>" +
                                        "" +
                                        '<div class="menu" id="foo" style="display:none"><a onclick="show_hidePopUpWindow(\'foo\');">' +
                                        close_button +
                                        "</a><b>人民日报 : People's Daily </b>\n" +
                                        "<br><b>CONTENT:</b> Fulltexts of all articles from the inception of the People's Daily in 1946 to end of August 2009. Articles will be shown as individual hits of the issue of a certain day.\n" +
                                        "<br><b>NOTE:</b> To see the image-PDF of the issue you will have go to the database (http://erf.sbb.spk-berlin.de/han/RenminRibao1/) and open the issue via the calendar browse function provided in the database.\n</div>"
                                    )
                                );
                            }*/
                            if (facet === "Airiti") {
                                $("#" + "more_collection").append(
                                    $('<span id="airiti"> </span><a className="click" id="btn-airiti">' + info_button + '</a>').click(function (e) {
                                        $.ajax({
                                            url: 'collections/airiti.html',
                                            type: 'get',
                                            success: function (data) {
                                                $('#airiti').html(data).toggle();
                                            }
                                        })
                                    })
                                );
                            }
                            if (
                                facet === "Adam Matthew - Foreign Office Files China & Japan"
                            ) {
                                $("#" + "more_collection").append(
                                    $(
                                        '<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo3\');" onmouseover="" style="cursor: pointer;"> ' +
                                        info_button +
                                        "</a>" +
                                        "" +
                                        '<div class="menu" id="foo3" style="display:none"> <a onclick="show_hidePopUpWindow(\'foo3\');">' +
                                        close_button +
                                        "</a><b>Adam Matthew - Foreign Office Files China & Japan </b>\n" +
                                        "<br><b>CONTENT:</b> The collection of Foreign Office Files for China is based on the holdings of the National Archives, Kew, the official archive of the United Kingdom; that for Japan is sourced from the rich FO 371 and FO 262 series at The National Archives, UK, including some formerly restricted Japan-specific documents, and is further enhanced by the addition of a selection of FO 371 Far Eastern General sub-series, and Western and American Department papers. The Foreign Office Files contain diplomatic correspondence, letters, reports, surveys, material from newspapers, statistical analyses, published pamphlets, ephemera, military papers, profiles of prominent individuals, maps and many other types of document. The China and Japan series are subdivided into time segments of specific political interest. \n" +
                                        "<br><b>NOTE:</b> The full text was done by OCR from partly handwritten material, thus the text is often of minor quality.</div>"
                                    )
                                );
                            }
                            if (
                                facet === "Early Twentieth Century Chinese Books (1912-1949)"
                            ) {
                                $("#" + "more_collection").append(
                                    $(
                                        '<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo4\');" onmouseover="" style="cursor: pointer;"> ' +
                                        info_button +
                                        "</a>" +
                                        "" +
                                        '<div class="menu" id="foo4" style="display:none"> <a onclick="show_hidePopUpWindow(\'foo4\');">' +
                                        close_button +
                                        "</a><b>Early Twentieth Century Book in China (1912-1949) </b>\n" +
                                        "<br><b>CONTENT:</b> Covering the Republican Period of mainland China fulltexts (and images) of over 180,000 titles of the whole spectrum of topics are included in this resource (Early Twentieth Century Book in China (1912-1949) / 民國圖書數據庫). Books are mostly Chinese, but are actually in Japanese. Unfortunately the metadata does not provide this information.\n" +
                                        "<br><b>NOTE:</b> Fulltext has been done with OCR, so a certain amount of mistakes are to be expected. In cases where no “meaningful” content could be produced no fulltext page exists. Links to the book and the individual pages are provided in the list of hits.</div>"
                                    )
                                );
                            }
                            if (
                                facet === "SBB digital : Asian language collection (selection)"
                            ) {
                                $("#" + "more_collection").append(
                                    $(
                                        '<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo5\');" onmouseover="" style="cursor: pointer;"> ' +
                                        info_button +
                                        "</a>" +
                                        "" +
                                        '<div class="menu" id="foo5" style="display:none"> <a onclick="show_hidePopUpWindow(\'foo5\');">' +
                                        close_button +
                                        "</a><b>SBB digital : Asian language collection (selection)  </b>\n" +
                                        '<br><b>CONTENT:</b> This selection of 197 Chinese titles contains a first step to create OCR fulltexts of historical prints (and manuscripts) in Asian scripts. These 100.000+ pages of text are a trial project and build the basis for further tests which will also include historical Japanese and Korean prints using Chinese characters. The digitization of the images was part of the DFG funded project “SSG 6.25 digital“; the OCR fulltext was produced by Shutongwen 书同文, Unihan. The selection of titles was guided by mainly formal criteria such as page layout and printing style and less by content. The collection of Qing “Regulations and orders [published] by season“ (<a href="https://digital.staatsbibliothek-berlin.de/suche?category%5B0%5D=Ostasiatica&queryString=%22%E5%AD%A3%E6%A2%9D%E4%BE%8B%22&fulltext=&junction=">Siji tiaoli 四季條例</a>, Libri sin. 495-534) covering the years 1752 to 1830 are an exception to this. The whole collection of digitized Asian language titles is accessible via the Digital Collection of the State Library: <a href="https://digital.staatsbibliothek-berlin.de/suche?category=Ostasiatica">https://digital.staatsbibliothek-berlin.de/suche?category=Ostasiatica</a> \n' +
                                        "<br><b>NOTE:</b> : The fulltext is produced by OCR. For the hits we provide links to the book and the individual page display in the Digital Collection of the SBB. The image material is in the public domain. </div>"
                                    )
                                );
                            }
                            if (facet === "Local Gazetteer") {
                                $("#" + "more_collection").append(
                                    $(
                                        '<span></span><a class="click" onclick="show_hidePopUpWindow(\'foo6\');" onmouseover="" style="cursor: pointer;"> ' +
                                        info_button +
                                        "</a>" +
                                        "" +
                                        '<div class="menu" id="foo6" style="display:none"> <a onclick="show_hidePopUpWindow(\'foo6\');">' +
                                        close_button +
                                        "</a><b>Local Gazetters </b>\n" +
                                        "<br><b>CONTENT:</b> This collection currently contains the first two batches of the Erudition database 中國方志庫 of together 3,997 local gazetteer titles with about 4,65 mio. pages. \n" +
                                        "<br><b>NOTE:</b> For the Erudition corpus currently no link to the book title in the database is possible. To see your hit page in the database please call-up the Erudition database (link provided with the title), search for your book (title as given in the hit) and go the image/page given for your hit page.\n</div>"
                                    )
                                );
                            }
                            if (
                                facet ===
                                "Missionary, Sinology, and Literary Periodicals (1817-1949)"
                            ) {
                                $("#" + "more_collection").append(
                                    $(
                                        '<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo7\');" onmouseover="" style="cursor: pointer;"> ' +
                                        info_button +
                                        "</a>" +
                                        "" +
                                        '<div class="menu" id="foo7" style="display:none"> <a onclick="show_hidePopUpWindow(\'foo7\');">' +
                                        close_button +
                                        "</a><b>Missionary, Sinology, and Literary Periodicals (1817-1949) </b>\n" +
                                        "<br><b>CONTENT:</b> The resource contains the main English-language periodicals published in or about China covering the period from 1817 until the founding of the People’s Republic of China in 1949. The journals feature photographs and articles the on the founding and development of Christian higher education in China. \n" +
                                        "<br><b>NOTE:</b> The fulltexts are not split into the actual pages, but contain the whole article. The links provided thus open the article at the start page and the search term may appear only on a later page. To get to the correct page please use the “Search within  Article” to left of the article display in the database. \n</div>"
                                    )
                                );
                            }
                            if (facet === "Local Gazetteer (Diaolong)") {
                                $("#" + "more_collection").append(
                                    $(
                                        '<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo8\');" onmouseover="" style="cursor: pointer;">' +
                                        info_button +
                                        "</a>" +
                                        "" +
                                        '<div class="menu" id="foo8" style="display:none"> <a onclick="show_hidePopUpWindow(\'foo8\');">' +
                                        close_button +
                                        "</a><b>Local Gazetteers (Diaolong) </b>\n" +
                                        "<br><b>CONTENT:</b> Containing 2194 titles in the first and 1935 in the sequel collection this resource of historical local gazetteers covers the period from Song to Republican times grouped into 31 regional areas. The names of these areas and their sub-regions appear as subject/spatial for filtering the search results. \n" +
                                        "<br><b>NOTE:</b> No links to the individual pages in the database are possible. To find your hit page in the database you have to open the title (follow the 'book' link) and then go to the page number given in the page hit. \n</div>"
                                    )
                                );
                            }
                            if (facet === "Qingdai shiliao") {
                                $("#" + "more_collection").append(
                                    $(
                                        '<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo9\');" onmouseover="" style="cursor: pointer;">' +
                                        info_button +
                                        "</a>" +
                                        "" +
                                        '<div class="menu" id="foo9" style="display:none"> <a onclick="show_hidePopUpWindow(\'foo9\');">' +
                                        close_button +
                                        "</a><b>清代史料 </b>\n" +
                                        "<br><b>CONTENT:</b> The collection contains historical sources of the Qing dynasty published by the Qing state. They belong to five types of documents: Veritable Records (實錄), Collected Statutes (會典), Records of Officials (缙绅錄), different editions of  the Guide to the Qing board of war (大清中樞備覽) as well as the Qing Essentials for Governance (大清輔政要覽全書), and  finally materials closely related to the emperor such as the Court Diaries (起居注, currently only Tongzhi 同治). \n" +
                                        "<br><b>NOTE:</b> No links to the individual pages in the database are possible. To find your hit page in the database you have to open the title (follow the 'book' link in the title data) and then go to the page number given in the page hit.\n</div>"
                                    )
                                );
                            }
                            if (facet === "Sibu congkan") {
                                $("#" + "more_collection").append(
                                    $(
                                        '<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo10\');" onmouseover="" style="cursor: pointer;">' +
                                        info_button +
                                        "</a>" +
                                        "" +
                                        '<div class="menu" id="foo10" style="display:none"> <a onclick="show_hidePopUpWindow(\'foo10\');">' +
                                        close_button +
                                        "</a><b>Sibu congkan 四部叢刊 </b>\n" +
                                        "<br><b>CONTENT:</b> The Sibu congkan 四部叢刊 is a collection of 472 (or 504 depending on how to count) photolithography facsimiles of authoritative editions of historical monographs published by the Commercial Press in three series between 1919 and 1936. The titles span Song, Yuan and Ming (and some Qing) dynasty editions and focus on the quality of the original text and its truthful reproduction. Its approach thus differs from the Sibu beiyao (published from 1924 to 1936), which newly typeset and corrected text errors of the original.  \n" +
                                        '<br><b>NOTE:</b> No links to the individual pages in the database are possible. To find your hit page in the database you have to open the title (follow the "book" link in the title data) and then go to the page number given in the page hit or search your term again within the book using the “再查詢” search slot. \n</div>'
                                    )
                                );
                            }
                            if (facet === "SBB digital : Western language Asia collection") {
                                $("#" + "more_collection").append(
                                    $(
                                        '<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo11\');" onmouseover="" style="cursor: pointer;">' +
                                        info_button +
                                        "</a>" +
                                        "" +
                                        '<div class="menu" id="foo11" style="display:none"> <a onclick="show_hidePopUpWindow(\'foo11\');">' +
                                        close_button +
                                        "</a><b>SBB digital : Western language Asia collection </b>\n" +
                                        '<br><b>CONTENT:</b> In the current version the dataset contains the OCR  fulltexts of 4653 titles of the East Asia Collection (Ostasiatica) digitized in the “SSG 6.25 digital“ project funded by the DFG. The titles were selected according to their allocation as materials concerning East and Southeast Asia in the “Alte Realkatalog”  <a href="http://ark.staatsbibliothek-berlin.de">(http://ark.staatsbibliothek-berlin.de)</a>. The material is mainly in Dutch, English, German and French, but does also contain texts in Spanish, Italian, Latin, Russian and Portuguese. \n' +
                                        "<br><b>NOTE:</b> The fulltext is produced by OCR. For the hits we provide links to the book or journal and the individual page display in the Digital Collection of the SBB. The material is in the public domain.\n</div>"
                                    )
                                );
                            }
                            if (facet === "The Chinese Students’ Monthly Online") {
                                $("#" + "more_collection").append(
                                    $(
                                        '<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo12\');" onmouseover="" style="cursor: pointer;">' +
                                        info_button +
                                        "</a>" +
                                        "" +
                                        '<div class="menu" id="foo12" style="display:none"> <a onclick="show_hidePopUpWindow(\'foo12\');">' +
                                        close_button +
                                        "</a><b>The Chinese Students’ Monthly </b>\n" +
                                        "<br><b>CONTENT:</b> Published between 1906 to 1931 - an important turning point in Chinese history - the magazine is the first Chinese students’ magazine published in the United States and evolved into the official organ of the enlarged Chinese student organization. Amongst its contributors are many important and well-known figures such as Hu Shi and Chao Yuanren.   \n" +
                                        "<br><b>NOTE:</b> Search hits provide links to the issue or book; no links to the individual pages in the database are possible. To find the page use “Open reader” for the object and go the respective page (or search again within the object to highlight your find). The full text was done by automated OCR without correcting routines. Wrong identification of characters and layout are frequent.\n</div>"
                                    )
                                );
                            }
                            if (facet === "The North China Herald Online") {
                                $("#" + "more_collection").append(
                                    $(
                                        '<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo13\');" onmouseover="" style="cursor: pointer;">' +
                                        info_button +
                                        "</a>" +
                                        "" +
                                        '<div class="menu" id="foo13" style="display:none"> <a onclick="show_hidePopUpWindow(\'foo13\');">' +
                                        close_button +
                                        "</a><b>North China Herald </b>\n" +
                                        "<br><b>CONTENT:</b> Published in Shanghai on a weekly basis from 1850 to 1940s, the North China Herald counts as the foreign newspaper press in China with the longest history. Despite its main base being Shanghai the newspaper had correspondents across the whole of China and thus contains relevant national and local news on an extensive range of topics, as well as gossip reflecting the life of the foreign settlements. Its daily pendant is the North China Daily News whose history started a bit later but continued after a war time break up until 1951.   \n" +
                                        "<br><b>NOTE:</b> Search hits provide links to the issue or book; no links to the individual pages in the database are possible. To find the page use “Open reader” for the object and go the respective page (or search again within the object to highlight your find). The full text was done by automated OCR without correcting routines. Wrong identification of characters and layout are frequent.\n</div>"
                                    )
                                );
                            }
                            if (facet === "Japan Chronicle Online") {
                                $("#" + "more_collection").append(
                                    $(
                                        '<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo14\');" onmouseover="" style="cursor: pointer;">' +
                                        info_button +
                                        "</a>" +
                                        "" +
                                        '<div class="menu" id="foo14" style="display:none"> <a onclick="show_hidePopUpWindow(\'foo14\');">' +
                                        close_button +
                                        "</a><b>Japan Chronicle Online </b>\n" +
                                        "<br><b>CONTENT:</b> Covering the years 1900 to 1941 the Weekly Edition of the Japan Chronicle (or Kobe Chronicle as it was named in 1900-1901) together with the Daily Edition (1929-1949) and the Commercial Supplement (1915-1941) provide news and opinions on Japan and East Asia and builds a lively complement to the North China Herald. \n" +
                                        "<br><b>NOTE:</b> Search hits provide links to the issue or book; no links to the individual pages in the database are possible. To find the page use “Open reader” for the object and go the respective page (or search again within the object to highlight your find). The full text was done by automated OCR without correcting routines. Wrong identification of characters and layout are frequent.\n</div>"
                                    )
                                );
                            }
                            if (facet === "Daozang jiyao") {
                                $("#" + "more_collection").append(
                                    $(
                                        '<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo15\');" onmouseover="" style="cursor: pointer;">' +
                                        info_button +
                                        "</a>" +
                                        "" +
                                        '<div class="menu" id="foo15" style="display:none"> <a onclick="show_hidePopUpWindow(\'foo15\');">' +
                                        close_button +
                                        "</a><b>道藏輯要 </b>\n" +
                                        '<br><b>CONTENT:</b> The "Essentials of the Daoist Canon" counts as the main collection of Daoist texts after the Daozang. Its bibliographical history is rather complicated and subject to discussion. After a first version of the "Essentials" was compiled around 1700, in the 18th and 19th century several re-editions and addition were made to the set of texts until in 1906 He Longxiang 賀龍驤 and Peng Hanran 彭瀚然 published the 重刊道藏輯要 in Chengdu. The texts of the "Essentials" chiefly derive from Zhengtong Daozang 正統到藏 edition (1445) but it also contains some additional texts or other editions of Zhengtong texts. The 299 texts and scans in this collection are those of the 1906 printed version of the Daozang jiyao. \n' +
                                        "<br><b>NOTE:</b> No links to the individual pages in the database are possible. To find your hit page in the database you have to open the title (follow the 'book' link in the title data) and then go to the page number given in the page hit.\n</div>"
                                    )
                                );
                            }
                            if (facet === "Xuxiu Siku quanshu") {
                                $("#" + "more_collection").append(
                                    $(
                                        '<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo16\');" onmouseover="" style="cursor: pointer;">' +
                                        info_button +
                                        "</a>" +
                                        "" +
                                        '<div class="menu" id="foo16" style="display:none"> <a onclick="show_hidePopUpWindow(\'foo16\');">' +
                                        close_button +
                                        "</a><b>Xuxiu Siku Quanshu 續修四庫全書 </b>\n" +
                                        "<br><b>CONTENT:</b> With over 5000 titles the 'Sequel to the Siku quanshu', continues emperor Qianlong's project of the late 18th century. The Xuxiu Siku quanshu project ran from the 1920ies on aiming to collect titles produced after the finishing of the Siku quanshu collection (SKQS) in 1782, to reproduce editions better and less corrupted than those included in the SKQS, to include novels and other literary styles considered too lowly by the SKQS editors asf. In 1942 the project came to a full stop with over 30 thousand book abstracts written. In 1949 the drafts of these abstracts went into the possession of the library of the Chinese Academy of Science (中科院) in Beijing; finally in 1996 these abstracts were published in 37 volumes under the title 续修四库全书总目提要 (稿本); between 1995 and 2002 facsimiles of over 5213 titles of the Xuxiu SKQS were published in 1800 volumes by Shanghai guji chubanshe. The publishing of a fulltext database of all titles from the Shanghai edition (and 100+ additional titles) can be considered another milestone for everyone working in one or the other way on historical China. \n" +
                                        "<br><b>NOTE:</b> No links to the individual pages in the database are possible. To find your hit page in the database you have to open the title (follow the 'book' link in the title data) and then go to the page number given in the page hit.\n</div>"
                                    )
                                );
                            }
                            if (facet === "Adam Matthew - China America Pacific") {
                                $("#" + "more_collection").append(
                                    $(
                                        '<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo17\');" onmouseover="" style="cursor: pointer;"> ' +
                                        info_button +
                                        "</a>" +
                                        "" +
                                        '<div class="menu" id="foo17" style="display:none"> <a onclick="show_hidePopUpWindow(\'foo17\');">' +
                                        close_button +
                                        "</a><b>Adam Matthew - China America Pacific </b>\n" +
                                        "<br><b>CONTENT:</b> Collection of archival material held by different American institutions and libraries like the American Philosophical Society Library, Boston Athenæum, Bridgeman Art Library, California Historical Society, Hagley Museum and Library, Massachusetts Historical Society, Hawaiian Historical Society etc. It contains material related to the trading and cultural relationships that emerged between China, America and the Pacific region between the 18th and early 20th centuries like manuscript sources, rare printed texts, visual images, objects and maps.\n" +
                                        "<br><b>NOTE:</b> The full text was done by OCR from partly handwritten material, thus the text is often of minor quality. For each hit in the search links to the bibliographical unit and to the individual page are provided.\n" +
                                        "</div>"
                                    )
                                );
                            }
                            if (facet === "Adam Matthew - China Trade & Politics") {
                                $("#" + "more_collection").append(
                                    $(
                                        '<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo18\');" onmouseover="" style="cursor: pointer;"> ' +
                                        info_button +
                                        "</a>" +
                                        "" +
                                        '<div class="menu" id="foo18" style="display:none"> <a onclick="show_hidePopUpWindow(\'foo18\');"> ' +
                                        close_button +
                                        "</a><b>Adam Matthew - China Trade & Politics </b>\n" +
                                        "<br><b>CONTENT:</b> The collection contains a wide variety of sources in English relating to China and the West, 1793-1980, such as maps, color paintings, photographs, papers of key individuals involved in the Chinese Maritime Customs service, records of major diplomatic missions to China ranging from the late 18th to the 20th century (Macartney, Amherst to Nixon), papers of missionaries, as well as the Chinese Recorder and Missionary Journal (1867-1941) and North China Mission resp. North China Shantung Mission quarterly paper (1893-1936).\n" +
                                        "<br><b>NOTE:</b> The full text was done by OCR from partly handwritten material, thus the text is often of minor quality. For each hit in the search links to the bibliographical unit and to the individual page are provided.\n" +
                                        "</div>"
                                    )
                                );
                            }
                            if (facet === "Adam Matthew - Meiji Japan") {
                                $("#" + "more_collection").append(
                                    $('<span id="meiji-japan"> </span><a className="click" id="btn-meiji-japan">' + info_button + '</a>').click(function (e) {
                                        $.ajax({
                                            url: 'collections/meiji-japan.html',
                                            type: 'get',
                                            success: function (data) {
                                                $('#meiji-japan').html(data).toggle();
                                            }
                                        })
                                    })
                                    /*$(
                                        '<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo19\');" onmouseover="" style="cursor: pointer;"> ' +
                                        info_button +
                                        "</a>" +
                                        "" +
                                        '<div class="menu" id="foo19" style="display:none"><a onclick="show_hidePopUpWindow(\'foo19\');"> ' +
                                        close_button +
                                        "</a>" +
                                        "<b>Adam Matthew - Meiji Japan </b>\n" +
                                        "<br><b>CONTENT:</b> The collection contains the diaries and correspondence of Edward S Morse (1838-1925), one of the first Americans to live in Japan for a longer period while teaching science at the Imperial University of Tokyo. A polymath especially interested in the fields natural history, ethnography and art history, he was an accomplished draughtsman and his drawings and sketches enliven his diaries and letters. In addition to preserving the household records of a samurai family and many accounts of the tea ceremony, Morse made notes on subjects as diverse as shop signs, fireworks, hairpins, agricultural tools, artists’ studios, music, games, printing, carpentry, the Ainu, gardens, household construction, art and architecture. His correspondence include exchanges with Alexander and Louis Agassiz, William Sturgis Bigelow, Charles Darwin, Ernest Fenollosa, Yukichi Fukuzawa, Isabella Stewart Gardner, John M Gould, Oliver Wendell Holmes, Ernest Ingersoll, Hiroyuki Kato, Percival Lowell, The Museum of Fine Arts in Boston, Charles Eliot Norton, Frederick Putnam, Hideo Takamine, Seiichi Tejima, Charles Townsend, Charles Weld and Yu Kil-chun.\n" +
                                        "<br><b>NOTE:</b> As all items in this collection are either handwritten or images, none of them has provided fulltext yet. Thus only the metadata can be searched.\n" +
                                        "</div>"
                                    )*/
                                );
                            }
                            if (facet === "CNKI eBooks") {
                                $("#" + "more_collection").append(
                                    $(
                                        '<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo20\');" onmouseover="" style="cursor: pointer;"> ' +
                                        info_button +
                                        "</a>" +
                                        "" +
                                        '<div class="menu" id="foo20" style="display:none"><a onclick="show_hidePopUpWindow(\'foo20\');"> ' +
                                        close_button +
                                        "</a>" +
                                        "<b>CNKI eBooks </b>\n" +
                                        '<br><b>CONTENT:</b> Currently 140 titles of the CNKI Digital Collection on China Studies (中国学术典藏图书库) are included with their full text into the CrossAsia fulltext search. This number will increase yearly with new acquisitions based on the PDA (Patron driven acquisition) model. The complete set of titles can be searched via their database portal <a href="http://erf.sbb.spk-berlin.de/han/cnki-books/">LINK</a> \n' +
                                        "<br><b>NOTE:</b> To see the complete text of a hit page, please follow the link provided next to the fulltext hit. After login the page will open in the database.\n" +
                                        "</div>"
                                    )
                                );
                            }
                            if (facet === "China Comprehensive Gazetteers") {
                                $("#" + "more_collection").append(
                                    $(
                                        '<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo21\');" onmouseover="" style="cursor: pointer;"> ' +
                                        info_button +
                                        "</a>" +
                                        "" +
                                        '<div class="menu" id="foo21" style="display:none"><a onclick="show_hidePopUpWindow(\'foo21\');"> ' +
                                        close_button +
                                        "</a>" +
                                        "<b>China Comprehensive Gazetteers : 中國綜合方誌庫 </b>\n" +
                                        "<br><b>CONTENT:</b> The collection contains about 6600 digitized local gazetteer titles, mainly from the holdings of the National Library of China. Currently 3017 of the titles are also available in fulltext.  \n" +
                                        "<br><b>NOTE:</b> The book can be accessed using the link provided. There is no direct link to the page. Some title searchable in fulltext here, do not have the fulltext included in the database platform yet, meaning you find more hits in the CrossAsia fulltext search than currently in the database itself.\n" +
                                        "</div>"
                                    )
                                );
                            }
                            if (facet === "Fulltext search in print books") {
                                $("#" + "more_collection").append(
                                    $(
                                        '<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo22\');" onmouseover="" style="cursor: pointer;"> ' +
                                        info_button +
                                        "</a>" +
                                        "" +
                                        '<div class="menu" id="foo22" style="display:none"><a onclick="show_hidePopUpWindow(\'foo22\');"> ' +
                                        close_button +
                                        "</a>" +
                                        "<b>Fulltext search in print books </b>\n" +
                                        "<br><b>CONTENT:</b> CrossAsia is working on bridging the gap between printed materials in our stacks and electronic full text searches. Matching our collection with Duxiu fulltexts and allowing users to search in Duxiu fulltexts to find and borrow items from our printed collection is one way. The other way is producing our own fulltexts from printed books and offer them in our fulltext search. As a test case this collection includes 15 titles prepared in this way. \n" +
                                        '<br><b>NOTE:</b> To see your full hit page you have to borrow the book (via the link to our OPAC provided with the title) and find the correct page. Please note that the "page number" given for your search hit is the "image number", so you have to add a certain number to find the correct printed page. But the idea is to help you find books of interest for your research of general interest.\n' +
                                        "</div>"
                                    )
                                );
                            }
                            if (facet === "Zhengtong Daozang") {
                                $("#" + "more_collection").append(
                                    $(
                                        '<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo23\');" onmouseover="" style="cursor: pointer;"> ' +
                                        info_button +
                                        "</a>" +
                                        "" +
                                        '<div class="menu" id="foo23" style="display:none"><a onclick="show_hidePopUpWindow(\'foo23\');"> ' +
                                        close_button +
                                        "</a>" +
                                        "<b>Zhengtong Daozang 正統道藏 (Xu Daozang 續道藏) </b>\n" +
                                        '<br><b>CONTENT:</b> The "Daoist Canon of the Zhengtong Reign-Period" (Zhengtong daozang 正統道藏) assembles about 1400 Daoist texts on a broad range of Daoist interests, ranging from meditation, ritual and exorcism, to medicine, astronomy, and philosophy. Many texts have only survived because of their inclusion into the Daozang. With the first version of a Daoist canon (copying the idea from the Buddhist Canon) in the early 5th century, the main corpus was finalized and printed in the Zhengtong reign in 1445. In 1607 the Wanli emperor of the Ming dynasty sponsored a "Sequel to the Daozang" (Xu Daozang 續道藏) which is also included in this electronic version. \n' +
                                        '<br><b>NOTE:</b> : No links to the individual pages in the database are possible. To find your hit page in the database you have to open the title (follow the "book" link) and then go to the page number given in the page hit. \n' +
                                        "</div>"
                                    )
                                );
                            }
                            if (facet === "Classical Works of Japan") {
                                $("#" + "more_collection").append(
                                    $(
                                        '<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo24\');" onmouseover="" style="cursor: pointer;"> ' +
                                        info_button +
                                        "</a>" +
                                        "" +
                                        '<div class="menu" id="foo24" style="display:none"><a onclick="show_hidePopUpWindow(\'foo24\');"> ' +
                                        close_button +
                                        "</a>" +
                                        "<b>日本古典書籍 : Classical  Works of Japan </b>\n" +
                                        "<br><b>CONTENT:</b> The collection contains a selection of important historical and literary compilations, as well as the encyclopedia  Koji ruien 古事類苑 (compiled between 1896 and 1914) and two dictionaries, namely the Wamyô ruijushô 倭名類聚抄 of the 10th and the Shinsen jikyô 新撰字鏡 of the late 9th century. The historical collections included are the collection of historical resources Kokushi taikei 国史大系 with its sequel (both compiled between 1897 and 1904) and the Rikkokushi  六国史,the six national histories of Japan; the literary collections consist of the Honchô monzui 本朝文粹  presenting Chinese prose and poetry for a Japanese audience compiled in the 11th century and of various collections with Japanese poems in Chinese style covering the period from 7th to the 20th centuries (segment called: Nihon kanshi 日本漢詩). \n" +
                                        "<br><b>NOTE:</b> No links to the individual pages in the database are possible. To find your hit page in the database you have to open the title (follow the 'book' link in the title data) and then go to the page number given in the page hit. \n" +
                                        "</div>"
                                    )
                                );
                            }
                            if (facet === "Siku quanshu") {
                                $("#" + "more_collection").append(
                                    $(
                                        '<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo25\');" onmouseover="" style="cursor: pointer;"> ' +
                                        info_button +
                                        "</a>" +
                                        "" +
                                        '<div class="menu" id="foo25" style="display:none"><a onclick="show_hidePopUpWindow(\'foo25\');"> ' +
                                        close_button +
                                        "</a>" +
                                        "<b>Siku quanshu 四庫全書 </b>\n" +
                                        "<br><b>CONTENT:</b> This famous collecting and editing project of the Qianlong emperor (reg. 1735-1796/1799) contains 3540 titles. The books in this project all went through an editing and “correcting” process by the Qing compilation team and seven neat manuscript copies were produced to be displayed at different locations of the empire. The one digitized here is the Wenyuan pavilion 文淵閣 today housed at the Taiwan Palace Museum. \n" +
                                        "<br><b>NOTE:</b> No links to the individual pages in the database are possible. To find your hit page in the database you have to open the title (follow the 'book' link in the title data) and then go to the page number given in the page hit. \n" +
                                        "</div>"
                                    )
                                );
                            }
                            if (facet === "Yongle dadian") {
                                $("#" + "more_collection").append(
                                    $(
                                        '<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo26\');" onmouseover="" style="cursor: pointer;"> ' +
                                        info_button +
                                        "</a>" +
                                        "" +
                                        '<div class="menu" id="foo26" style="display:none"><a onclick="show_hidePopUpWindow(\'foo26\');"> ' +
                                        close_button +
                                        "</a>" +
                                        "<b>Yongle dadian 永樂大典 </b>\n" +
                                        "<br><b>CONTENT:</b> The Yongle dadian (Great Canon of the Yongle Reign) used to be the largest encyclopaedia of pre-modern China. Finished in 1408 it comprised of 22,937 juan in almost 12,000 volumes arranged according to rhyme. Already in the late Ming the compilation began to get dispersed or destroyed. Today only about 3% of the original are extent. But it is still highly valued because many older titles from a broad range of Chinese literature have only survived as excerpts in the Yongle dadian. \n" +
                                        "<br><b>NOTE:</b> No links to the individual pages in the database are possible. To find your hit page in the database you have to open the title (follow the 'book' link in the title data) and then go to the page number given in the page hit. \n" +
                                        "</div>"
                                    )
                                );
                            }
                            if (
                                facet ===
                                "China and the Modern World: Records of the Maritime Customs Service of China (1854-1949)"
                            ) {
                                $("#" + "more_collection").append(
                                    $(
                                        '<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo27\');" onmouseover="" style="cursor: pointer;"> ' +
                                        info_button +
                                        "</a>" +
                                        "" +
                                        '<div class="menu" id="foo27" style="display:none"><a onclick="show_hidePopUpWindow(\'foo27\');"> ' +
                                        close_button +
                                        "</a>" +
                                        "<b>Records of the Maritime Customs Service of China (1854-1949) </b>\n" +
                                        "<br><b>CONTENT:</b> The resource contains official correspondence, despatches, reports, memoranda, as well as private and confidential  letter of the Maritime Customs Service of China, an international, although predominantly British-staffed bureaucracy (at senior levels) under the control of successive Chinese central governments from its founding in 1854 until January 1950. With 720 documents and almost 300.000 pages it provides evidence Chinese life, the economy and politics of of late Qing and Republican times until the founding of the People’s Republic of China in 1949. \n" +
                                        "<br><b>NOTE:</b> The documents are scanned from microfilm and the fulltext derives from uncleaned OCR. As many documents are handwritten the text quality thus often inferior. The link provided for the individual text pages lead to the corresponding scan unfortunately without the document’s context. \n" +
                                        "</div>"
                                    )
                                );
                            }
                            if (facet === "Beschreibung") {
                                $("#" + "more_collection").append(
                                    $(
                                        '<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo28\');" onmouseover="" style="cursor: pointer;"> ' +
                                        info_button +
                                        "</a>" +
                                        "" +
                                        '<div class="menu" id="foo28" style="display:none"><a onclick="show_hidePopUpWindow(\'foo28\');"> ' +
                                        close_button +
                                        "</a>" +
                                        "<b>CrossAsia Fulltext Search (Beta version, type B)</b><br>\n" +
                                        '<br> In this second version of the CrossAsia Fulltext Search metadata and fulltexts are searched at the same time. You can use the filter "Type of Object" to reduce your result set or presetting your search to the contents of the "Pages" or the metadata of the "Books" or "Chapters" or to the content - and metadata - of "Articles".' +
                                        "<br>The list of resources included in this search can be viewed from the list of filters directly underneath the search slot" +
                                        "\n" +
                                        "<br><br><b>FEATURES:</b>" +
                                        "<br>- searching metadata and fulltext at the same time" +
                                        '<br>- ranking of search hits by Solr score (note: be aware that if you do not enclose your search term in "" texts with a high frequency of one word/character of your search term will score higher than those where your two search words/characters appear next to each other)' +
                                        "<br>- for each hit two types of link are provided: one - in red - for authenticated CrossAsia users, another one - in grey - for all other users who will then need to enter their individual authorization or access the ressource from within a subscriber's IP range. Please note that not all databases provide links to directly call-up a specific page of a ressource, some even do not have direct links to an item in their database (for example Erudition Local Gazetteers or Renmin ribao).\n" +
                                        "<br>" +
                                        '<br>For feedback, questions etc. please contact: <a href="mailto:x-asia@sbb.spk-berlin.de">x-asia@sbb.spk-berlin.de</a>' +
                                        "</div>"
                                    )
                                );
                            }
                            if (facet === "Gujin tushu jicheng") {
                                $("#" + "more_collection").append(
                                    $(
                                        '<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo29\');" onmouseover="" style="cursor: pointer;"> ' +
                                        info_button +
                                        "</a>" +
                                        "" +
                                        '<div class="menu" id="foo29" style="display:none"><a onclick="show_hidePopUpWindow(\'foo29\');"> ' +
                                        close_button +
                                        "</a>" +
                                        "<b>Qing Imperial Encyclopedia (Gujin tushu jicheng) \n" +
                                        "古今圖書集成\n </b>" +
                                        "<br><b>CONTENT:</b> With 6,117 topical sections on over 800,000 pages, the Gujin tushu jicheng 古今圖書集成 is the largest still extent encyclopedic compilation of Chinese history. Started by Chen Menglei 陳夢雷under the imperial order of the Kangxi emperor 康熙 (r. 1661-1722) between 1701 und 1706 it was published and printed with moveable copper type in 1726 under the supervision of Jiang Tingxi 蔣廷錫.Each section assembles excerpts from a great variety of sources from early writings up to the 17th century.\n" +
                                        "<br><b>NOTE:</b> No links to the individual pages in the database are possible. To find your hit page in the database you have to click the 'book' link that will open the respective section and then go to the page number given in the page hit.\n" +
                                        "</div>"
                                    )
                                );
                            }
                            if (facet === "Sibu beiyao") {
                                $("#" + "more_collection").append(
                                    $(
                                        '<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo30\');" onmouseover="" style="cursor: pointer;"> ' +
                                        info_button +
                                        "</a>" +
                                        "" +
                                        '<div class="menu" id="foo30" style="display:none"><a onclick="show_hidePopUpWindow(\'foo30\');"> ' +
                                        close_button +
                                        "</a>" +
                                        "<b>Sibu beiyao 四部備要 \n" +
                                        " </b>" +
                                        '<br><b>CONTENT:</b> The Sibu beiyao 四部備要 ("Essentials of the Four Branches of Literature"), published between 1924 and 1931 by Zhonghua shuju, assembles 364 titles (or 336 depending on how to count) of Chinese literary tradition of all “four branches”, i.e. classics and their commentaries, history, monographs, literature collections. The Sibu beiyao focusses on commented and annotated versions of the works selected that were then edited and newly printed with the aim to provide scholars with “better” versions of texts. \n' +
                                        "The Diaolong portal includes the corpora under the title Xu Sibu congkan 續四部叢刊 (“Sequel to the Sibu congkan”). The Sibu congkan is a competing collection published slightly earlier by Commercial Press (also included in the Diaolong portal).\n" +
                                        "<br><b>NOTE:</b> No links to the individual pages in the database are possible. To find your hit page in the database you have to open the title (follow the 'book' link in the title data) and then go to the page number given in the page hit.\n" +
                                        "</div>"
                                    )
                                );
                            }
                            if (facet === "The Ta Kung Pao 大公報") {
                                $("#" + "more_collection").append(
                                    $(
                                        '<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo31\');" onmouseover="" style="cursor: pointer;"> ' +
                                        info_button +
                                        "</a>" +
                                        "" +
                                        '<div class="menu" id="foo31" style="display:none"><a onclick="show_hidePopUpWindow(\'foo31\');"> ' +
                                        close_button +
                                        "</a>" +
                                        "<b>Ta Kung Pao 大公報 (1902-1949) \n" +
                                        " </b>" +
                                        "<br><b>CONTENT:</b> The Ta Kung Pao 大公報 (in its early times also known as L'Impartial) started as an independent, government critical newspaper in Tianjin in June 1902. In the wake of the Second Sino-Japanese War newspaper staff fled to Shanghai, Hankou (Wuhan), Chongqing, Guilin and Hongkong starting regional editions of the Ta Kung Pao. From 1949 on it developed into a state-owned, pro-Beijing newspaper under the Hong Kong Liaison Office. The full text contains the main and local editions up to 1949. \n" +
                                        '<br><b>NOTE:</b> The link provided with each article opens a page listing all articles that appeared on the same page together with this article. In the database the "page" icon (lilac) opens the full text of the article, the "scissor" icon (red) displays an image cut-out of the article, the PDF icon (green) opens the complete issue.\n' +
                                        "</div>"
                                    )
                                );
                            }
                            if (facet === "North China Daily News") {
                                $("#" + "more_collection").append(
                                    $(
                                        '<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo32\');" onmouseover="" style="cursor: pointer;"> ' +
                                        info_button +
                                        "</a>" +
                                        "" +
                                        '<div class="menu" id="foo32" style="display:none"><a onclick="show_hidePopUpWindow(\'foo32\');"> ' +
                                        close_button +
                                        "</a>" +
                                        "<b>North China Daily News (1864-1941/1946-1950)</b> \n" +
                                        "<br><b>CONTENT:</b> The North China Daily News is a pendant to the North China Herald of the same publishing house in Shanghai. It commenced publication in 1864, 14 years after the start of the Herald, and restarted publication after a wartime break between December 1941 and January 1945 while the Herald was not continued. The Daily News appeared until March 1951. Not all issues have been available to Brill to be included in this resource. But the collection contains in addition a number of unique sources by the same publishing house: the North-China Sunday News Magazine, Sunday Magazine Supplements and Special Supplements, a significant collection of the weekly Municipal Gazette (the organ of the Shanghai Municipal Council from 1908-1940), and a selection of 30 rare books from the imprint of the North-China Daily News and its parent, the North-China Herald.\n" +
                                        "<br><b>NOTE:</b> Links to the issue or book are provided with the search hits; no links to the individual pages in the database are possible. To find the page use “Open reader” for the object and go the respective page (or search again within the object to highlight your find). The full text was done by automated OCR without correcting routines. Wrong identification of characters and layout are frequent.\n" +
                                        "</div>"
                                    )
                                );
                            }
                            if (facet === "North China Standard Online") {
                                $("#" + "more_collection").append(
                                    $(
                                        '<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo33\');" onmouseover="" style="cursor: pointer;"> ' +
                                        info_button +
                                        "</a>" +
                                        "" +
                                        '<div class="menu" id="foo33" style="display:none"><a onclick="show_hidePopUpWindow(\'foo33\');"> ' +
                                        close_button +
                                        "</a>" +
                                        "<b>North China Standard Online (1919-1927) </b>\n" +
                                        '<br><b>CONTENT:</b> Founded in late 1919, the North China Standard started as a semi-official organ of the Japanese Ministry of Foreign Affairs. In the highly competitive English-language news market, it aimed at counteracting negative opinions against the Japanese, but gives proof of "real" journalist\'s research of "real" news. Being mainly distributed in Tianjin and Beijing it enjoyed a wide readership in China and Japan. It ceased publication in 1930; the database covers the years 1919 to 1927 using the holdings of the Waseda University and a private collection as its basis.\n' +
                                        "<br><b>NOTE:</b> The fulltext was produced with OCR with only minor layout recognition. The texts are thus partly jumbled with numerous wrongly identified characters. No direct links to the image page are possible. Please follow the provided link to then open the issue in the Brill reader and jump to the page number given in the hit or search the term again within the issue.\n" +
                                        "</div>"
                                    )
                                );
                            }
                            if (facet === "Mobilizing East Asia, 1931-1954") {
                                $("#" + "more_collection").append(
                                    $(
                                        '<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo34\');" onmouseover="" style="cursor: pointer;"> ' +
                                        info_button +
                                        "</a>" +
                                        "" +
                                        '<div class="menu" id="foo34" style="display:none"><a onclick="show_hidePopUpWindow(\'foo34\');"> ' +
                                        close_button +
                                        "</a>" +
                                        "<b>Mobilizing East Asia (1931-1954) </b><br>\n" +
                                        "<br><b>CONTENT:</b> The Collection offers access to extremely rare, many times even unique English-language newspapers, magazines and pamphlets published inside Asia, following the descent into war in East and South-East Asia from the turn of the twentieth century to the 1950s. Included are several Manchuria and Japan newspapers and selection of 20 book titles related to the period and area.\n" +
                                        "<br><b>NOTE:</b> Links to the issue or book are provided with the search hits; no links to the individual pages in the database are possible. To find the page use “Open reader” for the object and go the respective page (or search again within the object to highlight your find). The full text was done by automated OCR without correcting routines. Wrong identification of characters and layout are frequent. \n" +
                                        "</div>"
                                    )
                                );
                            }
                            if (facet === "Dunhuang Historical Material") {
                                $("#" + "more_collection").append(
                                    $(
                                        '<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo35\');" onmouseover="" style="cursor: pointer;"> ' +
                                        info_button +
                                        "</a>" +
                                        "" +
                                        '<div class="menu" id="foo35" style="display:none"><a onclick="show_hidePopUpWindow(\'foo35\');"> ' +
                                        close_button +
                                        "</a>" +
                                        "<b>Dunhuang Historical Material 敦煌史料 </b><br>\n" +
                                        "<br><b>CONTENT:</b> The collection assembles the holdings of Dunhuang material from the Beijing National Library (北图), the Beijing University Library (北大藏), the Dunhuang Museum and Research Institute (敦博 ， 敦研) and other Chinese libraries such as the Tianjin Art Museum (天津艺术博物馆) as well as materials now in England, France and Russia. The content is (of course!) not complete, but provides a sound corpus of Dunhuang materials concerning religion, economy, law, language, literature, science and technology, art and customs written between the 4th and 11th  century.\n" +
                                        "<br><b>NOTE:</b> No links to the individual pages in the database are possible. To find your hit page in the database you have to open the title (follow the 'book' link) and then go to the page number given in the page hit. \n" +
                                        "</div>"
                                    )
                                );
                            }
                            if (facet === "Area Studies Japan, China, and Southeast Asia") {
                                $("#" + "more_collection").append(
                                    $(
                                        '<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo36\');" onmouseover="" style="cursor: pointer;"> ' +
                                        info_button +
                                        "</a>" +
                                        "" +
                                        '<div class="menu" id="foo36" style="display:none"><a onclick="show_hidePopUpWindow(\'foo36\');"> ' +
                                        close_button +
                                        "</a>" +
                                        "<b>Adam Matthew - Area Studies Japan, China, and Southeast Asia </b><br>\n" +
                                        "<br><b>CONTENT:</b> The Area Studies resources on Japan and on China and Southeast Asia assemble a varied array of records of traders, travellers, missionaries and diplomats, from the mid-seventeenth century to the late twentieth century, offering Western perspectives on these regions. The China and Southeast Asia related part consists of the sub-series \"China through Western Eyes\", \"China Inland Mission 1865-1951\", and two series with resources on \"Asian Economic History\" concerning the opium trade and UN commission on drugs and narcotics (1945-1948) and the economic development in Brunei, Hong Kong, Malaysia, Singapore, South Korea and Taiwan, 1950-1980. The Japan related part contains sub-series on \"Japan through Western Eyes\", \"East Meets West\" with printed and manuscript material relating to Western visitors to Japan, as well as the two periodicals \"Anglo-Japanese Gazette (1902-1909)\" and \"The Eastern World (1899-1908)\".\n" +
                                        "<br><b>NOTE:</b> The full text was done by OCR from partly handwritten material, thus the text is often of minor quality. For each hit in the search, links to the bibliographical unit and to the individual page are provided. \n" +
                                        "</div>"
                                    )
                                );
                            }
                            if (facet === "Asian Studies (ISEAS publishing)") {
                                $("#" + "more_collection").append(
                                    $(
                                        '<span> </span> <a class="click" onclick="show_hidePopUpWindow(\'foo37\');" onmouseover="" style="cursor: pointer;"> ' +
                                        info_button +
                                        "</a>" +
                                        "" +
                                        '<div class="menu" id="foo37" style="display:none"><a onclick="show_hidePopUpWindow(\'foo37\');"> ' +
                                        close_button +
                                        "</a>" +
                                        "<b>Asian Studies (ISEAS publishing) </b><br>\n" +
                                        "<br><b>CONTENT:</b> The Singapore-based ISEAS - Yusof Ishak Institute is one of Southeast Asia's leading research centers and publisher of academic books and journals focusing on politics, economics, social issues and trends in social development in Southeast Asia and the Asia-Pacific region. The Asian Studies collection stored in the CrossAsia ITR currently contains 784 titles and is updated on a yearly basis. \n" +
                                        "<br><b>NOTE:</b> No direct links to the pages are possible. Link to the books open a landing page with the title’s metadata as well as a link to download the PDF or open the book in an online reader (both only available for CrossAsia authenticated users). \n" +
                                        "</div>"
                                    )
                                );
                            }
                        }
                        if (this.field != "title_facet") {
                            $("#" + show_more_div_id).append(
                                $(
                                    '<span class="text_facet" style="padding-left: 2px; font-size: small;"></span>'
                                ).text(facet)
                            );
                        }
                        $("#" + show_more_div_id).append(
                            $('<span id="number" style="font-size: x-small"></span>').text(
                                " (" + cur_facet_count + ")"
                            )
                        );
                    }
                    if (cur_facet_count != 0) {
                        $("#" + show_more_div_id).append($("<br>"));
                    }
                    num_hidden++;
                }
            }
            var ac_id = this.field + "_all_extra";
            var returned_facets2 = returned_facets;
            var count2 = ac_id[facet];
            var count3 = returned_facets2[facet];
            if (Object.values(returned_facets).length > 10) {
                //var more_or_less_txt = (this.display_style == 'none') ? '+more('+(facet_num)+')' : '-less'+'('+facet_num+')';
                var more_or_less_txt =
                    this.display_style == "none" ?
                        "+more" :
                        "-less" + "(" + facet_num + ")";
                /*if  (this.field==='collection'){
                        }*/
                $(this.target).append(
                    '<a id="' +
                    show_more_div_id +
                    '_txt" href="#">' +
                    more_or_less_txt +
                    "</a>"
                );
                $("#" + show_more_div_id + "_txt").click(
                    this.toggleExtra(show_more_div_id)
                );
            } else {
            }
            if (Object.values(returned_facets).length < 10) {
                var more_or_less_txt = this.display_style == "none" ? "" : "";
                $(this.target).append(
                    '<a id="' +
                    show_more_div_id +
                    '_txt" href="#">' +
                    more_or_less_txt +
                    "</a>"
                );
                $("#" + show_more_div_id + "_txt").click(
                    this.toggleExtra(show_more_div_id)
                );
            }
            $("#" + ac_id).autocomplete({
                source: this.autocompleteAjaxFunction(),
                minLength: 1,
                appendTo: this.target,
                select: this.autocompleteSelect(),
            });
        },
    });
})(jQuery);