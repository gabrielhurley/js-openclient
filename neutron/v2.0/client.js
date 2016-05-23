var base = require('../../client/base');
var NetworkManager = require('./networks');
var PortManager = require('./ports');
var ServiceProviderManager = require('./service_providers');
var SubnetManager = require('./subnets');

var Neutron = base.Client.extend({
  service_type: 'network',
  version: '2.0',
  // this version_overrides shouldn't be necessary but neutronv2 isn't in the service_catalog:
  version_overrides: {
    'network': [
      [/$/, '/v2.0'] // append /v2.0 to the end of the url
    ]
  },

  init: function (options) {
    this._super(options);
    this.networks = new NetworkManager(this);
    this.ports = new PortManager(this);
    this.service_providers = new ServiceProviderManager(this);
    this.subnets = new SubnetManager(this);
  }
});

module.exports = Neutron;
