var config = require('../../config')(process.env.CONFIG);
var GitHubApi = require('github');

var github = new GitHubApi(config.github_api);

module.exports = function() {
  return github;
}