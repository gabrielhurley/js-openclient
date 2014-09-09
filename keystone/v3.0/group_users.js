var base        = require("../../client/base"),
    interpolate = require("../../client/utils").interpolate;

var GroupUsersManager = base.Manager.extend({
  namespace: "/groups/{group_id}/users",
  plural: "users",


  prepare_namespace: function(params) {
    return interpolate(this.namespace, { group_id: params.data.group });
  }
});

module.exports = GroupUsersManager;
