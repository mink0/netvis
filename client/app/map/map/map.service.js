'use strict';

angular.module('neteyeApp')
  .service('map', function () {
    // AngularJS will instantiate a singleton by calling "new" on this function
    this.curPath = null;
  });
