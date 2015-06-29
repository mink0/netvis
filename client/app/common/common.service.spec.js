'use strict';

describe('Service: Common', function () {

  // load the service's module
  beforeEach(module('neteyeApp'));

  // instantiate service
  var Common;
  beforeEach(inject(function (_Common_) {
    Common = _Common_;
  }));

  it('should do something', function () {
    expect(!!Common).toBe(true);
  });

});
