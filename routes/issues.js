var express = require('express');
var github = require("../lib/github")();
var router = express.Router();

router.param('owner', function(req, res, next, owner) {
  var repo = req.session.user.repos.filter(function(item) { return item.full_name.split('/')[0] === owner; });
  if (!repo || repo.length === 0)
    return next(new Error("Owner not Found"));

  req.selectedOwner = owner;
  return next();
});

router.param('name', function(req, res, next, name) {
  var repo = req.session.user.repos.filter(function(item) { return item.full_name.split('/')[1] === name; });
  if (!repo || repo.length === 0)
    return next(new Error("Repo not Found"));

  req.selectedRepo = name;
  return next();
});

/* GET issues listing. */
router.get('/repos/:owner/:name', function(req, res, next) {
  var oThis = res;
  var fullRepoName = req.selectedOwner + "/" + req.selectedRepo;
  var model = {
    title: req.config.title + " - Open Issues for Repository " + fullRepoName,
    user: req.session.user.profile,
    fullRepoName: fullRepoName,
    hideClearFilter: true,
    debug: req.config.debug
  };

  if (!req.session.repo || req.session.repo.owner !== req.selectedOwner || req.session.repo.name !== req.selectedRepo)
    req.session.repo = { owner: req.selectedOwner, name: req.selectedRepo };

  github.authenticate({
    type: "oauth",
    token: req.user.accessToken
  });

  github.issues.getLabels({ user: req.session.repo.owner, repo: req.session.repo.name }, function(err, res) {
    if (err) {
      // TODO: Figure out how to manage this
      console.log(err);
      return;
    }

    model.issueLabels = res;
    req.session.repo.issueLabels = model.issueLabels;

    github.issues.repoIssues({ user: req.session.repo.owner, repo: req.session.repo.name, state: 'open' }, function(err, res) {
      if (err) {
        // TODO: Figure out how to manage this
        console.log(err);
        return;
      }

      model.issues = res.map(item => {
          item.labelTags = item.labels.map(label => label.name).join(', ');
          return item;
        });

      if (req.session.repo.selectedIssues)
        req.session.repo.selectedIssues.forEach(issue => {
            var selectedIssue = model.issues.find(item => item.number == issue)
            if (selectedIssue)
              selectedIssue.selected = true;
          });

      req.session.repo.issues = model.issues;

      if (req.query.filter) {
        model.issues = model.issues.filter(item => item.labelTags.indexOf(req.query.filter) !== -1);
        model.hideClearFilter = false;
      }

      if (req.query.no_label) {
        model.issues = model.issues.filter(item => item.labelTags.length === 0);
        model.hideClearFilter = false;
      }

      model.showBottomButton = model.issues.length > 10;

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