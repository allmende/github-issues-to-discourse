var config = require('../../config')(process.env.CONFIG);
var express = require('express');
var router = express.Router();

router.get(config.route_path + 'auth/github/callback', function(req, res, next) {
  req.session.user = req.user;
  res.redirect(req.config.web_path + 'repos');
});

module.exports = router;