var Manager;
(function ($) {
    $(function () {
        Manager = new AjaxSolr.Manager({
            solrUrl: 'http://solr-master-test.sbb.spk-berlin.de:8995/solr/ajax-loc-gaz/ajax?shards=http://solr-master-test.sbb.spk-berlin.de:8995/solr/ajax-loc-gaz,'+
                'http://solr-master-test.sbb.spk-berlin.de:8995/solr/ajax-fo-china-japan,'+
                'http://solr-master-test.sbb.spk-berlin.de:8995/solr/ajax-brill-meao,'+
                'http://solr-master-test.sbb.spk-berlin.de:8995/solr/ajax-brill-ncdn,'+
                'http://solr-master-test.sbb.spk-berlin.de:8995/solr/ajax-brill-ncso,' +
                'http://solr-master-test.sbb.spk-berlin.de:8995/solr/ajax-brill-csmo,' +
                'http://solr-master-test.sbb.spk-berlin.de:8995/solr/ajax-brill-jpco,' +
                'http://solr-master-test.sbb.spk-berlin.de:8995/solr/ajax-brill-ncho,' +
                'http://solr-master-test.sbb.spk-berlin.de:8995/solr/ajax-xuxiu,'+
                'http://solr-master-test.sbb.spk-berlin.de:8995/solr/ajax-rmrb,'+
                'http://solr-master-test.sbb.spk-berlin.de:8995/solr/ajax-airiti,'+
                'http://solr-master-test.sbb.spk-berlin.de:8995/solr/ajax-china-trade,'+
                'http://solr-master-test.sbb.spk-berlin.de:8995/solr/ajax-china-pacific,'+
                'http://solr-master-test.sbb.spk-berlin.de:8995/solr/ajax-meiji-japan,'+
                'http://solr-master-test.sbb.spk-berlin.de:8995/solr/ajax-dfz,'+
                'http://solr-master-test.sbb.spk-berlin.de:8995/solr/ajax-gale-cfer,'+
                'http://solr-master-test.sbb.spk-berlin.de:8995/solr/ajax-cnki,'+
                'http://solr-master-test.sbb.spk-berlin.de:8995/solr/ajax-dagongbao,'+
                'http://solr-master-test.sbb.spk-berlin.de:8995/solr/ajax-cibtc,'+
                'http://solr-master-test.sbb.spk-berlin.de:8995/solr/ajax-riben,'+
                'http://solr-master-test.sbb.spk-berlin.de:8995/solr/ajax-gale-cfer2,'+
                'http://solr-master-test.sbb.spk-berlin.de:8995/solr/ajax-minguo,'+
                'http://solr-master-test.sbb.spk-berlin.de:8995/solr/ajax-sbb-digital,'+
                'http://solr-master-test.sbb.spk-berlin.de:8995/solr/ajax-eastview-ccg,'+
                'http://solr-master-test.sbb.spk-berlin.de:8995/solr/ajax-dl-jiyao,'+
                'http://solr-master-test.sbb.spk-berlin.de:8995/solr/ajax-dl-shiliao,'+
                'http://solr-master-test.sbb.spk-berlin.de:8995/solr/ajax-skqs,'+
                'http://solr-master-test.sbb.spk-berlin.de:8995/solr/ajax-sbby,'+
                'http://solr-master-test.sbb.spk-berlin.de:8995/solr/ajax-dl-yldd,'+
                'http://solr-master-test.sbb.spk-berlin.de:8995/solr/ajax-ead-digital,'+
                'http://solr-master-test.sbb.spk-berlin.de:8995/solr/ajax-sbck,' +
                'http://solr-master-test.sbb.spk-berlin.de:8995/solr/ajax-amd-areastudies,' +
                'http://solr-master-test.sbb.spk-berlin.de:8995/solr/ajax-daozang,' +
                'http://solr-master-test.sbb.spk-berlin.de:8995/solr/ajax-dunhuang,' +
                'http://solr-master-test.sbb.spk-berlin.de:8995/solr/ajax-gujin&indent=true&rows=20&',
            solrUrl2: 'http://solr-master-test.sbb.spk-berlin.de:8995/solr/ajax-loc-gaz/ajax?shards=http://solr-master-test.sbb.spk-berlin.de:8995/solr/ajax-loc-gaz,'+
                'http://solr-master-test.sbb.spk-berlin.de:8995/solr/ajax-gujin&indent=true&rows=20&'
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
        var fields = ['text','hasModel','medium','edition','person','spatial','author','title','collection', 'date','date_original','language','medium_facet','edition_facet','person_facet','spatial_facet','author_facet','title_facet','subject_facet','subject','chapter_title','date-original','journal-title', 'volume-number','publication-volume', 'page-range', 'xml_file','publication_name','publication_place','publication_volume'];
        for (var i = 0, l = fields.length; i < l; i++) {
            Manager.addWidget(new AjaxSolr.MultiSelectWidget({ //MultiSelectWidget instead of Tagcloudwidget
                id: fields[i],
                target: '#' + fields[i],
                field: fields[i],
                max_show: 10,
                max_facets: 50,
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
        $('#query').val(query);
        var queryValue = $('#query').val();
        var value = decodeURI(queryValue);
        Manager.store.addByValue('q', value);

        var params = {
            facet: true,
            'facet.field': ['hasModel','medium_facet','edition_facet', 'person_facet', 'spatial_facet' ,'author_facet', 'title_facet','collection', 'date','language','subject_facet'],
            //'facet.field': ['collection'],

            'facet.limit': 120,
            'field':'title',
            //'f.date.facet.sort':'index',
            'f.date.facet.sort':'count',
            //'facet.sort':'index',
            'facet.mincount': 1,
            'f.date.facet.limit': 80,
            'f.author_facet.facet.limit': 30,
            'f.person_facet.facet.limit': 30,
            'f.subject_facet.facet.limit': 30,
            'f.spatial_facet.facet.limit': 30,
            'json.nl': 'map',
            'fl':'title',
            'fl':['id','book_id','medium','url','format','erflink','author','creator','publication_name','publication_place','publication_volume','edition','title','position','position_vol','volume','hasModel','collection','date','publisher','series_title','description','textXXX','pageStart','pageEnd','chapter_id','language','issued','note','responsibility','extent','running_title','page','wholeDate','image_url','identifier','electronic-url','journal-title','page-range','electronic_url','chapter_title','keywords','noOfpages', 'date-original','date_original','journal-title', 'volume-number','publication-volume','title_chapter', 'xml_file'],
            'hl':true,
            'hl.fl':'text',
            //'f.text.hl.alternateField':'text',
            'hl.maxAlternateFieldLength':20,
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

    });
})(jQuery);
