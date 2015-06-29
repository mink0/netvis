'use strict';

var _ = require('lodash');
var async = require('async');

/**
 * пингуем и возвращаем статус устройств
 */
exports.index = function(req, res, next) {
  var args = req.body.params || [];
  var ping = req.app.locals.pingClient;

  if (!_.isArray(args)) return exit('Unknown input format: ' + JSON.stringify(args));

  function exit(err, result) {
    // small output formater
    // console.log('ping > exit >', err, result);
    if (err) return next(err);
    return res.json(result);
  }

  function pingHost(ip, callback) {
    ping.pingHost(ip, function(err, target) {
      if (err) {
        //console.log(err);
        //if (!(err instanceof ping.RequestTimedOutError)) console.log(target + ': ' + err.toString());
        return callback(null, 0);
      } else {
        return callback(null, 1);
      }
    });
  }

  async.map(_.map(args, 'ip'), pingHost, function(err, res) {
    var out = {};
    for (var i=0; i<res.length; i++) {
      out[args[i].id] = res[i];
    }

    if (err) return exit(err);
    return exit(null, out);
  });
};
