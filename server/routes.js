/**
 * Main application routes
 */

'use strict';

var errors = require('./components/errors');

module.exports = function(app) {
  // Insert routes below
  app.use('/api/fullmap', require('./api/fullmap'));
  //app.use('/api/fullmap', require('./api/fullmap.mock'));
  app.use('/api', require('./api/map'));
  app.use('/api', require('./api/ping'));
  app.use('/api', require('./api/search'));

  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|app|bower_components|assets)/*')
   .get(errors[404]);

  // All other routes should redirect to the index.html
  app.route('/*')
    .get(function(req, res) {
      res.sendfile(app.get('appPath') + '/index.html');
    });
};
