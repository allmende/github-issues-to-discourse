var express = require('express');
var github = require("../lib/github")();
var router = express.Router();

/* GET repos listing. */
router.get('/repos', function(req, res, next) {
  var oThis = res;
  var model = {
    title: req.config.title + " - Repositories",
    debug: req.config.debug
  };

  github.authenticate({
    type: "oauth",
    token: req.user.accessToken
  });

  github.repos.getAll({}, function(err, res) {
    if (err) {
      // TODO: Figure out how to manage this
      next(err);
    }

    model.repos = res.filter(item => item.open_issues_count > 0)
      .sort(function(a, b) { return b.open_issues_count - a.open_issues_count; });

    model.user = req.session.user.profile;

    var user = req.session.user.profile;
    req.session.repos = model.repos;

    if (model.debug) {
      model.debugData = [{ name: 'user', data: JSON.stringify(model.user) },
        { name: 'repos', data: JSON.stringify(model.repos)}];
    }

    oThis.render('repos', model);
  });
});

module.exports = router;