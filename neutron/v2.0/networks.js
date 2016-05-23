var base = require('../../client/base');
var error = require('../../client/error');

var NetworkManager = base.Manager.extend({
  namespace: 'networks'
});

module.exports = NetworkManager;
