var base = require("../../client/base"),
    error = require("../../client/error");


var FlavorManager = base.Manager.extend({
  namespace: "flavors",
  update: function (params) { throw error.NotImplemented; }
});


module.exports = FlavorManager;