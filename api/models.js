module.exports = function (bookshelf) {
  var User;
  var Token;
  var Place;
  var Comment;

  User = bookshelf.Model.extend({
    tableName: 'users',
    password: function () {
      return this.hasOne(Password);
    },
    tokens: function () {
      return this.hasMany(Token);
    },
    places: function () {
      return this.hasMany(Place);
    },
    favorites: function () {
      return this.belongsToMany(Place).through(Favorite);
    },
    comments: function () {
      return this.hasMany(Comment)
    },
    parse: function (attrs) {
      console.log('BINGO');
      return attrs;
    }
  });

  Password = bookshelf.Model.extend({
    tableName: 'passwords',
    user: function () {
      return this.belongsTo(User);
    }
  }); 

  Token = bookshelf.Model.extend({
    tableName: 'tokens',
    user: function () {
      return this.belongsTo(User);
    }
  });

  Favorite = bookshelf.Model.extend({
    tableName: 'favorites',
    user: function () {
      return this.belongsTo(User);
    },
    place: function () {
      return this.belongsTo(Place);
    }
  });

  Place = bookshelf.Model.extend({
    tableName: 'places',
    author: function () {
      return this.belongsTo(User);
    },
    comments: function () {
      return this.hasMany(Comment);
    }
  });

  Rate = bookshelf.Model.extend({
    tableName: 'rates',
    user: function () {
      return this.belongsTo(User);
    },
    place: function () {
      return this.belongsTo(Place);
    }
  });

  Comment = bookshelf.Model.extend({
    tableName: 'comments',
    author: function () {
      return this.belongsTo(User);
    },
    place: function () {
      return this.belongsTo(Place);
    }
  });

  return {
    User: User,
    Password: Password,
    Token: Token,
    Favorite: Favorite,
    Place: Place,
    Comment: Comment
  };
}