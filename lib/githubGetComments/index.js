var config = require('../../config')(process.env.CONFIG);
var GitHubApi = require('github');
var Promise = require('bluebird');

var github = new GitHubApi(config.github_api);

module.exports = function(req, issue) {
  var githubGetCommentsPromise = Promise.promisify(github.issues.getComments, {context: github});

  github.authenticate({
    type: "oauth",
    token: req.user.accessToken
  });

  var number_of_pages = Math.ceil(issue.comments / config.github_api.results_per_page);
  var promisesArrayForIssuePaging = Array.from(new Array(number_of_pages), (x, i) => i + 1);

  return Promise.mapSeries(promisesArrayForIssuePaging, page => {
    return githubGetCommentsPromise({user: req.session.repo.owner, repo: req.session.repo.name, number: issue.number, page: page});
  }).then(function (pageResults) {
    var comments = [].concat.apply([], pageResults);
    // Return the comments in order by id
    return comments.sort(function(a, b) { return a.id - b.id; });
  });
}