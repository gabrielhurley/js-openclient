var async = require('async'),
    base = require("../../client/base"),
    error = require("../../client/error"),
    interpolate = require("../../client/utils").interpolate;


var ProjectMembershipManager = base.Manager.extend({
  namespace: "/tenants/{tenant_id}/users",
  plural: "users",

  prepare_namespace: function (params) {
    return interpolate(this.namespace, {tenant_id: params.data.project});
  },

  get: function (params) { throw new error.NotImplemented(); },

  all: function (params, callback) {
    var manager = this,
        success = params.success,
        error = params.error;

    if (params.success) delete params.success;
    if (params.error) delete params.error;

    this._super(params, function (err, users) {
      if (err) return manager.safe_complete(err, null, null, {error: error}, callback);

      // Add in the roles for each user.
      async.forEach(users, function (user, next) {
        // NOTE: params.url exists here because we passed params into
        // the _super call above.
        var url = manager.urljoin(params.url, user.id, "roles");
        manager.client.get({
          url: url,
          result_key: "roles",
          error: function (err) {
            manager.client.log('error', 'Unable to retrieve roles for user "' + user.name + '"');
            user.roles = null;
            next();
          },
          success: function (roles) {
            user.roles = roles;
            next();
          }
        });
      }, function (err) {
        if (err) return manager.safe_complete(err, null, null, {error: error}, callback);
        manager.safe_complete(err, users, {status: 200}, {success: success}, callback);
      });
    });
  },

  // Pseudo-method that adds a user to a project with the given role and
  // returns the user data.
  create: function (params, callback) {
    var manager = this,
        client = this.client,
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
          success: function (user, xhr) {
            var url = manager.urljoin(manager.get_base_url(params), user.id, "roles");
            manager.client.get({
              url: url,
              result_key: "roles",
              error: function (err, xhr) {
                manager.safe_complete(err, null, xhr, params, callback);
              },
              success: function (roles, xhr) {
                user.roles = roles;
                manager.safe_complete(null, user, {status: 200}, params, callback);
              }
            });
          },
          error: function (err, xhr) {
            manager.safe_complete(err, null, xhr, params, callback);
          }
        });
      },
      error: function (err, xhr) {
        manager.safe_complete(err, null, xhr, params, callback);
      }
    });
  },

  // Pseudo-method that removes a user from a project by removing any and all
  // roles that user may have on the project.
  del: function (params, callback) {
    var manager = this,
        user_roles_manager = this.client.user_roles,
        endpoint_type = params.endpoint_type;

    user_roles_manager.all({
      project: params.data.project,
      user: params.id,
      endpoint_type: endpoint_type,
      success: function (roles, xhr) {
        var calls = [];
        roles.forEach(function (role) {
          calls.push(function (done) {
            user_roles_manager.del({
              id: role.id,
              project: params.data.project,
              user: params.id,
              endpoint_type: endpoint_type,
              success: function () {
                done(null);
              },
              error: function (err) {
                done(err);
              }
            });
          });
        });
        async.parallel(calls, function (err) {
          if (err) return manager.safe_complete(err, null, null, params, callback);
          manager.safe_complete(err, null, {status: 200}, params, callback);
        });
      },
      error: function (err, xhr) {
        manager.safe_complete(err, null, xhr, params, callback);
      }
    });
  }
});


module.exports = ProjectMembershipManager;
