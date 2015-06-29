'use strict';

describe('Controller: FullmapCtrl', function () {

  // load the controller's module
  beforeEach(module('neteyeApp'));

  var FullmapCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    FullmapCtrl = $controller('FullmapCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
