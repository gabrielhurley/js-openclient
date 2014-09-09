var base = require("../../client/base"),
  error = require("../../client/error"),
  interpolate = require("../../client/utils").interpolate;


var UserRoleManager = base.Manager.extend({
  namespace: "/projects/{project_id}/users/{user_id}/roles",
  plural: "roles",


  prepare_namespace: function (params) {
    return interpolate(this.namespace, { project_id: params.project, user_id: params.user });
  },


  get: function () { throw new error.NotImplemented(); },


  create: function () { throw new error.NotImplemented(); }

});


module.exports = UserRoleManager;
