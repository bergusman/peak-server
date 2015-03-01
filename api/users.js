var express = require('express');
var validator = require('validator');
var crypto = require('crypto');
var uuid = require('node-uuid');
var pg = require('pg');
var _ = require('underscore');
var users = express.Router();

users.post('/', function (request, response) {
  var email = request.body.email;
  var password = request.body.password;
  var name = request.body.name;

  if (!validator.isEmail(email)) {
    response.sendStatus(400);
  }
  if (name.length < 2) {
    response.sendStatus(400);
  }
  if (password.length < 6) {
    response.sendStatus(400);
  }

  var hashedPassword = crypto.createHmac('sha1', 'bingo').update(password).digest('hex');

  pg.connect(process.env.DATABASE_URL, function(error, client, done) {
    if (error) {
      response.sendStatus(500);
    }

    client.query('INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING *', [email, hashedPassword, name], function(error, result) {
      if (error) {
        done();
        if (error.code == 23505) {
          response.sendStatus(400);
        } else {
          response.sendStatus(500);
        }
        return;
      } else {
        var user = result.rows[0];
        var token = crypto.createHmac('sha1', '').update(uuid.v4()).digest('hex');

        client.query('INSERT INTO tokens (user_id, token) VALUES ($1, $2)', [user.id, token], function (error, result) {
          done();
          delete user.password;
          response.json({token: token, user: user});
        });
      }
    });
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

users.get('/me', function (request, response) {
  var user = request.user;
  delete user.password;
  response.json(user);
});

users.get('/:id', function (request, response) {
  pg.connect(process.env.DATABASE_URL, function(error, client, done) {
    client.query('SELECT * FROM users WHERE id = $1', [request.params.id], function (error, result) {
      if (result.rows.length > 0) {
        var user = result.rows[0];
        delete user.password;
        response.json(user);
      } else {
        response.sendStatus(404);
      }
    });
  });
});

users.put('/:id', function (request, response) {

});

users.delete('/:id', function (request, response) {
  pg.connect(process.env.DATABASE_URL, function(error, client, done) {
    client.query('DELETE FROM users WHERE id = $1', [request.params.id], function (error, result) {
      response.sendStatus(200);
    });
  });
});

users.get('/me/places', function (request, response) {
  var limit = request.query.limit || 100;
  var offset = request.query.offset || 0;

  pg.connect(process.env.DATABASE_URL, function(error, client, done) {
    client.query('select * from places where user_id = $1 limit $2 offset $3', [request.user.id, limit, offset], function (error, result) {
      done();
      _.each(result.rows, function (row) {
        row.user = request.user;
      });
      response.json(result.rows);
    });
  });
});

users.get('/me/comments', function (request, response) {
  var limit = request.query.limit || 100;
  var offset = request.query.offset || 0;

  pg.connect(process.env.DATABASE_URL, function(error, client, done) {
    client.query('select * from comments where user_id = $1 limit $2 offset $3', [request.user.id, limit, offset], function (error, result) {
      done();
      _.each(result.rows, function (row) {
        row.user = request.user;
      });
      response.json(result.rows);
    });
  });
});

users.get('/:id/places', function (request, response) {
  var limit = request.query.limit || 100;
  var offset = request.query.offset || 0;

  pg.connect(process.env.DATABASE_URL, function(error, client, done) {
    client.query('select * from users where user_id = $1', [request.params.id], function (error, result) {
      if (result.rows.length > 0) {
        var user = result.rows[0];
        client.query('select * from places where user_id = $1 limit $2 offset $3', [user.id, limit, offset], function (error, result) {
          done();
          _.each(result.rows, function (row) {
            row.user = user;
          });
          response.json(result.rows);
        });
      } else {
        done();
        response.sendStatus(400);
      }
    });
  });
});

users.get('/:id/comments', function (request, response) {
  var limit = request.query.limit || 100;
  var offset = request.query.offset || 0;

  pg.connect(process.env.DATABASE_URL, function(error, client, done) {
    client.query('select * from users where user_id = $1', [request.params.id], function (error, result) {
      if (result.rows.length > 0) {
        var user = result.rows[0];
        client.query('select * from comments where user_id = $1 limit $2 offset $3', [user.id, limit, offset], function (error, result) {
          done();
          _.each(result.rows, function (row) {
            row.user = user;
          });
          response.json(result.rows);
        });
      } else {
        done();
        response.sendStatus(400);
      }
    });
  });
});

module.exports = users;
