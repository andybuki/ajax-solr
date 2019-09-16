var Manager;

(function ($) {

    $(function () {
        Manager = new AjaxSolr.Manager({
            //solrUrl: 'http://b-app66:8995/solr/ajax-loc-gaz/select?shards=http://b-app66:8995/solr/ajax-loc-gaz,http://b-app66:8995/solr/ajax-fo-china-japan,http://b-app66:8995/solr/ajax-rmrb,http://b-app66:8995/solr/ajax-airiti,http://b-app66:8995/solr/ajax-china-trade,http://b-app66:8995/solr/ajax-china-pacific,http://b-app66:8995/solr/ajax-meiji-japan,http://b-app66:8995/solr/ajax-dfz,http://b-app66:8995/solr/ajax-gale-cfer,http://b-app66:8995/solr/ajax-cnki,http://b-app66:8995/solr/ajax-dl-jiyao,http://b-app66:8995/solr/ajax-cibtc,http://b-app66:8995/solr/ajax-riben,http://b-app66:8995/solr/ajax-eastview-ccg,http://b-app66:8995/solr/ajax-dl-shiliao&indent=true&rows=20&'
            solrUrl: '/solr/ajax-loc-gaz/select?shards=localhost:8995/solr/ajax-loc-gaz,' +
                'localhost:8995/solr/ajax-fo-china-japan,' +
                'localhost:8995/solr/ajax-xuxiu,' +
                'localhost:8995/solr/ajax-rmrb,' +
                'localhost:8995/solr/ajax-airiti,' +
                'localhost:8995/solr/ajax-china-trade,' +
                'localhost:8995/solr/ajax-china-pacific,' +
                'localhost:8995/solr/ajax-meiji-japan,' +
                'localhost:8995/solr/ajax-dfz,' +
                'localhost:8995/solr/ajax-gale-cfer,' +
                'localhost:8995/solr/ajax-cnki,' +
                'localhost:8995/solr/ajax-cibtc,' +
                'localhost:8995/solr/ajax-riben,' +
                'localhost:8995/solr/ajax-gale-cfer2,' +
                'localhost:8995/solr/ajax-minguo,' +
                'localhost:8995/solr/ajax-sbb-digital,' +
                'localhost:8995/solr/ajax-eastview-ccg,' +
                'localhost:8995/solr/ajax-dl-jiyao,' +
                'localhost:8995/solr/ajax-dl-shiliao,' +
                'localhost:8995/solr/ajax-skqs,' +
                'localhost:8995/solr/ajax-gujin&indent=true&rows=20&'
            //solrUrl: 'http://b-app66:8995/solr/ajax-eastview-ccg/select?shards=localhost:8995/solr/ajax-eastview-ccg,localhost:8995/solr/ajax-rmrb,localhost:8995/solr/ajax-airiti&indent=true&rows=20&'
            //solrUrl: 'http://10.46.3.100:8982/solr/AMD_FOChina/select?shards=10.46.3.100:8982/solr/AMD_FOChina,10.46.3.100:8982/solr/LocGaz,10.46.3.100:8982/solr/Xuxiu,10.46.3.100:8982/solr/airiti_nested,10.46.3.100:8982/solr/RMRB,10.46.3.100:8982/solr/China_Trade,10.46.3.100:8982/solr/ChinaAmericaPacific,10.46.3.100:8982/solr/MeijiJapan_small,10.46.3.100:8982/solr/CNKI&indent=true&'
            //solrUrl: '/solr/ajax-loc-gaz/select?shards=localhost:8995/solr/ajax-loc-gaz,localhost:8995/solr/ajax-rmrb,localhost:8995/solr/ajax-china-pacific,localhost:8995/solr/ajax-eastview-ccg&indent=true&rows=20&'
            //solrUrl: 'http://b-app66:8995/solr/ajax-loc-gaz/select?shards=http://b-app66:8995/solr/ajax-loc-gaz,http://b-app66:8995/solr/ajax-airiti&indent=true&rows=10&'
        });
        Manager.addWidget(new AjaxSolr.ResultWidget({
            id: 'result',
            target: '#docs',
            highlighting: true,
        }));
        Manager.addWidget(new AjaxSolr.PagerWidget({
            id: 'pager',
            target: '#pager',
            prevLabel: '&lt;',
            nextLabel: '&gt;',
            innerWindow: 1,
            renderHeader: function (perPage, offset, total) {
                $('#pager-header').html($('<span></span>').text('displaying ' + Math.min(total, offset + 1) + ' to ' + Math.min(total, offset + perPage) + ' of ' + total));
            }
        }));
        var fields = ['text','hasModel','medium','edition','person','spatial','author','title','collection', 'date','language','medium_facet','edition_facet','person_facet','spatial_facet','author_facet','title_facet','subject_facet','subject','chapter_title'];
        for (var i = 0, l = fields.length; i < l; i++) {
            Manager.addWidget(new AjaxSolr.MultiSelectWidget({ //MultiSelectWidget instead of Tagcloudwidget
                id: fields[i],
                target: '#' + fields[i],
                field: fields[i],
                max_show: 10,
                max_facets: 200,
                sort_type: 'count' //possible values: 'range', 'lex', 'count'
            }));
        }
        Manager.addWidget(new AjaxSolr.CurrentSearchWidget({
            id: 'currentsearch',
            target: '#selection'
        }));

        Manager.addWidget(new AjaxSolr.AutocompleteWidget({
            id: 'text',
            target: '#search',
            fields: ['title_facet','author_facet','medium','edition_facet','person_facet','spatial_facet','subject_facet']
        }));

        function getUrlParam(name) {
            this.name = name;
            this.result = "";
            if(location.search) {
                params = window.location.search.substring(1);
                params.split("&").forEach(function(part) {
                    item = part.split("=");
                    if(item[0] === this.name) return this.result = decodeURIComponent(item[1].replace(/\+/g, " "));
                })
            }
            return this.result;
        }

        Manager.init();
        query = getUrlParam("query");
        if (query) {
            $('#query').val(query);
            var queryValue = $('#query').val();
            var value = decodeURI(queryValue);
            Manager.store.addByValue('q', value);
            var params = {
                facet: true,
                'facet.field': ['hasModel','medium_facet','edition_facet', 'person_facet', 'spatial_facet' ,'author_facet', 'title_facet','collection', 'date','language','subject_facet'],
                'facet.limit': 300,
                'facet.mincount': 1,
                'f.date.facet.limit': 100,
                'f.author_facet.facet.limit': 50,
                'f.person_facet.facet.limit': 50,
                'f.subject_facet.facet.limit': 50,
                'f.spatial_facet.facet.limit': 100,
                'json.nl': 'map',
                'fl':['id','book_id','medium','url','format','erflink','author','creator','publication_place','edition','title','position','position_vol','volume','hasModel','collection','date','publisher','series_title','description','text','pageStart','pageEnd','chapter_id','language','issued','note','responsibility','extent','running_title','page','wholeDate','image_url','identifier','electronic-url','journal-title','page-range','electronic_url','chapter_title','keywords','noOfpages'],
                'hl':true,
                'hl.fl':'text',
                'f.text.hl.alternateField':'text',
                'hl.maxAlternateFieldLength':40,
                'hl.fragsize':25,
                'hl.usePhraseHighlighter':true,
                'hl.snippets': 4, //Change if you want more or less highlighting snippets
                'hl.simple.pre': '<font style="background:#FFFF99">',
                'hl.simple.post': '</font>'
            };

            for (var name in params) {
                Manager.store.addByValue(name, params[name]);
            }
            Manager.doRequest();
            window.history.pushState({}, document.title, document.location.pathname + document.location.search.replace(/&?query=[^&]*/g, "").replace(/\?$/, " "));
        } else {
            Manager.store.addByValue('q', '*:*');
            var params = {
                facet: true,
                'facet.field': ['hasModel','medium_facet','edition_facet', 'person_facet', 'spatial_facet' ,'author_facet', 'title_facet','collection', 'date','language','subject_facet'],
                'facet.limit': 300,
                'facet.mincount': 1,
                'f.date.facet.limit': 100,
                'f.author_facet.facet.limit': 50,
                'f.person_facet.facet.limit': 50,
                'f.subject_facet.facet.limit': 50,
                'f.spatial_facet.facet.limit': 100,
                /*'f.countryCodes.facet.limit': -1,
                'facet.date': 'date',
                'facet.date.start': '1187-02-26T00:00:00.000Z/DAY',
                'facet.date.end': '1987-10-20T00:00:00.000Z/DAY+1DAY',
                'facet.date.gap': '+1DAY',*/
                'json.nl': 'map',
                //'fq':'hasModel:Book',
                //'fl':'hits:[subquery]',
                //'hits.q':'{!terms f=book_id v=$row.book_id}',
                'fl':['id','book_id','url','medium','erflink','format','author','publication_place','creator','title','edition','position','volume','position_vol','hasModel','collection','date','publisher','series_title','description','text','pageStart','pageEnd','chapter_id','language','issued','note','responsibility','extent','running_title','page','wholeDate','image_url','identifier','electronic-url','journal-title','page-range','electronic_url','chapter_title','keywords','noOfpages','subject'],
                //'sort':'id asc',
                'hl':true,
                //'fl':'hits:[subquery]&hits.q={!terms%20f=book_id%20&v=$row.book_id}',
                'hl.fl':'text',
                'f.text.hl.alternateField':'text',
                'hl.maxAlternateFieldLength':40,
                'hl.fragsize':25,
                'hl.usePhraseHighlighter':true,
                //The field for which you want highlighting snippets
                'hl.snippets': 4, //Change if you want more or less highlighting snippets
                //Also for highlighting, can optionally set these params for how you want the highlighting to look (yellow background here; Solr default is <em>...</em>):
                'hl.simple.pre': '<font style="background:#FFFF99">',
                //'hl.method':'unified',
                'hl.simple.post': '</font>'/*,
        group: true,
        'group.field': 'position',
        'group.ngroups': true*/

            };

            for (var name in params) {
                Manager.store.addByValue(name, params[name]);
            }
            Manager.doRequest();
        }
    });


})(jQuery);
