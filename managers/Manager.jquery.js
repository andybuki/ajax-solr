(function(callback) {
  if (typeof define === 'function' && define.amd) {
    define(['core/AbstractManager'], callback);
  } else {
    callback();
  }
}(function() {

  /**
   * @see http://wiki.apache.org/solr/SolJSON#JSON_specific_parameters
   * @class Manager
   * @augments AjaxSolr.AbstractManager
   */
  AjaxSolr.Manager = AjaxSolr.AbstractManager.extend(
      /** @lends AjaxSolr.Manager.prototype */
      {
        executeRequest: function(servlet, string, handler, errorHandler, disableJsonp) {
          var self = this,
              options = {
                dataType: 'json'
              };
          string = string || this.store.string();
          var short_string = string;

          handler = handler || function(data) {
            self.handleResponse(data);
          };
          errorHandler = errorHandler || function(jqXHR, textStatus, errorThrown) {
            self.handleError(textStatus + ', ' + errorThrown);
          };
          if (this.proxyUrl) {
            options.url = this.proxyUrl;
            options.data = {
              query: string
            };
            options.type = 'POST';
          } else {
            if (string.includes("q=") && (string.includes("query=")) && (!string.includes("q=*%3A*"))) {
              var author = this.response.facet_counts.facet_fields.author_facet;
              var spatial = this.response.facet_counts.facet_fields.spatial_facet;
              var person = this.response.facet_counts.facet_fields.person_facet;
              var subject = this.response.facet_counts.facet_fields.subject_facet;
              var edition = this.response.facet_counts.facet_fields.edition_facet;
              var dateF = this.response.facet_counts.facet_fields.date;
              var title = this.response.facet_counts.facet_fields.title_facet;
              var languageF = this.response.facet_counts.facet_fields.language;

              var a = document.getElementById('author_facet');
              var su = document.getElementById('subject_facet');
              var sp = document.getElementById('spatial_facet');
              var p = document.getElementById('person_facet');
              var e = document.getElementById('edition_facet');
              var d = document.getElementById('date');
              var t = document.getElementById('title_facet');

              if (spatial !== undefined | null) {
                if (Object.entries(spatial).length === 0) {
                  document.getElementById("spatialHide").style.display = "none";
                } else {
                  document.getElementById("spatialHide").style.display = "block";
                }
              }

              if (person !== undefined | null) {
                if (Object.entries(person).length === 0) {
                  document.getElementById("personHide").style.display = "none";
                }  else {
                  document.getElementById("personHide").style.display = "block";
                }
              }

              if (author !== undefined | null) {
                if (Object.entries(author).length === 0) {
                  document.getElementById("authorHide").style.display = "none";
                } else {
                  document.getElementById("authorHide").style.display = "block";
                }
              }

              if (edition !== undefined | null) {
                if (Object.entries(edition).length === 0) {
                  document.getElementById("editionHide").style.display = "none";
                } else {
                  document.getElementById("editionHide").style.display = "block";
                }
              }

              if (dateF !== undefined | null) {
                if (Object.entries(dateF).length === 0) {
                  document.getElementById("dateHide").style.display = "none";
                } else {
                  document.getElementById("dateHide").style.display = "block";
                }
              }
              if (title !== undefined | null) {
                if (Object.entries(title).length === 0) {
                  document.getElementById("titleHide").style.display = "none";
                } else {
                  document.getElementById("titleHide").style.display = "block";
                }
              }

              if (Object.entries(languageF).length === 0) {
                document.getElementById("languageHide").style.display = "none";
              } else {
                document.getElementById("languageHide").style.display = "block";
              }

              if (subject !== undefined | null) {
                if (Object.entries(subject).length === 0) {
                  document.getElementById("subjectHide").style.display = "none";
                } else {
                  document.getElementById("subjectHide").style.display = "block";
                }
              }

              options.url = this.solrUrl + servlet + '?' + string + '&wt=json' + (disableJsonp ? '' : '&json.wrf=?');
            } else if (!string.includes("q=")) {
              document.getElementById("spatialHide").style.display = "none";
              document.getElementById("personHide").style.display = "none";
              document.getElementById("authorHide").style.display = "none";
              document.getElementById("editionHide").style.display = "none";
              document.getElementById("dateHide").style.display = "none";
              document.getElementById("titleHide").style.display = "none";

              short_string = short_string.
              replace("facet.field=medium_facet&facet.field=edition_facet&facet.field=person_facet&facet.field=spatial_facet&facet.field=author_facet&facet.field=title_facet&", "").
              replace("facet.field=date&", "").
              replace("facet.field=subject_facet&", "");
              options.url = this.solrUrl + servlet + '?' + short_string + '&wt=json' + (disableJsonp ? '' : '&json.wrf=?');
            } else if (string.includes("query=")) {
              document.getElementById("spatialHide").style.display = "none";
              document.getElementById("personHide").style.display = "none";
              document.getElementById("authorHide").style.display = "none";
              document.getElementById("editionHide").style.display = "none";
              document.getElementById("dateHide").style.display = "none";
              document.getElementById("titleHide").style.display = "none";
              //document.getElementById("subjectHide").style.display = "none";
              short_string = short_string.
              replace("facet.field=medium_facet&facet.field=edition_facet&facet.field=person_facet&facet.field=spatial_facet&facet.field=author_facet&facet.field=title_facet&", "").
              replace("facet.field=date&", "").
              replace("facet.field=subject_facet&", "");
              options.url = this.solrUrl + servlet + '?' + short_string + '&wt=json' + (disableJsonp ? '' : '&json.wrf=?');
            } else if (string.includes("q=*%3A*")) {
              document.getElementById("spatialHide").style.display = "none";
              document.getElementById("personHide").style.display = "none";
              document.getElementById("authorHide").style.display = "none";
              document.getElementById("editionHide").style.display = "none";
              document.getElementById("dateHide").style.display = "none";
              document.getElementById("titleHide").style.display = "none";

              short_string = short_string.
              replace("facet.field=medium_facet&facet.field=edition_facet&facet.field=person_facet&facet.field=spatial_facet&facet.field=author_facet&facet.field=title_facet&", "").
              replace("facet.field=date&", "").
              replace("facet.field=subject_facet&", "");
              options.url = this.solrUrl + servlet + '?' + short_string + '&wt=json' + (disableJsonp ? '' : '&json.wrf=?');
            } else {
              options.url = this.solrUrl + servlet + '?' + string + '&wt=json' + (disableJsonp ? '' : '&json.wrf=?');
            }

          }
          jQuery.ajax(options).done(handler).fail(errorHandler);
        }
      });

}));
