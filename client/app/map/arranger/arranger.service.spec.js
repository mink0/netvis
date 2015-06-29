'use strict';

describe('Service: arranger', function () {

  // load the service's module
  beforeEach(module('neteyeApp'));

  // instantiate service
  var arranger;
  beforeEach(inject(function (_arranger_) {
    arranger = _arranger_;
  }));

  it('should do something', function () {
    expect(!!arranger).toBe(true);
  });

});
