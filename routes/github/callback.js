var express = require('express');
var router = express.Router();

router.get('/auth/github/callback', function(req, res, next) {
  req.session.user = req.user;
  res.redirect('/repos');
});

module.exports = router;