var express = require('express');
var Discourse = require('discourse-api');
var router = express.Router();

router.post('/api/discourse/check', function(req, res, next) {
  var url = req.body.url;
  var username = req.body.username;
  var api_key = req.body.api_key;

  var api = new Discourse(url, api_key, username);
  var response = api.getSync('/site.json', {}, true);

  if (response.statusCode != 200) {
    res.send({success: false});
    return;
  }

  var json = JSON.parse(response.body.toString("utf-8", 0, response.body.length));
  var categories = json.categories.filter(item => !item.parent_category_id).map(item => {
      item.subcategories = json.categories.filter(sub => sub.parent_category_id && sub.parent_category_id === item.id);
      return item;
    }).sort(function(a, b) { return a.position - b.position; });
  req.session.discourse = {url: url, username: username, api_key: api_key, categories: categories};
  res.send({success: true, categories: categories});
});

module.exports = router;