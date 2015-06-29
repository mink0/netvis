'use strict';

describe('Service: mainmap', function () {

  // load the service's module
  beforeEach(module('neteyeApp'));

  // instantiate service
  var mainmap;
  beforeEach(inject(function (_mainmap_) {
    mainmap = _mainmap_;
  }));

  it('should do something', function () {
    expect(!!mainmap).toBe(true);
  });

});
