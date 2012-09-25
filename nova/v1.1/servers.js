var base = require("../../client/base"),
    error = require("../../client/error");


var ServerManager = base.Manager.extend({
  namespace: "servers",
  // TODO(gabriel): Add in server creation logic...
  create: function (params) { throw error.NotImplemented; }
  // TODO(gabriel): Add all the extra methods the Nova API supports on servers.
});


module.exports = ServerManager;
