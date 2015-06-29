'use strict';

angular.module('neteyeApp')
  .service('common', function common($http, $q) {
    var GLOBAL_ERR = 'Ошибка выполнения запроса. Попробуйте позже.';
    this.get = function get(args, args2) {
      // /api/get requests

      var fname, params;
      if (typeof args === 'object') {
        // API v1-1: {fname: 'if_delete', args: {...}}
        fname = Object.keys(args)[0];
        params = args[fname];
      } else {
        // API v1-2: 'if_delete', {eqLabel: 'dsd'}
        fname = args;
        params = args2;
      }

      var d = $q.defer();
      $http.get('/api/' + fname, {
        params: params
      })
        .success(function(data) {
          if (data.hasOwnProperty('warn')) {
            d.reject(data.warn);
          } else {
            d.resolve(data);
          }
        })
        .error(function(err) {
          d.reject(GLOBAL_ERR);
        });
      return d.promise;
    };

    this.post = function post(args, args2) {
      // /api/post requests

      var fname, params;
      if (typeof args === 'object') {
        // API v1-1: {fname: 'if_delete', args: {...}}
        fname = Object.keys(args)[0];
        params = args[fname];
      } else {
        // API v1-2: 'if_delete', {eqLabel: 'dsd'}
        fname = args;
        params = args2;
      }

      var d = $q.defer();
      $http.post('/api/' + fname, {
        params: params
      })
        .success(function(data) {
          if (data.hasOwnProperty('warn')) {
            d.reject(data.warn);
          } else {
            d.resolve(data);
          }
        })
        .error(function(err) {
          d.reject(GLOBAL_ERR);
        });
      return d.promise;
    };
});

angular.module('neteyeApp').value('joint', joint);

angular.module('neteyeApp').factory('n', function(toaster, $log) {
  // var options = {
  //   'closeButton': false,
  //   'debug': false,
  //   'positionClass': 'toast-bottom-right',
  //   'onclick': null,
  //   'showDuration': '300',
  //   'hideDuration': '1000',
  //   'timeOut': '5000',
  //   'extendedTimeOut': '1000'
  // };

  return {
    info: function(msg) {
      toaster.pop('info','', msg);
      $log.info(msg);
    },
    error: function(msg) {
      var msg = msg || 'Ошибка загрузки данных';
      toaster.pop('error','', msg);
      $log.error(msg);
    },
    success: function(msg) {
      toaster.pop('success','', msg);
      $log.log(msg);
    },
    warning: function(msg) {
      var msg = msg || 'Ошибка загрузки данных';
      toaster.pop('warning','', msg);
      $log.warn(msg);
    },
    clear: function() {
      toaster.clear();
    },
    d: function(msg) {
      var obj = msg;
      if (typeof msg !== 'string') {
        msg = JSON.stringify(msg);
      }
      toaster.pop('info','', msg);
      $log.debug(obj);
    },
    clearLast: function() {
      // TODO
    }
  };
});
