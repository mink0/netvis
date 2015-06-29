'use strict';

angular.module('neteyeApp')
  .controller('MainCtrl', function($scope, $location, search, map, common, n) {
    //FIXME: lazy dirty unresponsible hack :)))
    $('.site-wrapper').css({
      'padding-top': ($(window).height() - $('.site-wrapper').height()) / 2 - 35,
      'padding-bottom': ($(window).height() - $('.site-wrapper').height()) / 2,
      'top': '0'
    });

    $scope.search = {
      val: '',
      hint: ''
    };

    $scope.curPath = map.curPath;

    // common.get('loca').then(function(data) {
    //   $scope.search.options = data;
    // });

    $scope.submitSearch = function(item, model, label) {
      if (!$scope.search.val) {
        $scope.search.hint = 'Уточните поисковый запрос!';
        return;
      }

      $location.path('/map');
      $location.search('loc', $scope.search.val);
    };

    // $scope.onSearchEdit = function(str) {
    //   var minLen = 2;

    //   if (str.length < minLen) {
    //     $scope.search.hint = 'Введите еще ' + (minLen - str.length) + ' для начала поиска';
    //     return;
    //   }

    //   $scope.search.hint = '';
    //   common.get('loca', {q: str}).then(function(data) {
    //     $scope.search.options = data;
    //   });
    // };

    $scope.getTypeahead = function(text) {
      return search.getTypeahead(text);
    };

    // $scope.dosearch = function() {
    //   if (!$scope.search.val) return;

    //   search.search($scope.search.val).then(function(data) {
    //     console.log(data);
    //     drawmap(data.data.loc[0].locObjId);
    //   });
    // };
  });