var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  var model = {
    title: req.config.title
  };

  if (req.session.user)
    model.user = req.session.user.profile;

  res.render('index', model);
});

module.exports = router;
