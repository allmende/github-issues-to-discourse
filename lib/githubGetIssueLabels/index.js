var config = require('../../config')(process.env.CONFIG);
var GitHubApi = require('github');
var Promise = require('bluebird');

var github = new GitHubApi(config.github_api);

module.exports = function(req) {
  var githubGetLabels = Promise.promisify(github.issues.getLabels, {context: github});

  github.authenticate({
    type: "oauth",
    token: req.user.accessToken
  });

  return githubGetLabels({ user: req.session.repo.owner, repo: req.session.repo.name }).then(function(labelResult) {
    // Store the Issue Labels and add a few properties
    var labels = labelResult.map(item => {
      item.url = '?filter=' + item.name + ((req.query.only_selected) ? '&only_selected=true' : '');
      item.selected = req.query.filter === item.name;
      return item;
    });

    labels.splice(0, 0, {
      name: '-- empty --',
      selected: req.query.no_label,
      url: '?no_label=true' + ((req.query.only_selected) ? '&only_selected=true' : '')
    });

    return labels;
  });
}