var express = require('express');
var router = express.Router();
var controller = require('./sentimentController');

router
  .get('/importer', controller.importer)
  .get('/programmes', controller.all)
  .get('/programmes/:rating', controller.get)
  .get('/emotion/:num', controller.emotion)
  .post('/rating', controller.postRating)
  .get('/photo', controller.postPhoto)
  .post('/', controller.post);

module.exports = router;
