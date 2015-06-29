'use strict';

var express = require('express');
var controller = require('./map.controller');

var router = express.Router();

router.post('/links', controller.links);
//router.post('/maclinks', controller.maclinks);

module.exports = router;
