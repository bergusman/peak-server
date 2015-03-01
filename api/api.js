var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var validator = require('validator');
var crypto = require('crypto');
var pg = require('pg');
var uuid = require('node-uuid');
var users = require('./users');
var places = require('./places');
var api = express();

console.log(process.env.DATABASE_URL);

api.use(morgan('tiny'));

api.use(bodyParser.urlencoded({ 
  extended: true
}));

api.use(function (request, response, next) {
  console.log('api: check authorization');
  if (request.headers['authorization']) {
    var token;
    var result = request.headers['authorization'].match(/^token (\w+)$/);
    if (result) {
      token = result[1];
    } else {
      response.sendStatus(401);
      return;
    }

    pg.connect(process.env.DATABASE_URL, function (error, client, done) {
      client.query('SELECT * FROM tokens JOIN users ON tokens.user_id = users.id WHERE tokens.token = $1', [token], function (error, result) {
        if (result.rows.length > 0) {
          request.user = result.rows[0];
          next();
        } else {
          response.sendStatus(401);
        }
      });
    });
  } else {
    next();
  }
});

api.use('/users', users);
api.use('/places', places);

api.post('/auth', function (request, response) {
  console.log(request.body);

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

  pg.connect(process.env.DATABASE_URL, function (error, client, done) {
    client.query('SELECT * FROM users WHERE email = $1', [email], function (error, result) {
      if (result.rows.length > 0) {
        var user = result.rows[0];
        var hashedPassword = crypto.createHmac('sha1', 'bingo').update(password).digest('hex');
        if (user.password === hashedPassword) {
          var token = crypto.createHmac('sha1', '').update(uuid.v4()).digest('hex');
          client.query('INSERT INTO tokens (user_id, token) VALUES ($1, $2)', [user.id, token], function (error, result) {
            console.log(error);
            done();
            response.json({token: token, user: user});
          });
        } else {
          done();
          console.log("Password don't match");
          response.sendStatus(400);
        }
      } else {
        done();
        console.log("There isn't user with specified email");
        response.sendStatus(400);
      }
    });
  });
});

module.exports = api;
