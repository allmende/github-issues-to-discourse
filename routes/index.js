var config = require('../config')(process.env.CONFIG);
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get(config.route_path, function(req, res, next) {
  var model = {
    title: req.config.title,
    base_url: req.config.web_path
  };

  if (req.session.user)
    model.user = req.session.user.profile;

  res.render('index', model);
});

module.exports = router;
