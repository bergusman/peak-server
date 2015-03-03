var uuid = require('node-uuid');
var crypto = require('crypto');

module.exports = {};

module.exports.tokenFromHeader = function (header) {
  var result = header.match(/^token (\w+)$/);
  return result ? result[1] : null;
}

module.exports.hashPassword = function (password) {
  return crypto.createHmac('sha1', 'bingo').update(password).digest('hex');
}

module.exports.generateToken = function () {
  return crypto.createHmac('sha1', 'bingo').update(uuid.v4()).digest('hex');
}