var express = require('express');
var github = require("../lib/github")();
var router = express.Router();

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
  var fullRepoName = req.selectedOwner + "/" + req.selectedName;
  var model = {title: req.config.title + " - Issues for Repo " + fullRepoName, repoOwner: req.selectedOwner,
    repoName: req.selectedName, fullRepoName: fullRepoName, user: req.session.user.profile,
    repos: req.session.repos, hideClearFilter: true, debug: req.config.debug};
  req.session.repoOwner = model.repoOwner;
  req.session.repoName = model.repoName;

  github.authenticate({
    type: "oauth",
    token: req.user.accessToken
  });

  github.issues.getLabels({ user: model.repoOwner, repo: model.repoName }, function(err, res) {
    if (err) {
      // TODO: Figure out how to manage this
      console.log(err);
      return;
    }

    model.issueLabels = res;
    req.session.issueLabels = model.issueLabels;

    github.issues.repoIssues({ user: model.repoOwner, repo: model.repoName, state: 'open' }, function(err, res) {
      if (err) {
        // TODO: Figure out how to manage this
        console.log(err);
        return;
      }

      model.issues = res.map(item => {
          item.labelTags = item.labels.map(label => label.name).join(', ');
          return item;
        })
      req.session.issues = model.issues;

      if (req.query.filter) {
        console.log("filtering");
        model.issues = model.issues.filter(item => item.labelTags.indexOf(req.query.filter) !== -1);
        model.hideClearFilter = false;
      }

      if (model.debug) {
        model.debugData = [{ name: 'user', data: JSON.stringify(model.user) },
          { name: 'repos', data: JSON.stringify(model.repos)},
          { name: 'issues', data: JSON.stringify(model.issues)},
          { name: 'issueLabels', data: JSON.stringify(model.issueLabels)},
          { name: 'hideClearFilter', data: model.hideClearFilter},
          { name: 'fullRepoName', data: model.fullRepoName}];
      }

      oThis.render('issues', model);
    });
  });
});

module.exports = router;