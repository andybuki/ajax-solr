var Manager;

(function ($) {

  $(function () {

    Manager = new AjaxSolr.Manager({
      /*solrUrl: 'http://10.46.3.100:8980/solr/local_gazetteer/select?shards=10.46.3.100:8980/solr/airiti,10.46.3.100:8980/solr/local_gazetteer,10.46.3.100:8980/solr/AD&indent=true'*/
        /*solrUrl: 'http://10.46.3.100:8982/solr/adam_metthew/'*/
        solrUrl: 'http://10.46.3.100:8982/solr/AMD_FOChina/select?shards=10.46.3.100:8982/solr/AMD_FOChina,10.46.3.100:8982/solr/LocGaz,10.46.3.100:8982/solr/airiti,10.46.3.100:8982/solr/RMRB&indent=true&'

    });
    Manager.addWidget(new AjaxSolr.ResultWidget({
      id: 'result',
      target: '#docs',
      highlighting: true, //set to true to show contextual, highlighted snippets (from Solr highlighting); will also need to add highlighting params (below)
      no_init_results: true //set true to NOT show full result set for init query *:*
    }));
      Manager.addWidget(new AjaxSolr.PagerWidget({
          id: 'pager',
          target: '#pager',
          no_init_results: true, //set true to NOT show full result set for init query *:*, i.e. don't show paging on init
          prevLabel: '&lt;',
          nextLabel: '&gt;',
          innerWindow: 1,
          renderHeader: function (perPage, offset, total) {
              $('#pager-header').html($('<span></span>').text('displaying ' + Math.min(total, offset + 1) + ' to ' + Math.min(total, offset + perPage) + ' of ' + total));
          }
      }));
    var fields = ['text','date','hasModel','medium_facet','edition_facet','person_facet','spatial_facet','author_facet','title_facet','medium','edition','person','spatial','author','title','collection'];
      for (var i = 0, l = fields.length; i < l; i++) {
          Manager.addWidget(new AjaxSolr.MultiSelectWidget({ //MultiSelectWidget instead of Tagcloudwidget
              id: fields[i],
              target: '#' + fields[i],
              field: fields[i],
              max_show: 10,
              max_facets: 20,
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
      fields: ['title','date','author','medium','edition','person','spatial']
    }));
	
	/*Manager.addWidget(new AjaxSolr.CalendarWidget({
      id: 'calendar',
      target: '#calendar',
      field: 'date'
	  
    }));*/
	
    Manager.init();
    Manager.store.addByValue('q', '*:*');
    var params = {
     facet: true,
      'facet.field': ['hasModel','date','medium_facet','edition_facet', 'person_facet', 'spatial_facet' ,'author_facet', 'title_facet','collection'],
      'facet.limit': 20,
      'facet.mincount': 1,
      'f.topics.facet.limit': 50,
      'f.countryCodes.facet.limit': -1,
      /*'facet.date': 'date',
      'facet.date.start': '1187-02-26T00:00:00.000Z/DAY',
      'facet.date.end': '1987-10-20T00:00:00.000Z/DAY+1DAY',
      'facet.date.gap': '+1DAY',*/
      'json.nl': 'map',
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
  
  $.fn.showIf = function (condition) {
    if (condition) {
      return this.show();
    }
    else {
      return this.hide();
    }
  }

})(jQuery);
