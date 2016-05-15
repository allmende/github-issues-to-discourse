var express = require('express');
var Discourse = require('discourse-api');
var router = express.Router();

router.post('/api/discourse/check', function(req, res, next) {
  var url = req.body.url;
  var username = req.body.username;
  var apikey = req.body.apikey;

  var api = new Discourse(url, apikey, username);
  api.getCategories({}, function(err, body, httpCode) {
    if (httpCode !== 200) {
      res.send({success: false});
      return;
    }

    var json = JSON.parse(body);
    res.send({success: true, categories: json.category_list.categories});
  });
});

module.exports = router;