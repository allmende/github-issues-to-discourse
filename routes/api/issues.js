var config = require('../../config')(process.env.CONFIG);
var express = require('express');
var router = express.Router();

router.post(config.route_path + 'api/issues/bulk', function(req, res, next) {
  var issues = req.body.issues;
  var checked = req.body.is_checked;

  if (!req.session.repo.selectedIssues)
    req.session.repo.selectedIssues = [];

  issues.forEach(item => {
      var existingItem = req.session.repo.selectedIssues.indexOf(item);
      if (existingItem !== -1 && checked === 'false')
        req.session.repo.selectedIssues.splice(existingItem, 1);
      else if (existingItem === -1 && checked === 'true')
        req.session.repo.selectedIssues.push(item);
    });

  var response = {
      success: true,
      is_bulk: true,
      checked: checked,
      num_selected: req.session.repo.selectedIssues.length
    };
  res.send(response);
});

router.post(config.route_path + 'api/issues/save', function(req, res, next) {
  var number = req.body.number;
  var checked = req.body.is_checked;

  if (!req.session.repo.selectedIssues)
    req.session.repo.selectedIssues = [];

  var existingItem = req.session.repo.selectedIssues.indexOf(number);
  if (existingItem !== -1 && checked === 'false')
    req.session.repo.selectedIssues.splice(existingItem, 1);
  else if (existingItem === -1 && checked === 'true')
    req.session.repo.selectedIssues.push(number);

  var response = {
      success: true,
      is_bulk: false,
      checked: checked,
      num_selected: req.session.repo.selectedIssues.length
    };
  res.send(response);
});

module.exports = router;