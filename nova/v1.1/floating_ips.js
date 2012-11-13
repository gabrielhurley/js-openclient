var base = require("../../client/base"),
    error = require("../../client/error");

// TODO(roland): Make methods throw NotImplemented where applicable.

var FloatingIPManager = base.Manager.extend({
  namespace: "os-floating-ips"
});


module.exports = FloatingIPManager;
