var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var validator = require('validator');
var crypto = require('crypto');
var pg = require('pg');
var uuid = require('node-uuid');
var utils = require('./utils');

var knex = require('knex')({
  client: 'pg',
  connection: 'postgres:///bergusman'
});
var bookshelf = require('bookshelf')(knex);
var models = require('./models.js')(bookshelf);

var api = express();
api.models = models;
api.use(morgan('tiny'));
api.use(bodyParser.urlencoded({ 
  extended: true
}));

api.use(function (request, response, next) {
  console.log('api: check authorization');
  if (request.headers['authorization']) {
    var token = utils.tokenFromHeader(request.headers['authorization']);
    if (token) {
      models.Token.forge({token: token}).fetch({withRelated: 'user'}).then(function (token) {
        if (token) {
          var user = token.related('user')
          if (user) {
            request.user = user.toJSON();
            next();
          } else {
            response.sendStatus(401);
          }
        } else {
          response.sendStatus(401);
        }
      });
    } else {
      response.sendStatus(401);
    }
  } else {
    next();
  }
});

var users = require('./users');
users.models = models;
api.use('/users', users);

var places = require('./places');
places.models = models;
api.use('/places', places);

api.post('/auth', function (request, response) {
  console.log('api: auth');

  var email = request.body.email;
  var password = request.body.password;

  if (!validator.isEmail(email)) {
    console.log('Invalid email');
    response.sendStatus(400);
    return;
  }
  if (validator.isNull(password)) {
    console.log('Empty password');
    response.sendStatus(400);
    return;
  }

  models.User.forge({email: email}).fetch({withRelated: 'password'}).then(function (user) {
    if (user) {
      console.log(user.toJSON());
      var hashedPassword = utils.hashPassword(password);
      var savedPassword = user.related('password').get('password');
      if (hashedPassword == savedPassword) {
        var token = utils.generateToken();
        models.Token.forge({user_id: user.get('id'), token: token}).save().then(function () {
          console.log('Save token');
          response.json({token: token, user: user.toJSON({omitPivot: true})});
        });
      } else {
        console.log("Password don't match");
        response.sendStatus(400);
      }
    } else {
      console.log("There isn't user with specified email");
      response.sendStatus(400);
    }
  });
});

module.exports = api;
