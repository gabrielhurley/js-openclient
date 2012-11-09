var base = require("../../client/base"),
    error = require("../../client/error");

// TODO(roland): Make methods throw NotImplemented where applicable.

var LimitManager = base.Manager.extend({
  namespace: "limits"
});


module.exports = LimitManager;
