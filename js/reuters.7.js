var Manager;

(function ($) {

  $(function () {
    Manager = new AjaxSolr.Manager({
      /*solrUrl: 'http://10.46.3.100:8980/solr/local_gazetteer/select?shards=10.46.3.100:8980/solr/airiti,10.46.3.100:8980/solr/local_gazetteer,10.46.3.100:8980/solr/AD&indent=true'*/
	  /*solrUrl: 'http://10.46.3.100:8980/solr/local_gazetteer/'*/
	  solrUrl: 'http://10.46.3.100:8980/solr/AD/select?shards=10.46.3.100:8980/solr/AD,10.46.3.100:8980/solr/airiti,10.46.3.100:8980/solr/local_gazetteer&indent=true'
	  
    });
    Manager.addWidget(new AjaxSolr.ResultWidget({
      id: 'result',
      target: '#docs'
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
    var fields = [ 'text', 'title', 'author', 'keywords', 'person', 'spatial','date','hasModel', 'medium','edition' ];
    for (var i = 0, l = fields.length; i < l; i++) {
      Manager.addWidget(new AjaxSolr.TagcloudWidget({
        id: fields[i],
        target: '#' + fields[i],
        field: fields[i]
      }));
    }
    Manager.addWidget(new AjaxSolr.CurrentSearchWidget({
      id: 'currentsearch',
      target: '#selection'
    }));
    
	Manager.addWidget(new AjaxSolr.AutocompleteWidget({
      id: 'text',
      target: '#search',
      fields: [ 'title', 'author','date' ]
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
      'facet.field': ['title',  'author', 'hasModel','date','medium','spatial','edition' ],
      'facet.limit': 20,
      'facet.mincount': 1,
      'f.topics.facet.limit': 50,
      'f.countryCodes.facet.limit': -1,
      'facet.date': 'date',
      'facet.date.start': '1187-02-26T00:00:00.000Z/DAY',
      'facet.date.end': '1987-10-20T00:00:00.000Z/DAY+1DAY',
      'facet.date.gap': '+1DAY',
      'json.nl': 'map',
	  'sort':'id asc'
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
