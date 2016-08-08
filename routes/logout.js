var config = require('../config')(process.env.CONFIG);
var express = require('express');
var router = express.Router();

router.get(config.route_path + 'logout', function(req, res, next) {
  req.session.destroy();
  req.logout();
  res.redirect(req.config.web_path);
});

module.exports = router;