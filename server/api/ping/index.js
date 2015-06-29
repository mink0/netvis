'use strict';

var express = require('express');
var controller = require('./ping.controller');

var router = express.Router();

router.post('/ping', controller.index);

module.exports = router;