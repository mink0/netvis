'use strict';

describe('Controller: JointCtrl', function () {

  // load the controller's module
  beforeEach(module('neteyeApp'));

  var JointCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    JointCtrl = $controller('JointCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
