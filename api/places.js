var express = require('express');
var validator = require('validator');

var places = express.Router();

places.get('/', function (req, res) {
  console.log('try get places');
  places.models.Place.fetchAll({withRelated: 'author'}).then(function (places) {
    res.json(places.toJSON());
  });
});

places.post('/', function (req, res) {

});

places.get('/:id', function (req, res) {
  places.models.Place.forge({id: req.params.id}).fetch({withRelated: 'author'}).then(function (place) {
    if (place) {
      res.json(place.toJSON());
    } else {
      res.sendStatus(404);
    }
  });
});

places.put('/:id', function (req, res) {

});

places.get('/:id/comments', function (req, res) {
  var limit = req.query.limit || 100;
  var offset = req.query.offset || 0;

  places.models.Comment.forge({place_id: req.params.id}).query('limit', limit).query('offset', offset).fetchAll({withRelated: 'author'}).then(function (comments) {
    if (comments) {
      res.json(comments.toJSON());
    } else {
      res.sendStatus(400);
    }
  });
});

places.post('/:id/comments', function (req, res) {
  var text = req.body.text;
  if (!validator.isLength(text, 1)) {
    res.sendStatus(400);
    return;
  }
  places.models.Comment.forge({user_id: req.user.id, place_id: req.params.id, text: text}).save().then(function (comment) {
    if (comment) {
      res.json(comment.toJSON());
    } else {
      res.sendStatus(400);
    }
  });
});

places.post('/rate', function (req, res) {

});

module.exports = places;
