'use strict';

angular.module('neteyeApp')
  .factory('search', function($http, $q, n) {
    return {
      getTypeahead: getTypeahead,
      search: search
    };

    var searchGoing = false, // если typeahead приходит до результатов поиска
      searchWas = false; // если typeahead приходит после результатов поиска

    function search(string) {
      searchGoing = true;
      searchWas = true;
      var d = $q.defer();
      $http.get('/api/search', {
        params: {
          q: string,
          in : 'loc'
        }
      })
        .success(function(data) {
          searchGoing = false;
          if (!data.warning && data.length === 0) {
            data.warning = 'Ничего не найдено';
          }
          if (data.warning) {
            n.warning(data.warning);
            d.reject();
          } else {
            d.resolve({
              data: data,
              length: data.length
            });
          }
        })
        .error(function(err) {
          searchGoing = false;
          n.error('Ошибка получения данных поиска');
          d.reject();
        });
      return d.promise;
    }

    function getTypeahead(string) {
      var final = $q.defer();
      $http.get('/api/loca', {
        params: {
          q: string
        }
      })
        .success(function(data) {
          if (!searchGoing && !searchWas) {
            final.resolve(data);
          } else {
            final.reject();
            searchWas = false;
          }
        })
        .error(function(err) {
          final.reject();
          //n.warning();
        });
      return final.promise;
    }
  });