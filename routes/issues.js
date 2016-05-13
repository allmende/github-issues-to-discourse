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

router.param('owner', function(req, res, next, owner) {
  var repo = req.session.repos.filter(function(item) { return item.full_name.split('/')[0] === owner; });
  if (!repo || repo.length === 0)
    return next(new Error("Owner not Found"));

  req.selectedOwner = owner;
  return next();
});

router.param('name', function(req, res, next, name) {
  var repo = req.session.repos.filter(function(item) { return item.full_name.split('/')[1] === name; });
  if (!repo || repo.length === 0)
    return next(new Error("Repo not Found"));

  req.selectedName = name;
  return next();
});

/* GET issues listing. */
router.get('/repos/:owner/:name', function(req, res, next) {
  var oThis = res;
  var selectedRepo = req.selectedOwner + "/" + req.selectedName;
  var model = {title: config.title + " - Issues for Repo " + selectedRepo, selectedRepo: selectedRepo, debug: config.debug}
  model.user = req.session.user.profile;
  model.repos = req.session.repos;
  req.session.selectedRepo = selectedRepo;

  github.authenticate({
    type: "oauth",
    token: req.user.accessToken
  });

  if (model.debug) {
    model.debugData = [{ name: 'user', data: JSON.stringify(model.user) },
      { name: 'repos', data: JSON.stringify(model.repos)},
      { name: 'selectedRepo', data: model.selectedRepo}];
  }

  res.render('issues', model);
});

module.exports = router;