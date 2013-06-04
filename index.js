var base = require("./client/base"),
    error = require("./client/error");

module.exports = {
  // Base functional components.
  Client: base.Client,
  Manager: base.Manager,
  error: error,

  // OpenStack-specific clients.
  Cinder: require('./cinder/v1/client'),
  Glance: require('./glance/v1.0/client'),
  Keystone: require("./keystone/v2.0/client"),
  Nova: require("./nova/v1.1/client"),
  Swift: require("./swift/v1/client"),
  Heat: require("./heat/v1/client")
};
