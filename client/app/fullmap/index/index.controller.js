'use strict';

angular.module('neteyeApp').controller('FullmapIndexCtrl', function ($scope, $location, n) {
  $scope.search = {
    name: 'cc-kvi',
    comm: '',
    hint: 'Выберите точку входа (шлюз Cisco)'
  };

  //FIXME: lazy dirty unresponsible hack :)))
  $('.site-wrapper-full').css({
    'padding-top': ($(window).height() - $('.site-wrapper-full').height()) / 2 - 50,
    'padding-bottom': ($(window).height() - $('.site-wrapper-full').height()) / 2 - 11,
    'top': '0'
  });

  $scope.submit = function() {
    if (!$scope.search.name) {
      $scope.search.hint = 'Необходимо выбрать точку входа';
      return;
    }

    $location.path('/fullmap');
    $location.search('name', $scope.search.name);
    $location.search('comm', $scope.search.comm);
  }

});
