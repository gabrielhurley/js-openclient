var base = require("./client/base"),
    error = require("./client/error"),
    utils = require("./client/utils");

var openclient = {
  // Base functional components.
  Client: base.Client,
  Manager: base.Manager,
  error: error,
  utils: utils,
  api_map: {
    'openstack': {
      'identity': require('./keystone/versions'),
      'compute': require('./nova/versions'),
      'image': require('./glance/versions'),
      'volume': require('./cinder/versions'),
      'object-store': require('./swift/versions'),
      'orchestration': require('./heat/versions')
    }
  },

  getAPI: function (provider, type, version) {
    var api = openclient.api_map[provider][type];
    if (version) {
      return api[version.toString()];
    } else {
      // TODO: Add the ability for this function to do version discovery.
      return api[api.current];
    }
  }
};


// Left for backwards compatibility. DEPRECATED.
// Hard-coded OpenStack-specific clients by codename.
[
  ['Cinder', require('./cinder/v1/client')],
  ['Glance', require('./glance/v1.0/client')],
  ['Keystone', require("./keystone/v2.0/client")],
  ['Nova', require("./nova/v1.1/client")],
  ['Swift', require("./swift/v1/client")],
  ['Heat', require("./heat/v1/client")]
].forEach(function (pair) {
  Object.defineProperty(openclient, pair[0], {
    get: function () {
      console.trace("Use of openclient." + pair[0] + " is deprecated. Please use the openclient.getAPI method instead.");
      return pair[1];
    },
    enumerable: true,
    configurable: true
  });
});


module.exports = openclient;
