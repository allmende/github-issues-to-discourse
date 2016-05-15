var express = require('express');
var router = express.Router();

router.get('/discourse', function(req, res, next) {
  var fullRepoName = req.session.repo.owner + "/" + req.session.repo.name;
  var selectedRepo = req.session.user.repos.find(item => item.full_name === fullRepoName);

  var model = {
    title: req.config.title + " - Discourse Details",
    user: req.session.user.profile,
    selectedRepo: selectedRepo,
    numSelectedIssues: 0,
    zeroSelectedIssues: true,
    discourse: req.session.discourse,
    debug: req.config.debug
  };

  if (req.session.repo && req.session.repo.selectedIssues) {
    model.numSelectedIssues = req.session.repo.selectedIssues.length;
    model.zeroSelectedIssues = model.numSelectedIssues === 0;
  }

  if (req.session.discourse && req.session.discourse.categories)
    model.discourse.hasCategories = req.session.discourse.categories.length > 0;

  model.issues = req.session.repo.issues.filter(item => req.session.repo.selectedIssues.find(sel => sel == item.number));

  res.render('discourse', model);
});

module.exports = router;