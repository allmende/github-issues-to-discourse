var config = require('../../config')(process.env.CONFIG);
var GitHubApi = require('github');
var Promise = require('bluebird');

var github = new GitHubApi(config.github_api);

function promiseWhile(predicate, action, value) {
  return Promise.resolve(value).then(predicate).then(function(condition) {
    if (condition)
      return promiseWhile(predicate, action, action());
  });
}

module.exports = function(req) {
  var githubGetAllReposPromise = Promise.promisify(github.repos.getAll, {context: github});

  github.authenticate({
    type: "oauth",
    token: req.user.accessToken
  });

  var moreResults = true;
  var repos = [];
  var page = 1;

  return promiseWhile(function() {
    return moreResults;
  }, function() {
    return githubGetAllReposPromise({page: page, per_page: config.github_api.results_per_page})
      .then(function (result) {
        moreResults = result.length === config.github_api.results_per_page;
        repos.push(result);
        page++;
        return result;
      });
  }).then(function(res) {
    repos = [].concat.apply([], repos); // flatten the array
    return repos;
  });
}