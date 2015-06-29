'use strict';

angular.module('neteyeApp')
  .controller('NavbarCtrl', function ($scope, $location) {
    $scope.menu = [{
      'title': 'IPdb Map',
      'link': '/'
    }, {
      'title': 'Cisco Map',
      'link': '/fullmap/index'
    }];

    $scope.isCollapsed = true;
    $scope.showSearch = true;
    if ($location.path() === '/' ) {
      $scope.showSearch = false;
    }

    $scope.isActive = function(route) {
      return route === $location.path();
    };

  });