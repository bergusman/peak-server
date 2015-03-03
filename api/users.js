var express = require('express');
var validator = require('validator');
var _ = require('underscore');
var utils = require('./utils');

var users = express.Router();

users.post('/', function (request, response) {
  console.log('users: signup');
  console.log(request.body);

  var email = request.body.email;
  var password = request.body.password;
  var name = request.body.name;

  if (!validator.isEmail(email)) {
    console.log('users: signup: invalid email');
    response.sendStatus(400);
    return;
  }
  if (!validator.isLength(name, 2, 1024)) {
    console.log('users: signup: invalid name');
    response.sendStatus(400);
    return;
  }
  if (!validator.isLength(password, 6)) {
    console.log('users: signup: invalid password');
    response.sendStatus(400);
    return;
  }

  var hashedPassword = utils.hashPassword(password);

  console.log(hashedPassword);

  users.models.User.forge({email: email, name: name}).save().then(function (user) {
    console.log('user: insert new user');
    console.log(hashedPassword);
    users.models.Password.forge({user_id: user.get('id'), password: hashedPassword}).save().then(function (item) {
      console.log('user: insert password');
      var token = utils.generateToken();
      users.models.Token.forge({user_id: user.get('id'), token: token}).save().then(function (item) {
        console.log('user: insert token');
        response.json({token: token, user: user.toJSON()});
      });
    });
  }).catch(function (error) {
    console.log(error);
    response.sendStatus(error.code == 23505 ? 400 : 500);
  });
});

users.use(function (request, response, next) {
  console.log('users: check user');
  if (!request.user) {
    response.sendStatus(403);
  } else {
    next();
  }
});

users.post('/password', function (request, response) {
  var oldPassword = request.body.old_password;
  var newPassword = request.body.new_password;


});

users.get('/me', function (request, response) {
  var user = request.user;
  delete user.password;
  response.json(user);
});

users.put('/me', function (request, response) {
  var email = request.body.email;
  var name = request.body.name;
  var location = request.body.location;

  if (!validator.isEmail(email)) {
    console.log('users: signup: invalid email');
    response.sendStatus(400);
    return;
  }
  if (!validator.isLength(name, 2, 1024)) {
    console.log('users: signup: invalid name');
    response.sendStatus(400);
    return;
  }
  if (!validator.isLength(location, 1, 1024)) {
    location = null;
  }

  users.models.User.forge({id: request.user.id, email: email, name: name, location: location}).save().then(function (smth) {
    response.json(smth.toJSON());
  });
});

users.delete('/me', function (request, response) {
});

users.get('/:id', function (request, response) {
  users.models.User.forge({id: request.params.id}).fetch().then(function (user) {
    if (user) {
      response.json(user.toJSON());
    } else {
      response.sendStatus(404);
    }
  });
});

users.get('/:id/places', function (request, response) {
  var limit = request.query.limit || 100;
  var offset = request.query.offset || 0;
  users.models.User.forge({id: request.user.id}).places().query('limit', limit).query('offset', offset).fetch({withRelated: 'author'}).then(function (places) {
    response.json(places.toJSON());
  });
});

users.get('/:id/favorites', function (request, response) {
  var limit = request.query.limit || 100;
  var offset = request.query.offset || 0;
  users.models.User.forge({id: request.user.id}).favorites().query('limit', limit).query('offset', offset).fetch({withRelated: 'author'}).then(function (places) {
    response.json(places.toJSON());
  });
});

users.get('/:id/comments', function (request, response) {
  var limit = request.query.limit || 100;
  var offset = request.query.offset || 0;
  users.models.User.forge({id: request.user.id}).comments().query('limit', limit).query('offset', offset).fetch({withRelated: ['place', 'place.author']}).then(function (comments) {
    response.json(comments.toJSON());
  });
});

module.exports = users;
