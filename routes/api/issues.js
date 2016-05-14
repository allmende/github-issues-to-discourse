var express = require('express');
var router = express.Router();

router.post('/api/issues/save', function(req, res, next) {
  var issues = req.body.issues;
  if (!req.session.repo.selectedIssues)
    req.session.repo.selectedIssues = [];

  issues.forEach(item => {
      var existingItem = req.session.repo.selectedIssues.indexOf(item.id);
      if (existingItem !== -1 && item.checked === 'false')
        req.session.repo.selectedIssues.splice(existingItem, 1);
      else if (existingItem === -1 && item.checked === 'true')
        req.session.repo.selectedIssues.push(item.id);
    });

  res.send('{success: true}');
});

module.exports = router;