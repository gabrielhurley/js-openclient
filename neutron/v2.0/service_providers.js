var base = require('../../client/base');
var error = require('../../client/error');

var ServiceProviderManager = base.Manager.extend({
  namespace: 'service-providers',
  plural: 'service_providers',

  get: function (params) { throw new error.NotImplemented(); },
  update: function (params) { throw new error.NotImplemented(); },
  create: function (params) { throw new error.NotImplemented(); },
  del: function (params) { throw new error.NotImplemented(); }

});

module.exports = ServiceProviderManager;
