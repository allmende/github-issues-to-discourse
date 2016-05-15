var express = require('express');
var router = express.Router();

router.get('/discourse', function(req, res, next) {
  var fullRepoName = req.selectedOwner + "/" + req.selectedRepo;
  var selectedRepo = req.session.user.repos.find(item => item.full_name === fullRepoName);

  var model = {
    title: req.config.title + " - Discourse Details",
    user: req.session.user.profile,
    selectedRepo: selectedRepo,
    numSelectedIssues: 0,
    zeroSelectedIssues: true,
    debug: req.config.debug
  };

  if (req.session.repo && req.session.repo.selectedIssues) {
    model.numSelectedIssues = req.session.repo.selectedIssues.length;
    model.zeroSelectedIssues = model.numSelectedIssues > 0;
  }

  res.render('discourse', model);
});

module.exports = router;