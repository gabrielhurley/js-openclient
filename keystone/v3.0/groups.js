var base = require("../../client/base"),
    error = require("../../client/error");


var GroupManager = base.Manager.extend({
  namespace: "groups",
  // TODO: Test all group API functions to see what needs to be overridden.

  _rpc_to_api: function (rpc) {
    return {id: rpc.resource_info};
  }
});


module.exports = GroupManager;
