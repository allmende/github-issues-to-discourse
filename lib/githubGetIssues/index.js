var config = require('../../config')(process.env.CONFIG);
var GitHubApi = require('github');
var Promise = require('bluebird');

var github = new GitHubApi(config.github_api);

module.exports = function(req, selectedRepo) {
  var githubRepoIssues = Promise.promisify(github.issues.repoIssues, {context: github});

  github.authenticate({
    type: "oauth",
    token: req.user.accessToken
  });

  var number_of_pages = Math.ceil(selectedRepo.open_issues_count / config.github_api.results_per_page);
  var promisesArrayForIssuePaging = Array.from(new Array(number_of_pages), (x, i) => i + 1);

  return Promise.mapSeries(promisesArrayForIssuePaging, page => {
    return githubRepoIssues({
      user: req.session.repo.owner,
      repo: req.session.repo.name,
      state: 'open',
      per_page: config.github_api.results_per_page,
      page: page
    });
  }).then(function (pageResults) {
    var issues = [].concat.apply([], pageResults);
    // Store the Repo Issues and add a label tags property
    return issues.map(item => {
      item.labelTags = item.labels.map(label => label.name).join(', ');
      item.status = '';
      return item;
    });
  });
}