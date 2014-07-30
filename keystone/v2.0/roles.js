var base = require("../../client/base"),
    error = require("../../client/error");


var RoleManager = base.Manager.extend({
  namespace: "OS-KSADM/roles",
  plural: "roles",
  update: function (params) { throw new error.NotImplemented(); },
  _rpc_to_api: function (rpc) {
    return {id: rpc.resource_info};
  }
});


module.exports = RoleManager;
