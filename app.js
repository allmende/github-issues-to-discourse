var config = require('./config')(process.env.CONFIG);
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var GitHubStrategy = require('passport-github').Strategy;
var session = require('express-session');
var pjson = require('./package.json');
var winston = require('./lib/winston');

var app = express();
app.locals.generator = pjson.name + " - version " + pjson.version + " - " + pjson.repository.url;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({secret: config.session.secret, resave: true, saveUninitialized: true,
  cookie: { maxAge: config.session.duration * 60 * 1000 } }));
app.use(function(req, res, next) { req.config = config; next(); });

// initialize passport and restore authentication state if available
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new GitHubStrategy(
    {
      clientID: config.github_client_id,
      clientSecret: config.github_client_secret
    },
    function(accessToken, refreshToken, user, cb) {
      return cb(null, { accessToken: accessToken, profile: user } );
    }
  )
);

passport.serializeUser(function(accessToken, done) {
  done(null, accessToken);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

//OAuth authentication route
app.get(config.route_path + 'auth/github', passport.authenticate('github', { scope: ['repo'] }));
app.get(config.route_path + 'auth/github/callback', passport.authenticate('github', { failureRedirect: '/' }), require('./routes/github/callback'));

// Define the GET requests
app.get(config.route_path, require('./routes/index'));
app.get(config.route_path + 'repos', ensureAuthenticated, require('./routes/repos'));
app.get(config.route_path + 'repos/:owner/:name', ensureAuthenticated, require('./routes/issues'));
app.get(config.route_path + 'discourse', ensureAuthenticated, require('./routes/discourse'));
app.get(config.route_path + 'logout', require('./routes/logout'));

// Define the POST requests
app.post(config.route_path + 'api/issues/bulk', ensureAuthenticated, require('./routes/api/issues'));
app.post(config.route_path + 'api/issues/save', ensureAuthenticated, require('./routes/api/issues'));
app.post(config.route_path + 'api/discourse/check', ensureAuthenticated, require('./routes/api/discourse'));
app.post(config.route_path + 'api/discourse/status', ensureAuthenticated, require('./routes/api/discourse'));
app.post(config.route_path + 'api/discourse/import', ensureAuthenticated, require('./routes/api/discourse'));

function ensureAuthenticated(req,res,next){
  if(req.isAuthenticated())
    return next();
  res.redirect('/');
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    var details = {
      error: err,
      reqUrl: req.url,
      username: (req.session.user && req.session.user.profile) ? req.session.user.profile.username : '',
      repoName: (req.session.repo) ? req.session.repo.owner + '/' + req.session.repo.name : '',
      issues: (req.session.repo && req.session.repo.issues) ? req.session.repo.issues : {}
    };
    winston.error(err.message, details);

    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  var details = {
    error: err,
    reqUrl: req.url,
    username: (req.session.user && req.session.user.profile) ? req.session.user.profile.username : '',
    repoName: (req.session.repo) ? req.session.repo.owner + '/' + req.session.repo.name : '',
    issues: (req.session.repo && req.session.repo.issues) ? req.session.repo.issues : {}
  };
  winston.error(err.message, details);

  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;