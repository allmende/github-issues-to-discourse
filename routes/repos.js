var express = require('express');
var githubGetRepos = require("../lib/githubGetRepos");
var Promise = require('bluebird');
var router = express.Router();

/* GET repos listing. */
router.get('/repos', function(req, res, next) {
  var model = {
    title: req.config.title + " - Repositories",
    user: req.session.user.profile
  };

  githubGetRepos(req).then(function (repoResult) {
    model.repos = repoResult.filter(item => item.open_issues_count > 0)
      .sort(function(a, b) { return b.open_issues_count - a.open_issues_count; });
    req.session.user.repos = model.repos;

    if (model.repos.length === 0)
      model.no_repos = true;
  }).then(function() {
    res.render('repos', model);
  }).catch(function(e) {
    res.redirect('/error');
  });;
});

module.exports = router;