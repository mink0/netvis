'use strict';

angular.module('neteyeApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/search', {
        redirectTo: '/'
      })
      .when('/', {
        templateUrl: 'app/main/main.html',
        controller: 'MainCtrl'
      });
  });