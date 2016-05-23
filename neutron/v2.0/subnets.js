var base = require('../../client/base');
var error = require('../../client/error');

var SubnetManager = base.Manager.extend({
  namespace: 'subnets'
});

module.exports = SubnetManager;
