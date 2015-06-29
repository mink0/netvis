'use strict';

describe('Service: shapes', function () {

  // load the service's module
  beforeEach(module('neteyeApp'));

  // instantiate service
  var shapes;
  beforeEach(inject(function (_shapes_) {
    shapes = _shapes_;
  }));

  it('should do something', function () {
    expect(!!shapes).toBe(true);
  });

});
