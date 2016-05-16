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

router.post('/api/discourse/import', function(req, res, next) {
  var category = req.body.category;
  var issue_number = req.body.issue_number;
  var url = req.session.discourse.url;
  var username = req.session.discourse.username;
  var api_key = req.session.discourse.api_key;

  // TODO: Grab GitHub Issue Data, the description and comments, store for later use.
  //var api = new Discourse(url, api_key, username);
  res.send({success: false, issue_number: issue_number});
});

module.exports = router;