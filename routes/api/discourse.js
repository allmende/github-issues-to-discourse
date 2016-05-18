var express = require('express');
var github = require("../../lib/github")();
var githubGetComments = require("../../lib/githubGetComments");
var discourseCreateTopic = require("../../lib/discourseCreateTopic");
var Discourse = require('discourse-api');
var Promise = require('bluebird');
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

router.post('/api/discourse/status', function(req, res, next) {
  var issues = req.session.repo.issues.filter(item => req.session.repo.selectedIssues.find(sel => sel == item.number))
    .map(item => { return { number: item.number, status: item.status }});
  res.send({issues: issues});
});

router.post('/api/discourse/import', function(req, res, next) {
  var url = req.session.discourse.url;
  var username = req.session.discourse.username;
  var api_key = req.session.discourse.api_key;
  var api = new Discourse(url, api_key, username);

  // Promises
  var discourseReplyToTopic = Promise.promisify(api.replyToTopic, {context: api});
  var githubCreateComment = Promise.promisify(github.issues.createComment, {context: github});
  var githubEditIssue = Promise.promisify(github.issues.edit, {context: github});

  github.authenticate({
    type: "oauth",
    token: req.user.accessToken
  });

  var issues = req.session.repo.issues.filter(item => item.status === '').map(issue => {
    return discourseCreateTopic(req, issue).then(function(createResult) {
      issue.discourse = {topic_id: createResult.topic_id};
      issue.discourse.topic_url = (url.endsWith('/')) ? url : url + '/';
      issue.discourse.topic_url += 't/' + createResult.topic_slug + '/' + issue.discourse.topic_id;
    }).then(function () {
      return githubGetComments(req, issue);
    }).then(function (commentResult) {
      return Promise.each(commentResult, commentItem => {
        var comment_date = new Date(commentItem.created_at).toString();
        var comment_body = "<i>From @" + commentItem.user.login + " on " + comment_date + "</i><br /><br />" + commentItem.body;

        return discourseReplyToTopic(comment_body, issue.discourse.topic_id);
      });
    }).then(function () {
      // Create GitHub Comment
      var create_comment_body = "This issue was moved to " + issue.discourse.topic_url;
      var create_comment_parameters = {
        user: req.session.repo.owner,
        repo: req.session.repo.name,
        number: issue.number,
        body: create_comment_body
      };
      return githubCreateComment(create_comment_parameters);
    }).then(function (createCommentResult) {
      // Close GitHub Issue
      var edit_issue_parameters = {
        user: req.session.repo.owner,
        repo: req.session.repo.name,
        number: issue.number,
        state: 'closed'
      };
      return githubEditIssue(edit_issue_parameters);
    }).then(function (editIssueResult) {
      req.session.repo.issues = req.session.repo.issues.map(selIssue => {
        if (selIssue.number == issue.number)
          selIssue.status = 'success';
        return selIssue;
      });
      req.session.save(err => {});
    }).catch(function (e) {
      req.session.repo.issues = req.session.repo.issues.map(selIssue => {
        if (selIssue.number == issue.number)
          selIssue.status = 'error';
        return selIssue;
      });
      req.session.save(err => {});
    });
  });

  Promise.all(issues).then(function() {
    res.send({success: true});
  });
});

module.exports = router;