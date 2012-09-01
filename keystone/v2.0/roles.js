var base = require("../../client/base"),
    error = require("../../client/error");


var RoleManager = base.Manager.extend({
  namespace: "OS-KSADM/roles",
  plural: "roles",
  update: function (params) { throw error.NotImplemented; }
});


module.exports = RoleManager;