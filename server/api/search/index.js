'use strict';

var express = require('express');
var controller = require('./search.controller');

var router = express.Router();

//router.get('/', controller.index);
router.get('/type_ahead', controller.type_ahead);
router.get('/search', controller.search);
router.get('/tree', controller.tree);
router.get('/loca', controller.loca);
router.get('/get_path', controller.getPath);

module.exports = router;