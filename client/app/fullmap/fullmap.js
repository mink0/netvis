'use strict';

angular.module('neteyeApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/fullmap', {
        templateUrl: 'app/fullmap/fullmap.html',
        controller: 'JointCtrl'
      });
  });
