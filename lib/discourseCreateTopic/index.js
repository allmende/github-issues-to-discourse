var Discourse = require('discourse-api');
var Promise = require('bluebird');

module.exports = function(req, issue) {
  var category = req.body.category;
  var url = req.session.discourse.url;
  var username = req.session.discourse.username;
  var api_key = req.session.discourse.api_key;
  
  var api = new Discourse(url, api_key, username);
  var discourseCreateTopic = Promise.promisify(api.createTopic, {context: api});

  // Create Topic at Discourse Instance
  var issue_date = new Date(issue.created_at).toString();
  var topic_body = "<i>From @" + issue.user.login + " on " + issue_date + "</i><br /><br />"
    + issue.body + "<br /><br />" + "<i>Copied from original issue: " + issue.html_url + "</i>";

  return discourseCreateTopic(issue.title, topic_body, category).then(function (createResult) {
    return JSON.parse(createResult);
  });
}