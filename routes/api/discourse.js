var express = require('express');
var github = require("../../lib/github")();
var Discourse = require('discourse-api');
var router = express.Router();

router.post('/api/discourse/check', function(req, res, next) {
  var url = req.body.url;
  var username = req.body.username;
  var api_key = req.body.api_key;

  var api = new Discourse(url, api_key, username);
  var response = api.getSync('/site.json', {}, true);

  if (response.statusCode != 200) {
    res.send({success: false});
    return;
  }

  var json = JSON.parse(response.body.toString("utf-8", 0, response.body.length));
  var categories = json.categories.filter(item => !item.parent_category_id).map(item => {
      item.subcategories = json.categories.filter(sub => sub.parent_category_id && sub.parent_category_id === item.id);
      return item;
    }).sort(function(a, b) { return a.position - b.position; });
  req.session.discourse = {url: url, username: username, api_key: api_key, categories: categories};
  res.send({success: true, categories: categories});
});

router.post('/api/discourse/import', function(req, res, next) {
  var category = req.body.category;
  var issue_number = req.body.issue_number;
  var url = req.session.discourse.url;
  var username = req.session.discourse.username;
  var api_key = req.session.discourse.api_key;

  // Create Topic at Discourse Instance
  var api = new Discourse(url, api_key, username);
  var issue = req.session.repo.issues.find(item => item.number == issue_number);
  if (!issue) {
    res.send({success: false, issue_number: issue_number});
    return;
  }

  github.authenticate({
    type: "oauth",
    token: req.user.accessToken
  });

  var issue_date = new Date(issue.created_at).toString();
  var topic_body = "<i>From @" + issue.user.login + " on " + issue_date + "</i><br /><br />"
    + issue.body + "<br /><br />" + "<i>Copied from original issue: " + issue.html_url + "</i>";
  api.createTopic(issue.title, topic_body, category, function(err, createResult) {
    if (err) {
      console.log(err);
      res.send({success: false, issue_number: issue_number});
      return;
    }

    createResult = JSON.parse(createResult);
    var topic_id = createResult.topic_id;
    var topic_url = (url.endsWith('/')) ? url : url + '/';
    topic_url += 't/' + createResult.topic_slug + '/' + topic_id;

    github.issues.getComments({user: req.session.repo.owner, repo: req.session.repo.name, number: issue_number}, function(err, commentResult) {
      if (err) {
        console.log(err);
        res.send({success: false, issue_number: issue_number});
        return;
      }

      var comments = commentResult;
      comments.forEach(item => {
        var comment_date = new Date(issue.created_at).toString();
        var comment_body = "<i>From @" + item.user.login + " on " + comment_date + "</i><br /><br />" + item.body;

        api.replyToTopic(comment_body, topic_id, function(err, replyResult) {
          if (err) {
            console.log(err);
            res.send({success: false, issue_number: issue_number});
            return;
          }
        });
      });

      // Create GitHub Comment
      var create_comment_body = "This issue was moved to " + topic_url;
      var create_comment_parameters = {user: req.session.repo.owner, repo: req.session.repo.name, number: issue_number, body: create_comment_body};
      github.issues.createComment(create_comment_parameters, function(err, createCommentResult) {
        if (err) {
          console.log(err);
          res.send({success: false, issue_number: issue_number});
          return;
        }

        // Close GitHub Issue
        var edit_issue_parameters = {user: req.session.repo.owner, repo: req.session.repo.name, number: issue_number, state: 'closed'};
        github.issues.edit(edit_issue_parameters, function(err, editIssueResult) {
          if (err) {
            console.log(err);
            res.send({success: false, issue_number: issue_number});
            return;
          }

          req.session.repo.issues = req.session.repo.issues.filter(item => item.number != issue_number);
          res.send({success: true, issue_number: issue_number});
        });
      });
    });
  });
});

module.exports = router;