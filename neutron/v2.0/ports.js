var base = require('../../client/base');
var error = require('../../client/error');

var PortManager = base.Manager.extend({
  namespace: 'ports'
});

module.exports = PortManager;
