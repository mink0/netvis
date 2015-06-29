/**
 * Main application file
 */

'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var express = require('express');
var pg = require('pg');
var snmp = require('snmp-native');
var ping = require('net-ping');
var config = require('./config/environment');

// Setup server
var app = express();
var server = require('http').createServer(app);
require('./config/express')(app);
require('./routes')(app);

// connect to PostgreSQL
console.info('> Connecting to postgres..');
var pgClient = new pg.Client('postgres://user/pass@psql.local.ru/ipdb_prod');
pgClient.connect();
app.locals.pgClient = pgClient;

// open snmp socket
console.info('> Open snmp socket..');
app.locals.snmpClient = new snmp.Session({
  community: 'getview',
  timeouts: [2500]
});

// open ping socket
console.info('> Open ping socket..');
app.locals.pingClient = ping.createSession({
  retries: 1,
  timeout: 2000
});
app.locals.pingClient.on('close', function() {
  console.error('ping socket closed!');
});

// Start server
server.listen(config.port, config.ip, function() {
  console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
});

// Expose app
exports = module.exports = app;
