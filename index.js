var base = require("./client/base"),
    error = require("./client/error"),
    Keystone = require("./keystone/v2.0/client"),
    Nova = require("./nova/v1.1/client");

module.exports = {
  // Base functional components.
  Client: base.Client,
  Manager: base.Manager,
  error: error,

  // OpenStack-specific clients.
  Keystone: Keystone,
  Nova: Nova
};
