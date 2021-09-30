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
                            $(this.target).append($('<button class="click" id="btn-rmrb" style="cursor: pointer;">' +
                                info_button +
                                '</button> <span id="rmrb"></span>'));

                            $('#btn-rmrb').click(function (e) {
                                $.ajax({
                                    url: 'collections/rmrb.html',
                                    type: 'get',
                                    success: function  (data) {
                                        $('#rmrb').html(data);
                                        $('#rmrb').css("display","inline");
                                    }
                                })
                            });
                        }
                        if (facet === "Airiti") {
                            $(this.target).append($('<button class="click" id="btn-airiti" style="cursor: pointer;">' +
                                info_button +
                                '</button> <span id="airiti"></span>'));

                            $('#btn-airiti').click(function (e) {
                                $.ajax({
                                    url: 'collections/airiti.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#airiti').html(data);
                                        //$('#airiti').css("display","inline");
                                    }
                                })
                            });
                        }
                        if (facet === "Adam Matthew - Foreign Office Files China & Japan") {
                            $(this.target).append($('<button class="click" id="btn-adammatthew" style="cursor: pointer;">' +
                                info_button +
                                '</button> <span id="adammatthew"></span>'));

                            $('#btn-adammatthew').click(function (e) {
                                $.ajax({
                                    url: 'collections/adammatthew.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#adammatthew').html(data);
                                    }
                                })
                            });
                        }
                        if (facet === "Early Twentieth Century Chinese Books (1912-1949)") {
                            $(this.target).append($('<button class="click" id="btn-minguo" style="cursor: pointer;">' +
                                info_button +
                                '</button> <span id="minguo"></span>'));

                            $('#btn-minguo').click(function (e) {
                                $.ajax({
                                    url: 'collections/minguo.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#minguo').html(data);
                                    }
                                })
                            });
                        }
                        if (facet === "SBB digital : Asian language collection (selection)") {
                            $(this.target).append($('<button class="click" id="btn-sbb-digital" style="cursor: pointer;">' +
                                info_button +
                                '</button> <span id="sbb-digital"></span>'));

                            $('#btn-sbb-digital').click(function (e) {
                                $.ajax({
                                    url: 'collections/sbb-digital.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#sbb-digital').html(data);
                                    }
                                })
                            });
                        }
                        if (facet === "Local Gazetteer") {
                            $(this.target).append($('<button class="click" id="btn-locgaz" style="cursor: pointer;">' +
                                info_button +
                                '</button> <span id="locgaz"></span>'));

                            $('#btn-locgaz').click(function (e) {
                                $.ajax({
                                    url: 'collections/locgaz.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#locgaz').html(data);
                                    }
                                })
                            });
                        }
                        if (facet === "Missionary, Sinology, and Literary Periodicals (1817-1949)") {
                            $(this.target).append($('<button class="click" id="btn-gale-cfer" style="cursor: pointer;">' +
                                info_button +
                                '</button> <span id="gale-cfer"></span>'));

                            $('#btn-gale-cfer').click(function (e) {
                                $.ajax({
                                    url: 'collections/gale-cfer.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#gale-cfer').html(data);
                                    }
                                })
                            });
                        }
                        if (facet === "Local Gazetteer (Diaolong)") {

                            $(this.target).append($('<button class="click" id="btn-dfz" style="cursor: pointer;">' +
                                info_button +
                                '</button> <span id="dfz"></span>'));

                            $('#btn-dfz').click(function (e) {
                                $.ajax({
                                    url: 'collections/dfz.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#dfz').html(data);
                                    }
                                })
                            });
                        }
                        if (facet === "Qingdai shiliao") {
                            $(this.target).append($('<button class="click" id="btn-dl-shiliao" style="cursor: pointer;">' +
                                info_button +
                                '</button> <span id="dl-shiliao"></span>'));

                            $('#btn-dl-shiliao').click(function (e) {
                                $.ajax({
                                    url: 'collections/dl-shiliao.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#dl-shiliao').html(data);
                                    }
                                })
                            });
                        }
                        if (facet === "Sibu congkan") {
                            $(this.target).append($('<button class="click" id="btn-sbck" style="cursor: pointer;">' +
                                info_button +
                                '</button> <span id="sbck"></span>'));

                            $('#btn-sbck').click(function (e) {
                                $.ajax({
                                    url: 'collections/sbck.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#sbck').html(data);
                                    }
                                })
                            });
                        }
                        if (facet === "SBB digital : Western language Asia collection") {
                            $(this.target).append($('<button class="click" id="btn-sbb-digital" style="cursor: pointer;">' +
                                info_button +
                                '</button> <span id="sbb-digital"></span>'));

                            $('#btn-sbb-digital').click(function (e) {
                                $.ajax({
                                    url: 'collections/sbb-digital.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#sbb-digital').html(data);
                                    }
                                })
                            });
                        }
                        if (facet === "The Chinese Students’ Monthly Online") {
                            $(this.target).append($('<button class="click" id="btn-brill-csmo" style="cursor: pointer;">' +
                                info_button +
                                '</button> <span id="brill-csmo"></span>'));

                            $('#btn-brill-csmo').click(function (e) {
                                $.ajax({
                                    url: 'collections/brill-csmo.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#brill-csmo').html(data);
                                    }
                                })
                            });
                        }
                        if (facet === "The North China Herald Online") {
                            $(this.target).append($('<button class="click" id="btn-brill-ncho" style="cursor: pointer;">' +
                                info_button +
                                '</button> <span id="brill-ncho"></span>'));

                            $('#btn-brill-ncho').click(function (e) {
                                $.ajax({
                                    url: 'collections/brill-ncho.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#brill-ncho').html(data);
                                    }
                                })
                            });
                        }
                        if (facet === "Japan Chronicle Online") {
                            $(this.target).append($('<button class="click" id="btn-brill-jpco" style="cursor: pointer;">' +
                                info_button +
                                '</button> <span id="brill-jpco"></span>'));

                            $('#btn-brill-jpco').click(function (e) {
                                $.ajax({
                                    url: 'collections/brill-jpco.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#brill-jpco').html(data);
                                    }
                                })
                            });
                        }
                        if (facet === "Daozang jiyao") {
                            $(this.target).append($('<button class="click" id="btn-dl-jiyao" style="cursor: pointer;">' +
                                info_button +
                                '</button> <span id="dl-jiyao"></span>'));

                            $('#btn-dl-jiyao').click(function (e) {
                                $.ajax({
                                    url: 'collections/dl-jiyao.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#dl-jiyao').html(data);
                                    }
                                })
                            });
                        }
                        if (facet === "Xuxiu Siku quanshu") {
                            $(this.target).append($('<button class="click" id="btn-xuxiu" style="cursor: pointer;">' +
                                info_button +
                                '</button> <span id="xuxiu"></span>'));

                            $('#btn-xuxiu').click(function (e) {
                                $.ajax({
                                    url: 'collections/xuxiu.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#xuxiu').html(data);
                                    }
                                })
                            });
                        }
                        if (facet === "Adam Matthew - China America Pacific") {
                            $(this.target).append($('<button class="click" id="btn-china-pacific" style="cursor: pointer;">' +
                                info_button +
                                '</button> <span id="china-pacific"></span>'));

                            $('#btn-china-pacific').click(function (e) {
                                $.ajax({
                                    url: 'collections/china-pacific.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#china-pacific').html(data);
                                    }
                                })
                            });
                        }
                        if (facet === "Adam Matthew - China Trade & Politics") {
                            $(this.target).append($('<button class="click" id="btn-china-trade" style="cursor: pointer;">' +
                                info_button +
                                '</button> <span id="china-trade"></span>'));
                            $('#btn-china-trade').click(function (e) {
                                $.ajax({
                                    url: 'collections/china-trade.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#china-trade').html(data);
                                    }
                                })
                            });
                        }
                        if (facet === "Adam Matthew - Meiji Japan") {
                            $(this.target).append($('<button class="click" id="btn-meiji-japan" style="cursor: pointer;">' +
                                info_button +
                                '</button> <span id="meiji-japan"></span>'));

                            $('#btn-meiji-japan').click(function (e) {
                                $.ajax({
                                    url: 'collections/meiji-japan.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#meiji-japan').html(data);
                                    }
                                })
                            });
                        }
                        if (facet === "CNKI eBooks") {
                            $(this.target).append($('<button class="click" id="btn-cnki" style="cursor: pointer;">' +
                                info_button +
                                '</button> <span id="cnki"></span>'));

                            $('#btn-cnki').click(function (e) {
                                $.ajax({
                                    url: 'collections/cnki.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#cnki').html(data);
                                    }
                                })
                            });
                        }
                        if (facet === "China Comprehensive Gazetteers") {
                            $(this.target).append($('<button class="click" id="btn-eastview-ccg" style="cursor: pointer;">' +
                                info_button +
                                '</button> <span id="eastview-ccg"></span>'));

                            $('#btn-eastview-ccg').click(function (e) {
                                $.ajax({
                                    url: 'collections/eastview-ccg.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#eastview-ccg').html(data);
                                    }
                                })
                            });
                        }
                        if (facet === "Fulltext search in print books") {
                            $(this.target).append($('<button class="click" id="btn-cibtc" style="cursor: pointer;">' +
                                info_button +
                                '</button> <span id="cibtc"></span>'));

                            $('#btn-cibtc').click(function (e) {
                                $.ajax({
                                    url: 'collections/cibtc.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#cibtc').html(data);
                                    }
                                })
                            });
                        }
                        if (facet === "Zhengtong Daozang") {
                            $(this.target).append($('<button class="click" id="btn-daozang" style="cursor: pointer;">' +
                                info_button +
                                '</button> <span id="daozang"></span>'));

                            $('#btn-daozang').click(function (e) {
                                $.ajax({
                                    url: 'collections/daozang.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#daozang').html(data);
                                    }
                                })
                            });
                        }
                        if (facet === "Classical Works of Japan") {
                            $(this.target).append($('<button class="click" id="btn-riben" style="cursor: pointer;">' +
                                info_button +
                                '</button> <span id="riben"></span>'));

                            $('#btn-riben').click(function (e) {
                                $.ajax({
                                    url: 'collections/riben.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#riben').html(data);
                                    }
                                })
                            });
                        }
                        if (facet === "Siku quanshu") {
                            $(this.target).append($('<button class="click" id="btn-siku" style="cursor: pointer;">' +
                                info_button +
                                '</button> <span id="siku"></span>'));

                            $('#btn-siku').click(function (e) {
                                $.ajax({
                                    url: 'collections/siku.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#siku').html(data);
                                    }
                                })
                            });
                        }
                        if (facet === "Yongle dadian") {
                            $(this.target).append($('<button class="click" id="btn-dl-yldd" style="cursor: pointer;">' +
                                info_button +
                                '</button> <span id="dl-yldd"></span>'));

                            $('#btn-dl-yldd').click(function (e) {
                                $.ajax({
                                    url: 'collections/dl-yldd.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#dl-yldd').html(data);
                                    }
                                })
                            });
                        }
                        if (facet === "China and the Modern World: Records of the Maritime Customs Service of China (1854-1949)") {
                            $(this.target).append($('<button class="click" id="btn-gale-cfer2" style="cursor: pointer;">' +
                                info_button +
                                '</button> <span id="gale-cfer2"></span>'));

                            $('#btn-gale-cfer2').click(function (e) {
                                $.ajax({
                                    url: 'collections/gale-cfer2.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#gale-cfer2').html(data);
                                    }
                                })
                            });

                        }
                        if (facet === "Beschreibung") {
                            $(this.target).append($('<button class="click" id="btn-beschreibung" style="cursor: pointer;">' +
                                info_button +
                                '</button> <span id="beschreibung"></span>'));

                            $('#btn-beschreibung').click(function (e) {
                                $.ajax({
                                    url: 'collections/beschreibung.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#beschreibung').html(data);
                                    }
                                })
                            });
                        }
                        if (facet === "Gujin tushu jicheng") {
                            $(this.target).append($('<button class="click" id="btn-gujin" style="cursor: pointer;">' +
                                info_button +
                                '</button> <span id="gujin"></span>'));

                            $('#btn-gujin').click(function (e) {
                                $.ajax({
                                    url: 'collections/gujin.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#gujin').html(data);
                                    }
                                })
                            });
                        }
                        if (facet === "Sibu beiyao") {
                            $(this.target).append($('<button class="click" id="btn-sbby" style="cursor: pointer;">' +
                                info_button +
                                '</button> <span id="sbby"></span>'));

                            $('#btn-sbby').click(function (e) {
                                $.ajax({
                                    url: 'collections/sbby.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#sbby').html(data);
                                    }
                                })
                            });
                        }
                        if (facet === "The Ta Kung Pao 大公報") {
                            $(this.target).append($('<button class="click" id="btn-kungpao" style="cursor: pointer;">' +
                                info_button +
                                '</button> <span id="kungpao"></span>'));

                            $('#btn-kungpao').click(function (e) {
                                $.ajax({
                                    url: 'collections/kungpao.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#kungpao').html(data);
                                    }
                                })
                            });
                        }
                        if (facet === "North China Daily News") {
                            $(this.target).append($('<button class="click" id="btn-brill-ncdn" style="cursor: pointer;">' +
                                info_button +
                                '</button> <span id="brill-ncdn"></span>'));

                            $('#btn-brill-ncdn').click(function (e) {
                                $.ajax({
                                    url: 'collections/brill-ncdn.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#brill-ncdn').html(data);
                                    }
                                })
                            });
                        }
                        if (facet === "North China Standard Online") {
                            $(this.target).append($('<button class="click" id="btn-brill-ncso" style="cursor: pointer;">' +
                                info_button +
                                '</button> <span id="brill-ncso"></span>'));

                            $('#btn-brill-ncso').click(function (e) {
                                $.ajax({
                                    url: 'collections/brill-ncso.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#brill-ncso').html(data);
                                    }
                                })
                            });
                        }
                        if (facet === "Mobilizing East Asia, 1931-1954") {
                            $(this.target).append($('<button class="click" id="btn-brill-meao" style="cursor: pointer;">' +
                                info_button +
                                '</button> <span id="brill-meao"></span>'));

                            $('#btn-brill-meao').click(function (e) {
                                $.ajax({
                                    url: 'collections/brill-meao.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#brill-meao').html(data);
                                    }
                                })
                            });
                        }
                        if (facet === "Dunhuang Historical Material") {
                            $(this.target).append($('<button class="click" id="btn-dunhuang" style="cursor: pointer;">' +
                                info_button +
                                '</button> <span id="dunhuang"></span>'));

                            $('#btn-dunhuang').click(function (e) {
                                $.ajax({
                                    url: 'collections/dunhuang.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#dunhuang').html(data);
                                    }
                                })
                            });
                        }
                        if (facet === "Area Studies Japan, China, and Southeast Asia") {
                            $(this.target).append($('<button class="click" id="btn-amd-areastudies" style="cursor: pointer;">' +
                                info_button +
                                '</button> <span id="amd-areastudies"></span>'));

                            $('#btn-amd-areastudies').click(function (e) {
                                $.ajax({
                                    url: 'collections/amd-areastudies.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#amd-areastudies').html(data);
                                    }
                                })
                            });
                        }
                        if (facet === "Asian Studies (ISEAS publishing)") {
                            $(this.target).append($('<button class="click" id="btn-iseas" style="cursor: pointer;">' +
                                info_button +
                                '</button> <span id="iseas"></span>'));

                            $('#btn-iseas').click(function (e) {
                                $.ajax({
                                    url: 'collections/iseas.html',
                                    type: 'get',
                                    success: function (data) {
                                        $('#iseas').html(data);
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
                            if (facet === "Renmin Ribao") {
                                $("#" + "more_collection").append(
                                    $('<button class="click" onclick="show_hidePopUpWindow(\'rmrb\');" id="btn-rmrb" style="cursor: pointer;">' +
                                        info_button +
                                        '</button> <span id="rmrb" style="display:none"> </span>').click(function (e) {
                                        $.ajax({
                                            url: 'collections/rmrb.html',
                                            type: 'get',
                                            success: function (data) {
                                                if ($('#rmrb').css('display') =="none") {
                                                    $('#rmrb').html(data).show();
                                                    $('#rmrb').css("display","inline");
                                                } else {
                                                    $('#rmrb').html(data).hide();
                                                    $('#rmrb').css("display","none");
                                                }
                                            }
                                        })
                                    })
                                );
                            }

                            if (facet === "Airiti" && this.field == "collection") {
                                $("#" + "more_collection").append(
                                    $('<button class="click" onclick="show_hidePopUpWindow(\'airiti\');" id="btn-airiti" style="cursor: pointer;">' +
                                        info_button +
                                        '</button> <span id="airiti" style="display:none"> </span>').click(function (e) {
                                        $.ajax({
                                            url: 'collections/airiti.html',
                                            type: 'get',
                                            success: function (data) {
                                                if ($('#airiti').css('display') =="none") {
                                                    $('#airiti').html(data).show();
                                                    $('#airiti').css("display","inline");
                                                } else {
                                                    $('#airiti').html(data).hide();
                                                    $('#airiti').css("display","none");
                                                }
                                            }
                                        })
                                    })
                                );
                            }
                            if (
                                facet === "Adam Matthew - Foreign Office Files China & Japan"
                            ) {
                                $("#" + "more_collection").append(
                                    $('<button class="click" onclick="show_hidePopUpWindow(\'adammatthew\');" id="btn-adammatthew" style="cursor: pointer;">' +
                                        info_button +
                                        '</button> <span id="adammatthew" style="display:none"> </span>').click(function (e) {
                                        $.ajax({
                                            url: 'collections/adammatthew.html',
                                            type: 'get',
                                            success: function (data) {
                                                if ($('#adammatthew').css('display') =="none") {
                                                    $('#adammatthew').html(data).show();
                                                    $('#adammatthew').css("display","inline");
                                                } else {
                                                    $('#adammatthew').html(data).hide();
                                                    $('#adammatthew').css("display","none");
                                                }
                                            }
                                        })
                                    })
                                );
                            }
                            if (facet === "Early Twentieth Century Chinese Books (1912-1949)") {
                                $("#" + "more_collection").append(
                                    $('<button class="click" onclick="show_hidePopUpWindow(\'minguo\');" id="btn-minguo" style="cursor: pointer;">' +
                                        info_button +
                                        '</button> <span id="minguo" style="display:none"> </span>').click(function (e) {
                                        $.ajax({
                                            url: 'collections/minguo.html',
                                            type: 'get',
                                            success: function (data) {
                                                if ($('#minguo').css('display') =="none") {
                                                    $('#minguo').html(data).show();
                                                    $('#minguo').css("display","inline");
                                                } else {
                                                    $('#minguo').html(data).hide();
                                                    $('#minguo').css("display","none");
                                                }
                                            }
                                        })
                                    })
                                );
                            }
                            if (facet === "SBB digital : Asian language collection (selection)") {
                                $("#" + "more_collection").append(
                                    $('<button class="click" onclick="show_hidePopUpWindow(\'sbb-digital\');" id="btn-sbb-digital" style="cursor: pointer;">' +
                                        info_button +
                                        '</button> <span id="sbb-digital" style="display:none"> </span>').click(function (e) {
                                        $.ajax({
                                            url: 'collections/sbb-digital.html',
                                            type: 'get',
                                            success: function (data) {
                                                if ($('#sbb-digital').css('display') =="none") {
                                                    $('#sbb-digital').html(data).show();
                                                    $('#sbb-digital').css("display","inline");
                                                } else {
                                                    $('#sbb-digital').html(data).hide();
                                                    $('#sbb-digital').css("display","none");
                                                }
                                            }
                                        })
                                    })
                                );
                            }
                            if (facet === "Local Gazetteer") {
                                $("#" + "more_collection").append(
                                    $('<button class="click" onclick="show_hidePopUpWindow(\'locgaz\');" id="btn-locgaz" style="cursor: pointer;">' +
                                        info_button +
                                        '</button> <span id="locgaz" style="display:none"> </span>').click(function (e) {
                                        $.ajax({
                                            url: 'collections/locgaz.html',
                                            type: 'get',
                                            success: function (data) {
                                                if ($('#locgaz').css('display') =="none") {
                                                    $('#locgaz').html(data).show();
                                                    $('#locgaz').css("display","inline");
                                                } else {
                                                    $('#locgaz').html(data).hide();
                                                    $('#locgaz').css("display","none");
                                                }
                                            }
                                        })
                                    })
                                );
                            }
                            if (facet === "Missionary, Sinology, and Literary Periodicals (1817-1949)") {
                                $("#" + "more_collection").append(
                                    $('<button class="click" onclick="show_hidePopUpWindow(\'gale-cfer\');" id="btn-gale-cfer" style="cursor: pointer;">' +
                                        info_button +
                                        '</button> <span id="gale-cfer" style="display:none"> </span>').click(function (e) {
                                        $.ajax({
                                            url: 'collections/gale-cfer.html',
                                            type: 'get',
                                            success: function (data) {
                                                if ($('#gale-cfer').css('display') =="none") {
                                                    $('#gale-cfer').html(data).show();
                                                    $('#gale-cfer').css("display","inline");
                                                } else {
                                                    $('#gale-cfer').html(data).hide();
                                                    $('#gale-cfer').css("display","none");
                                                }
                                            }
                                        })
                                    })
                                );
                            }
                            if (facet === "Local Gazetteer (Diaolong)") {
                                $("#" + "more_collection").append(
                                    $('<button class="click" onclick="show_hidePopUpWindow(\'dfz\');" id="btn-dfz" style="cursor: pointer;">' +
                                        info_button +
                                        '</button> <span id="dfz" style="display:none"> </span>').click(function (e) {
                                        $.ajax({
                                            url: 'collections/dfz.html',
                                            type: 'get',
                                            success: function (data) {
                                                if ($('#dfz').css('display') =="none") {
                                                    $('#dfz').html(data).show();
                                                    $('#dfz').css("display","inline");
                                                } else {
                                                    $('#dfz').html(data).hide();
                                                    $('#dfz').css("display","none");
                                                }
                                            }
                                        })
                                    })
                                );
                            }
                            if (facet === "Qingdai shiliao") {
                                $("#" + "more_collection").append(
                                    $('<button class="click" onclick="show_hidePopUpWindow(\'dl-shiliao\');" id="btn-dl-shiliao" style="cursor: pointer;">' +
                                        info_button +
                                        '</button> <span id="dl-shiliao" style="display:none"> </span>').click(function (e) {
                                        $.ajax({
                                            url: 'collections/dl-shiliao.html',
                                            type: 'get',
                                            success: function (data) {
                                                if ($('#dl-shiliao').css('display') =="none") {
                                                    $('#dl-shiliao').html(data).show();
                                                    $('#dl-shiliao').css("display","inline");
                                                } else {
                                                    $('#dl-shiliao').html(data).hide();
                                                    $('#dl-shiliao').css("display","none");
                                                }
                                            }
                                        })
                                    })
                                );
                            }
                            if (facet === "Sibu congkan") {
                                $("#" + "more_collection").append(
                                    $('<button class="click" onclick="show_hidePopUpWindow(\'sbck\');" id="btn-sbck" style="cursor: pointer;">' +
                                        info_button +
                                        '</button> <span id="sbck" style="display:none"> </span>').click(function (e) {
                                        $.ajax({
                                            url: 'collections/sbck.html',
                                            type: 'get',
                                            success: function (data) {
                                                if ($('#sbck').css('display') =="none") {
                                                    $('#sbck').html(data).show();
                                                    $('#sbck').css("display","inline");
                                                } else {
                                                    $('#sbck').html(data).hide();
                                                    $('#sbck').css("display","none");
                                                }
                                            }
                                        })
                                    })
                                );
                            }
                            if (facet === "SBB digital : Western language Asia collection") {
                                $("#" + "more_collection").append(
                                    $('<button class="click" onclick="show_hidePopUpWindow(\'sbb-digital\');" id="btn-sbb-digital" style="cursor: pointer;">' +
                                        info_button +
                                        '</button> <span id="sbb-digital" style="display:none"> </span>').click(function (e) {
                                        $.ajax({
                                            url: 'collections/sbb-digital.html',
                                            type: 'get',
                                            success: function (data) {
                                                if ($('#sbb-digital').css('display') =="none") {
                                                    $('#sbb-digital').html(data).show();
                                                    $('#sbb-digital').css("display","inline");
                                                } else {
                                                    $('#sbb-digital').html(data).hide();
                                                    $('#sbb-digital').css("display","none");
                                                }
                                            }
                                        })
                                    })
                                );
                            }
                            if (facet === "The Chinese Students’ Monthly Online") {
                                $("#" + "more_collection").append(
                                    $('<button class="click" onclick="show_hidePopUpWindow(\'brill-csmo\');" id="btn-brill-csmo" style="cursor: pointer;">' +
                                        info_button +
                                        '</button> <span id="brill-csmo" style="display:none"> </span>').click(function (e) {
                                        $.ajax({
                                            url: 'collections/brill-csmo.html',
                                            type: 'get',
                                            success: function (data) {
                                                if ($('#brill-csmo').css('display') =="none") {
                                                    $('#brill-csmo').html(data).show();
                                                    $('#brill-csmo').css("display","inline");
                                                } else {
                                                    $('#brill-csmo').html(data).hide();
                                                    $('#brill-csmo').css("display","none");
                                                }
                                            }
                                        })
                                    })
                                );
                            }
                            if (facet === "The North China Herald Online") {
                                $("#" + "more_collection").append(
                                    $('<button class="click" onclick="show_hidePopUpWindow(\'brill-ncho\');" id="btn-brill-ncho" style="cursor: pointer;">' +
                                        info_button +
                                        '</button> <span id="brill-ncho" style="display:none"> </span>').click(function (e) {
                                        $.ajax({
                                            url: 'collections/brill-ncho.html',
                                            type: 'get',
                                            success: function (data) {
                                                if ($('#brill-ncho').css('display') =="none") {
                                                    $('#brill-ncho').html(data).show();
                                                    $('#brill-ncho').css("display","inline");
                                                } else {
                                                    $('#brill-ncho').html(data).hide();
                                                    $('#brill-ncho').css("display","none");
                                                }
                                            }
                                        })
                                    })
                                );
                            }
                            if (facet === "Japan Chronicle Online") {
                                $("#" + "more_collection").append(
                                    $('<button class="click" onclick="show_hidePopUpWindow(\'brill-jpco\');" id="btn-brill-jpco" style="cursor: pointer;">' +
                                        info_button +
                                        '</button> <span id="brill-jpco" style="display:none"> </span>').click(function (e) {
                                        $.ajax({
                                            url: 'collections/brill-jpco.html',
                                            type: 'get',
                                            success: function (data) {
                                                if ($('#brill-jpco').css('display') =="none") {
                                                    $('#brill-jpco').html(data).show();
                                                    $('#brill-jpco').css("display","inline");
                                                } else {
                                                    $('#brill-jpco').html(data).hide();
                                                    $('#brill-jpco').css("display","none");
                                                }
                                            }
                                        })
                                    })
                                );
                            }
                            if (facet === "Daozang jiyao") {
                                $("#" + "more_collection").append(
                                    $('<button class="click" onclick="show_hidePopUpWindow(\'dl-jiyao\');" id="btn-dl-jiyao" style="cursor: pointer;">' +
                                        info_button +
                                        '</button> <span id="dl-jiyao" style="display:none"> </span>').click(function (e) {
                                        $.ajax({
                                            url: 'collections/dl-jiyao.html',
                                            type: 'get',
                                            success: function (data) {
                                                if ($('#dl-jiyao').css('display') =="none") {
                                                    $('#dl-jiyao').html(data).show();
                                                    $('#dl-jiyao').css("display","inline");
                                                } else {
                                                    $('#dl-jiyao').html(data).hide();
                                                    $('#dl-jiyao').css("display","none");
                                                }
                                            }
                                        })
                                    })
                                );
                            }
                            if (facet === "Xuxiu Siku quanshu") {
                                $("#" + "more_collection").append(
                                    $('<button class="click" onclick="show_hidePopUpWindow(\'xuxiu\');" id="btn-xuxiu" style="cursor: pointer;">' +
                                        info_button +
                                        '</button> <span id="xuxiu" style="display:none"> </span>').click(function (e) {
                                        $.ajax({
                                            url: 'collections/xuxiu.html',
                                            type: 'get',
                                            success: function (data) {
                                                if ($('#xuxiu').css('display') =="none") {
                                                    $('#xuxiu').html(data).show();
                                                    $('#xuxiu').css("display","inline");
                                                } else {
                                                    $('#xuxiu').html(data).hide();
                                                    $('#xuxiu').css("display","none");
                                                }
                                            }
                                        })
                                    })
                                );
                            }
                            if (facet === "Adam Matthew - China America Pacific") {
                                $("#" + "more_collection").append(
                                    $('<button class="click" onclick="show_hidePopUpWindow(\'china-pacific\');" id="btn-china-pacific" style="cursor: pointer;">' +
                                        info_button +
                                        '</button> <span id="china-pacific" style="display:none"> </span>').click(function (e) {
                                        $.ajax({
                                            url: 'collections/china-pacific.html',
                                            type: 'get',
                                            success: function (data) {
                                                if ($('#china-pacific').css('display') =="none") {
                                                    $('#china-pacific').html(data).show();
                                                    $('#china-pacific').css("display","inline");
                                                } else {
                                                    $('#china-pacific').html(data).hide();
                                                    $('#china-pacific').css("display","none");
                                                }
                                            }
                                        })
                                    })
                                );
                            }
                            if (facet === "Adam Matthew - China Trade & Politics") {
                                $("#" + "more_collection").append(
                                    $('<button class="click" onclick="show_hidePopUpWindow(\'china-trade\');" id="btn-china-trade" style="cursor: pointer;">' +
                                        info_button +
                                        '</button> <span id="china-trade" style="display:none"> </span>').click(function (e) {
                                        $.ajax({
                                            url: 'collections/china-trade.html',
                                            type: 'get',
                                            success: function (data) {
                                                if ($('#china-trade').css('display') =="none") {
                                                    $('#china-trade').html(data).show();
                                                    $('#china-trade').css("display","inline");
                                                } else {
                                                    $('#china-trade').html(data).hide();
                                                    $('#china-trade').css("display","none");
                                                }
                                            }
                                        })
                                    })
                                );
                            }
                            if (facet === "Adam Matthew - Meiji Japan") {
                                $("#" + "more_collection").append(
                                    $('<button class="click" onclick="show_hidePopUpWindow(\'meiji-japan\');" id="btn-meiji-japan" style="cursor: pointer;">' +
                                        info_button +
                                        '</button> <span id="meiji-japan" style="display:none"> </span>').click(function (e) {
                                        $.ajax({
                                            url: 'collections/meiji-japan.html',
                                            type: 'get',
                                            success: function (data) {
                                                if ($('#meiji-japan').css('display') =="none") {
                                                    $('#meiji-japan').html(data).show();
                                                    $('#meiji-japan').css("display","inline");
                                                } else {
                                                    $('#meiji-japan').html(data).hide();
                                                    $('#meiji-japan').css("display","none");
                                                }
                                            }
                                        })
                                    })
                                );
                            }
                            if (facet === "CNKI eBooks") {
                                $("#" + "more_collection").append(
                                    $('<button class="click" onclick="show_hidePopUpWindow(\'cnki\');" id="btn-cnki" style="cursor: pointer;">' +
                                        info_button +
                                        '</button> <span id="cnki" style="display:none"> </span>').click(function (e) {
                                        $.ajax({
                                            url: 'collections/cnki.html',
                                            type: 'get',
                                            success: function (data) {
                                                if ($('#cnki').css('display') =="none") {
                                                    $('#cnki').html(data).show();
                                                    $('#cnki').css("display","inline");
                                                } else {
                                                    $('#cnki').html(data).hide();
                                                    $('#cnki').css("display","none");
                                                }
                                            }
                                        })
                                    })
                                );
                            }
                            if (facet === "China Comprehensive Gazetteers") {
                                $("#" + "more_collection").append(
                                    $('<button class="click" onclick="show_hidePopUpWindow(\'eastview-ccg\');" id="btn-eastview-ccg" style="cursor: pointer;">' +
                                        info_button +
                                        '</button> <span id="eastview-ccg" style="display:none"> </span>').click(function (e) {
                                        $.ajax({
                                            url: 'collections/eastview-ccg.html',
                                            type: 'get',
                                            success: function (data) {
                                                if ($('#eastview-ccg').css('display') =="none") {
                                                    $('#eastview-ccg').html(data).show();
                                                    $('#eastview-ccg').css("display","inline");
                                                } else {
                                                    $('#eastview-ccg').html(data).hide();
                                                    $('#eastview-ccg').css("display","none");
                                                }
                                            }
                                        })
                                    })
                                );
                            }
                            if (facet === "Fulltext search in print books") {
                                $("#" + "more_collection").append(
                                    $('<button class="click" onclick="show_hidePopUpWindow(\'cibtc\');" id="btn-cibtc" style="cursor: pointer;">' +
                                        info_button +
                                        '</button> <span id="cibtc" style="display:none"> </span>').click(function (e) {
                                        $.ajax({
                                            url: 'collections/cibtc.html',
                                            type: 'get',
                                            success: function (data) {
                                                $('#cibtc').html(data);
                                                if ($('#cibtc').css('display') =="none") {
                                                    $('#cibtc').html(data).show();
                                                    $('#cibtc').css("display","inline");
                                                } else {
                                                    $('#cibtc').html(data).hide();
                                                    $('#cibtc').css("display","none");
                                                }
                                            }
                                        })
                                    })
                                );
                            }
                            if (facet === "Zhengtong Daozang") {
                                $("#" + "more_collection").append(
                                    $('<button class="click" onclick="show_hidePopUpWindow(\'daozang\');" id="btn-daozang" style="cursor: pointer;">' +
                                        info_button +
                                        '</button> <span id="daozang" style="display:none"> </span>').click(function (e) {
                                        $.ajax({
                                            url: 'collections/daozang.html',
                                            type: 'get',
                                            success: function (data) {
                                                if ($('#daozang').css('display') =="none") {
                                                    $('#daozang').html(data).show();
                                                    $('#daozang').css("display","inline");
                                                } else {
                                                    $('#daozang').html(data).hide();
                                                    $('#daozang').css("display","none");
                                                }
                                            }
                                        })
                                    })
                                );
                            }
                            if (facet === "Classical Works of Japan") {
                                $("#" + "more_collection").append(
                                    $('<button class="click" onclick="show_hidePopUpWindow(\'riben\');" id="btn-riben" style="cursor: pointer;">' +
                                        info_button +
                                        '</button> <span id="riben" style="display:none"> </span>').click(function (e) {
                                        $.ajax({
                                            url: 'collections/riben.html',
                                            type: 'get',
                                            success: function (data) {
                                                if ($('#riben').css('display') =="none") {
                                                    $('#riben').html(data).show();
                                                    $('#riben').css("display","inline");
                                                } else {
                                                    $('#riben').html(data).hide();
                                                    $('#riben').css("display","none");
                                                }
                                            }
                                        })
                                    })
                                );
                            }
                            if (facet === "Siku quanshu") {
                                $("#" + "more_collection").append(
                                    $('<button class="click" onclick="show_hidePopUpWindow(\'siku\');" id="btn-siku" style="cursor: pointer;">' +
                                        info_button +
                                        '</button> <span id="siku" style="display:none"> </span>').click(function (e) {
                                        $.ajax({
                                            url: 'collections/siku.html',
                                            type: 'get',
                                            success: function (data) {
                                                if ($('#siku').css('display') =="none") {
                                                    $('#siku').html(data).show();
                                                    $('#siku').css("display","inline");
                                                } else {
                                                    $('#siku').html(data).hide();
                                                    $('#siku').css("display","none");
                                                }
                                            }
                                        })
                                    })
                                );
                            }
                            if (facet === "Yongle dadian") {
                                $("#" + "more_collection").append(
                                    $('<button class="click" onclick="show_hidePopUpWindow(\'dl-yldd\');" id="btn-dl-yldd" style="cursor: pointer;">' +
                                        info_button +
                                        '</button> <span id="dl-yldd" style="display:none"> </span>').click(function (e) {
                                        $.ajax({
                                            url: 'collections/dl-yldd.html',
                                            type: 'get',
                                            success: function (data) {
                                                if ($('#dl-yldd').css('display') =="none") {
                                                    $('#dl-yldd').html(data).show();
                                                    $('#dl-yldd').css("display","inline");
                                                } else {
                                                    $('#dl-yldd').html(data).hide();
                                                    $('#dl-yldd').css("display","none");
                                                }
                                            }
                                        })
                                    })
                                );
                            }
                            if (facet === "China and the Modern World: Records of the Maritime Customs Service of China (1854-1949)") {
                                $("#" + "more_collection").append(
                                    $('<button class="click" onclick="show_hidePopUpWindow(\'gale-cfer2\');" id="btn-gale-cfer2" style="cursor: pointer;">' +
                                        info_button +
                                        '</button> <span id="gale-cfer2" style="display:none"> </span>').click(function (e) {
                                        $.ajax({
                                            url: 'collections/gale-cfer2.html',
                                            type: 'get',
                                            success: function (data) {
                                                if ($('#gale-cfer2').css('display') =="none") {
                                                    $('#gale-cfer2').html(data).show();
                                                    $('#gale-cfer2').css("display","inline");
                                                } else {
                                                    $('#gale-cfer2').html(data).hide();
                                                    $('#gale-cfer2').css("display","none");
                                                }
                                            }
                                        })
                                    })
                                );
                            }
                            if (facet === "Beschreibung") {
                                $("#" + "more_collection").append(
                                    $('<button class="click" onclick="show_hidePopUpWindow(\'beschreibung\');" id="btn-beschreibung" style="cursor: pointer;">' +
                                        info_button +
                                        '</button> <span id="beschreibung" style="display:none"> </span>').click(function (e) {
                                        $.ajax({
                                            url: 'collections/beschreibung.html',
                                            type: 'get',
                                            success: function (data) {
                                                if ($('#beschreibung').css('display') =="none") {
                                                    $('#beschreibung').html(data).show();
                                                    $('#beschreibung').css("display","inline");
                                                } else {
                                                    $('#beschreibung').html(data).hide();
                                                    $('#beschreibung').css("display","none");
                                                }
                                            }
                                        })
                                    })
                                );
                            }
                            if (facet === "Gujin tushu jicheng") {
                                $("#" + "more_collection").append(
                                    $('<button class="click" onclick="show_hidePopUpWindow(\'gujin\');" id="btn-gujin" style="cursor: pointer;">' +
                                        info_button +
                                        '</button> <span id="gujin" style="display:none"> </span>').click(function (e) {
                                        $.ajax({
                                            url: 'collections/gujin.html',
                                            type: 'get',
                                            success: function (data) {
                                                if ($('#gujin').css('display') =="none") {
                                                    $('#gujin').html(data).show();
                                                    $('#gujin').css("display","inline");
                                                } else {
                                                    $('#gujin').html(data).hide();
                                                    $('#gujin').css("display","none");
                                                }
                                            }
                                        })
                                    })
                                );
                            }
                            if (facet === "Sibu beiyao") {
                                $("#" + "more_collection").append(
                                    $('<button class="click" onclick="show_hidePopUpWindow(\'sbby\');" id="btn-sbby" style="cursor: pointer;">' +
                                        info_button +
                                        '</button> <span id="sbby" style="display:none"> </span>').click(function (e) {
                                        $.ajax({
                                            url: 'collections/sbby.html',
                                            type: 'get',
                                            success: function (data) {
                                                if ($('#sbby').css('display') =="none") {
                                                    $('#sbby').html(data).show();
                                                    $('#sbby').css("display","inline");
                                                } else {
                                                    $('#sbby').html(data).hide();
                                                    $('#sbby').css("display","none");
                                                }
                                            }
                                        })
                                    })
                                );
                            }
                            if (facet === "The Ta Kung Pao 大公報") {
                                $("#" + "more_collection").append(
                                    $('<button class="click" onclick="show_hidePopUpWindow(\'kungpao\');" id="btn-kungpao" style="cursor: pointer;">' +
                                        info_button +
                                        '</button> <span id="kungpao" style="display:none"> </span>').click(function (e) {
                                        $.ajax({
                                            url: 'collections/kungpao.html',
                                            type: 'get',
                                            success: function (data) {
                                                if ($('#kungpao').css('display') =="none") {
                                                    $('#kungpao').html(data).show();
                                                    $('#kungpao').css("display","inline");
                                                } else {
                                                    $('#kungpao').html(data).hide();
                                                    $('#kungpao').css("display","none");
                                                }
                                            }
                                        })
                                    })
                                );
                            }
                            if (facet === "North China Daily News") {
                                $("#" + "more_collection").append(
                                    $('<button class="click" onclick="show_hidePopUpWindow(\'brill-ncdn\');" id="btn-brill-ncdn" style="cursor: pointer;">' +
                                        info_button +
                                        '</button> <span id="brill-ncdn" style="display:none"> </span>').click(function (e) {
                                        $.ajax({
                                            url: 'collections/brill-ncdn.html',
                                            type: 'get',
                                            success: function (data) {
                                                if ($('#brill-ncdn').css('display') =="none") {
                                                    $('#brill-ncdn').html(data).show();
                                                    $('#brill-ncdn').css("display","inline");
                                                } else {
                                                    $('#brill-ncdn').html(data).hide();
                                                    $('#brill-ncdn').css("display","none");
                                                }
                                            }
                                        })
                                    })
                                );
                            }
                            if (facet === "North China Standard Online") {
                                $("#" + "more_collection").append(
                                    $('<button class="click" onclick="show_hidePopUpWindow(\'brill-ncso\');" id="btn-brill-ncso" style="cursor: pointer;">' +
                                        info_button +
                                        '</button> <span id="brill-ncso" style="display:none"> </span>').click(function (e) {
                                        $.ajax({
                                            url: 'collections/brill-ncso.html',
                                            type: 'get',
                                            success: function (data) {
                                                if ($('#brill-ncso').css('display') =="none") {
                                                    $('#brill-ncso').html(data).show();
                                                    $('#brill-ncso').css("display","inline");
                                                } else {
                                                    $('#brill-ncso').html(data).hide();
                                                    $('#brill-ncso').css("display","none");
                                                }
                                            }
                                        })
                                    })
                                );
                            }
                            if (facet === "Mobilizing East Asia, 1931-1954") {
                                $("#" + "more_collection").append(
                                    $('<button class="click" onclick="show_hidePopUpWindow(\'brill-meao\');" id="btn-brill-meao" style="cursor: pointer;">' +
                                        info_button +
                                        '</button> <span id="brill-meao" style="display:none"> </span>').click(function (e) {
                                        $.ajax({
                                            url: 'collections/brill-meao.html',
                                            type: 'get',
                                            success: function (data) {
                                                if ($('#brill-meao').css('display') =="none") {
                                                    $('#brill-meao').html(data).show();
                                                    $('#brill-meao').css("display","inline");
                                                } else {
                                                    $('#brill-meao').html(data).hide();
                                                    $('#brill-meao').css("display","none");
                                                }
                                            }
                                        })
                                    })
                                );
                            }
                            if (facet === "Dunhuang Historical Material") {
                                $("#" + "more_collection").append(
                                    $('<button class="click" onclick="show_hidePopUpWindow(\'dunhuang\');" id="btn-dunhuang" style="cursor: pointer;">' +
                                        info_button +
                                        '</button> <span id="dunhuang" style="display:none"> </span>').click(function (e) {
                                        $.ajax({
                                            url: 'collections/dunhuang.html',
                                            type: 'get',
                                            success: function (data) {
                                                if ($('#dunhuang').css('display') =="none") {
                                                    $('#dunhuang').html(data).show();
                                                    $('#dunhuang').css("display","inline");
                                                } else {
                                                    $('#dunhuang').html(data).hide();
                                                    $('#dunhuang').css("display","none");
                                                }
                                            }
                                        })
                                    })
                                );
                            }
                            if (facet === "Area Studies Japan, China, and Southeast Asia") {
                                $("#" + "more_collection").append(
                                    $('<button class="click" onclick="show_hidePopUpWindow(\'amd-areastudies\');" id="btn-amd-areastudies" style="cursor: pointer;">' +
                                        info_button +
                                        '</button> <span id="amd-areastudies" style="display:none"> </span>').click(function (e) {
                                        $.ajax({
                                            url: 'collections/amd-areastudies.html',
                                            type: 'get',
                                            success: function (data) {
                                                if ($('#amd-areastudies').css('display') =="none") {
                                                    $('#amd-areastudies').html(data).show();
                                                    $('#amd-areastudies').css("display","inline");
                                                } else {
                                                    $('#amd-areastudies').html(data).hide();
                                                    $('#amd-areastudies').css("display","none");
                                                }
                                            }
                                        })
                                    })
                                );
                            }
                            if (facet === "Asian Studies (ISEAS publishing)") {
                                $("#" + "more_collection").append(
                                    $('<button class="click" onclick="show_hidePopUpWindow(\'iseas\');" id="btn-iseas" style="cursor: pointer;">' +
                                        info_button +
                                        '</button> <span id="iseas" style="display:none"> </span>').click(function (e) {
                                        $.ajax({
                                            url: 'collections/iseas.html',
                                            type: 'get',
                                            success: function (data) {
                                                if ($('#iseas').css('display') =="none") {
                                                    $('#iseas').html(data).show();
                                                    $('#iseas').css("display","inline");
                                                } else {
                                                    $('#iseas').html(data).hide();
                                                    $('#iseas').css("display","none");
                                                }
                                            }
                                        })
                                    })
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