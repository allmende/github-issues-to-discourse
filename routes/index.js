var config = require('../config');
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  var model = { title: config.title, debug: config.debug };

  if (req.session.user)
    model.user = req.session.user.profile;

  if (model.debug && model.user) {
    model.debugData = [{ name: 'user', data: JSON.stringify(model.user) }];
  }

  res.render('index', model);
});

module.exports = router;
