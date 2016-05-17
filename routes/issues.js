var express = require('express');
var github = require("../lib/github")();
var Promise = require('bluebird');
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
  var fullRepoName = req.selectedOwner + "/" + req.selectedRepo;
  var selectedRepo = req.session.user.repos.find(item => item.full_name === fullRepoName);
  var model = {
    title: req.config.title + " - Open Issues for Repository " + fullRepoName,
    user: req.session.user.profile,
    selectedRepo: selectedRepo,
    selectedFilter: '',
    numTotalIssues: selectedRepo.open_issues_count,
    numSelectedIssues: 0,
    hideClearFilter: true,
    showSelectedButton: true,
    showSelectedUrl: '/repos/' + fullRepoName,
    clearFilterUrl: '/repos/' + fullRepoName
  };

  // Promises
  var githubGetLabels = Promise.promisify(github.issues.getLabels, {context: github});
  var githubRepoIssues = Promise.promisify(github.issues.repoIssues, {context: github});

  // Build the Clear Filter/Show Selected URLs
  if (req.query.filter && req.query.only_selected) {
    model.showSelectedUrl += '?filter=' + req.query.filter;
    model.clearFilterUrl += '?only_selected=true';
  } else if (req.query.no_label && req.query.only_selected) {
    model.showSelectedUrl += '?no_label=true';
    model.clearFilterUrl += '?only_selected=true';
  } else if (req.query.filter)
    model.showSelectedUrl += '?filter=' + req.query.filter + '&only_selected=true';
  else if (req.query.no_label)
    model.showSelectedUrl += '?no_label=true' + '&only_selected=true';
  else if (!req.query.only_selected)
    model.showSelectedUrl += '?only_selected=true';

  // Store the Repo Information in Session, reset it if the repo changes
  if (!req.session.repo || req.session.repo.owner !== req.selectedOwner || req.session.repo.name !== req.selectedRepo)
    req.session.repo = { owner: req.selectedOwner, name: req.selectedRepo };

  github.authenticate({
    type: "oauth",
    token: req.user.accessToken
  });

  githubGetLabels({ user: req.session.repo.owner, repo: req.session.repo.name }).then(function(labelResult) {
    // Store the Issue Labels and add a few properties
    model.issueLabels = labelResult.map(item => {
      item.url = '?filter=' + item.name + ((req.query.only_selected) ? '&only_selected=true' : '');
      item.selected = req.query.filter === item.name;
      return item;
    });

    // Add an empty item to the Issue Labels
    model.issueLabels.splice(0, 0, {
      name: '-- empty --',
      selected: req.query.no_label,
      url: '?no_label=true' + ((req.query.only_selected) ? '&only_selected=true' : '')
    });
    req.session.repo.issueLabels = model.issueLabels;
  }).then(function() {
    return githubRepoIssues({user: req.session.repo.owner, repo: req.session.repo.name, state: 'open'});
  }).then(function(issueResult) {
    // Store the Repo Issues and add a label tags property
    model.issues = issueResult.map(item => {
      item.labelTags = item.labels.map(label => label.name).join(', ');
      item.status = '';
      return item;
    });

    // Check to see if any issues have been selected and set their selected state
    if (req.session.repo.selectedIssues) {
      model.numSelectedIssues = req.session.repo.selectedIssues.length;
      req.session.repo.selectedIssues.forEach(issue => {
        var selectedIssue = model.issues.find(item => item.number == issue)
        if (selectedIssue)
          selectedIssue.selected = true;
      });
    }

    req.session.repo.issues = model.issues;

    // Apply the Label Filter
    if (req.query.filter) {
      model.issues = model.issues.filter(item => item.labelTags.indexOf(req.query.filter) !== -1);
      model.hideClearFilter = false;
    }

    // Apply the Label is Empty Filter
    if (req.query.no_label) {
      model.issues = model.issues.filter(item => item.labelTags.length === 0);
      model.hideClearFilter = false;
    }

    // Filter out un-selected items
    if (req.query.only_selected) {
      model.issues = model.issues.filter(item => item.selected);
      model.showSelectedButton = false;
    }

    model.showBottomButton = model.issues.length > 10;
    res.render('issues', model);
  }).catch(function(e) {
    res.redirect('/error');
  });
});

module.exports = router;