var express = require('express');
var config = require('../config')(process.env.CONFIG);
var githubGetIssues = require("../lib/githubGetIssues");
var githubGetIssueLabels = require("../lib/githubGetIssueLabels");
var router = express.Router();
var winston = require('winston');

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
router.get(config.route_path + 'repos/:owner/:name', function(req, res, next) {
  var fullRepoName = req.selectedOwner + "/" + req.selectedRepo;
  var selectedRepo = req.session.user.repos.find(item => item.full_name === fullRepoName);
  var model = {
    title: req.config.title + " - Open Issues for Repository " + fullRepoName,
    base_url: req.config.web_path,
    user: req.session.user.profile,
    selectedRepo: selectedRepo,
    selectedFilter: '',
    numSelectedIssues: 0,
    hideClearFilter: true,
    showSelectedButton: true,
    showSelectedUrl: req.config.web_path + 'repos/' + fullRepoName,
    clearFilterUrl: req.config.web_path + 'repos/' + fullRepoName
  };

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
    req.session.repo = { owner: req.selectedOwner, name: req.selectedRepo, selectedIssues: [] };

  githubGetIssueLabels(req).then(function(labels) {
    model.issueLabels = labels;
    req.session.repo.issueLabels = model.issueLabels;
  }).then(function() {
    return githubGetIssues(req, selectedRepo);
  }).then(function (issues) {
    model.issues = issues;
    model.numTotalIssues = model.issues.length;

    // Clean up Selected Issues
    req.session.repo.selectedIssues = req.session.repo.selectedIssues.filter(item => {
      return req.session.repo.issues.find(issue => issue.number == item && issue.status !== 'success');
    });

    model.numSelectedIssues = req.session.repo.selectedIssues.length;

    // Check to see if any issues have been selected and set their selected state
    req.session.repo.selectedIssues.forEach(issue => {
      var selectedIssue = model.issues.find(item => item.number == issue)
      if (selectedIssue)
        selectedIssue.selected = true;
    });

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
    
    model.allItemsSelected = model.issues.filter(item => !item.selected).length === 0;
    model.showBottomButton = model.issues.length > 10;
    res.render('issues', model);
  }).catch(function (error) {
    var details = {
      reqUrl: req.url,
      username: (req.session.user && req.session.user.profile) ? req.session.user.profile.username : '',
      repoName: fullRepoName,
      issues: (req.session.repo && req.session.repo.issues) ? req.session.repo.issues : {},
      error: error
    };
    winston.error('Unable to access GitHub Issues for %s', fullRepoName, details);
    res.render('error', {message: "Unable to access GitHub Issues", error: {status: 500}});
  });
});

module.exports = router;