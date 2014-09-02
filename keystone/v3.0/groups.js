var base = require("../../client/base");


var GroupManager = base.Manager.extend({
  namespace: "groups",


  _rpc_to_api: function (rpc) {
    return { id: rpc.resource_info };
  }
});


module.exports = GroupManager;
