'use strict';

angular.module('neteyeApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/fullmap/index', {
        templateUrl: 'app/fullmap/index/index.html',
        controller: 'FullmapIndexCtrl'
      });
  });
