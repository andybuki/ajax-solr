var Manager;

(function ($) {

    $(function () {
        Manager = new AjaxSolr.Manager({
            //solrUrl: 'http://10.46.3.100:8982/solr/LocGaz/select?shards=10.46.3.100:8982/solr/LocGaz,10.46.3.100:8982/solr/Xuxiu,10.46.3.100:8982/solr/airiti_nested,10.46.3.100:8982/solr/RMRB&indent=true&'
            solrUrl: 'http://10.46.3.100:8982/solr/AMD_FOChina/select?shards=10.46.3.100:8982/solr/AMD_FOChina,10.46.3.100:8982/solr/LocGaz,10.46.3.100:8982/solr/Xuxiu,10.46.3.100:8982/solr/airiti_nested,10.46.3.100:8982/solr/RMRB,10.46.3.100:8982/solr/China_Trade,10.46.3.100:8982/solr/ChinaAmericaPacific,10.46.3.100:8982/solr/MeijiJapan_small&indent=true&'
            //solrUrl: 'http://10.46.3.100:8982/solr/RMRB/'
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
        var fields = ['text','hasModel','medium','edition','person','spatial','author','title','collection', 'date','language','medium_facet','edition_facet','person_facet','spatial_facet','author_facet','title_facet'];
        for (var i = 0, l = fields.length; i < l; i++) {
            Manager.addWidget(new AjaxSolr.MultiSelectWidget({ //MultiSelectWidget instead of Tagcloudwidget
                id: fields[i],
                target: '#' + fields[i],
                field: fields[i],
                max_show: 10,
                max_facets: 1000,
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
            fields: ['title_facet','author_facet','medium','edition','person','spatial']
        }));

        Manager.init();
        Manager.store.addByValue('q', '*:*');
        var params = {
            facet: true,
            'facet.field': ['hasModel','medium_facet','edition_facet', 'person_facet', 'spatial_facet' ,'author_facet', 'title_facet','collection', 'date','language'],
            'facet.limit': 50,
            'facet.mincount': 1,
            'f.date.facet.limit': 1000,
            'f.author_facet.facet.limit': 1000,
            'f.person_facet.facet.limit': 300,
            'f.countryCodes.facet.limit': -1,
            /*'facet.date': 'date',
            'facet.date.start': '1187-02-26T00:00:00.000Z/DAY',
            'facet.date.end': '1987-10-20T00:00:00.000Z/DAY+1DAY',
            'facet.date.gap': '+1DAY',*/
            'json.nl': 'map',
            //'fq':'hasModel:Book',
            //'fl':'id,book_id,title,author,date,hits:[subquery]',
            //'hits.q':'{!terms f=book_id v=$row.book_id}',
            //'sort':'id asc',
            'hl':true,
            'hl.fl':'text', //The field for which you want highlighting snippets
            'hl.snippets': 4, //Change if you want more or less highlighting snippets
            //Also for highlighting, can optionally set these params for how you want the highlighting to look (yellow background here; Solr default is <em>...</em>):
            'hl.simple.pre': '<font style="background:#FFFF99">',
            'hl.simple.post': '</font>'/*,
        group: true,
        'group.field': 'position',
        'group.ngroups': true*/

        };

        for (var name in params) {
            Manager.store.addByValue(name, params[name]);
        }

        Manager.doRequest();
    });


})(jQuery);
