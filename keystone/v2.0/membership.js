var base = require("../../client/base"),
    error = require("../../client/error"),
    interpolate = require("../../client/utils").interpolate;


var ProjectMembershipManager = base.Manager.extend({
  namespace: "/tenants/{tenant_id}/users",
  plural: "users",

  prepare_namespace: function (params) {
    return interpolate(this.namespace, {tenant_id: params.data.project});
  },

  get: function (params) { throw new error.NotImplemented(); },

  // Pseudo-method that adds a user to a project with the given role and
  // returns the user data.
  create: function (params) {
    var client = this.client,
        endpoint_type = params.endpoint_type;

    client.user_roles.update({
      id: params.data.id,
      project: params.data.project,
      user: params.data.user,
      endpoint_type: endpoint_type,
      success: function (result, xhr) {
        client.users.get({
          id: params.data.user,
          endpoint_type: endpoint_type,
          success: params.success,
          error: params.error
        });
      },
      error: params.error
    });
  },

  // Pseudo-method that removes a user from a project by removing any and all
  // roles that user may have on the project.
  del: function (params) {
    var user_roles_manager = this.client.user_roles,
        endpoint_type = params.endpoint_type;

    user_roles_manager.all({
      project: params.data.project,
      user: params.id,
      endpoint_type: endpoint_type,
      success: function (roles, xhr) {
        roles.forEach(function (role) {
          user_roles_manager.del({
            id: role.id,
            project: params.data.project,
            user: params.id,
            endpoint_type: endpoint_type,
            success: function () {
              params.success(null, xhr);
            },
            error: params.error
          });
        });
      },
      error: params.error
    });
  }
});


module.exports = ProjectMembershipManager;
