var config = require('../config');
var express = require('express');
var GitHubApi = require("github");
var router = express.Router();

var github = new GitHubApi({
  version: "3.0.0",
  protocol: "https",
  host: "api.github.com",
  pathPrefix: "",
  timeout: 5000
});

/* GET repos listing. */
router.get('/repos', function(req, res, next) {
  var oThis = res;
  var model = {title: config.title + " - Repos", debug: config.debug}

  github.authenticate({
    type: "oauth",
    token: req.user.accessToken
  });

  github.repos.getAll({}, function(err, res) {
    if (!err) {
      model.repos = res.filter(function(item) { return item.open_issues_count > 0; })
        .sort(function(a, b) {
          if (a.open_issues_count > b.open_issues_count) return -1;
          if (a.open_issues_count < b.open_issues_count) return 1;
          return 0;
        });

      model.user = req.session.user.profile;

      var user = req.session.user.profile;
      req.session.repos = model.repos;

      if (model.debug) {
        model.debugData = [{ name: 'user', data: JSON.stringify(model.user) },
          { name: 'repos', data: JSON.stringify(model.repos)}];
      }

      oThis.render('repos', model);
    } else
      oThis.redirect('/');
  });
});

module.exports = router;