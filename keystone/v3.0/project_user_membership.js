var _     = require("underscore"),
    async = require("async"),
    Class = require("../../client/inheritance").Class,
    base  = require("../../client/base"),
    error = require("../../client/error");

/**
 * Manager-alike helper for assigning user roles on a project.
 *
 * ProjectGroupMembership and ProjectUserMembership have peered schemas to ease usage within
 * CombinedMembership.
 *
 * @type {ProjectUserMembershipManager}
 */
var ProjectUserMembershipManager = Class.extend({
  safe_complete: base.Manager.prototype.safe_complete,


  init: function(users, user_roles, role_assignments) {
    this._users            = users;
    this._user_roles       = user_roles;
    this._role_assignments = role_assignments;
  },


  all: function(params, callback) {
    this._role_assignments.all({
      query: {
        "scope.project.id": params.data.project,
        "user.id": params.data.user
      }
    }, _.bind(function(err, assignments) {
      if (err) {
        this.safe_complete(err, null, null, params, callback);
        return;
      }

      var convertAssignment = _.bind(function(project, assignment, cb) {
        this._fetchUserMembership(project.assignment.user, cb);
      }, this, params.data.project);

      async.map(assignments, convertAssignment, _.bind(function(err, results) {
        this.safe_complete(err, results, null, params, callback);
      }, this));
    }, this));
  },


  get: function(params, callback) {
    this._fetchUserMembership(params.data.project, {id: params.data.group}, _.bind(function(err, membership) {
      if (err) {
        this.safe_complete(err, null, { error: err }, params, callback);
      } else {
        this.safe_complete(null, membership, { status: 200 }, params, callback);
      }
    }, this));
  },


  del: function(params, callback) {
    var endpoint_type = params.endpoint_type;
    this._user_roles.all({
      project: params.data.project,

      user: params.id,

      endpoint_type: endpoint_type,

      success: _.bind(function(roles) {
        var calls = _.map(roles, _.bind(function(role) {
          return _.bind(function(done) {
            this._user_roles.del({
              id: role.id,

              project: params.data.project,

              user: params.id,

              endpoint_type:endpoint_type,

              success: function() {
                done(null);
              },

              error: function(err) {
                done(err);
              }
            });
          }, this);
        }, this));

        async.parallel(calls, _.bind(function(err) {
          if (err) {
            this.safe_complete(err, null, null, params, callback);
            return;
          }
          this.safe_complete(null, null, { status: 200 }, params, callback);
        }, this))
      }, this),

      error: _.bind(function(err, xhr) {
        this.safe_complete(err, null, xhr, params, callback);
      }, this)
    });
  },


  create: function(params, callback) {
    var endpoint_type = params.endpoint_type;

    this._user_roles.update({
      id: params.data.id,

      project: params.data.project,

      user: params.data.user,

      endpoint_type: endpoint_type,

      success: _.bind(function() {
        this._fetchUserMembership(params.data.project, { id: params.data.user }, _.bind(function(err, user) {
          if (err) {
            this.safe_complete(err, null, null, params, callback);
            return;
          }

          this.safe_complete(null, user, { status: 200 }, params, callback);
        }, this))
      }, this),

      error: _.bind(function(err, xhr) {
        this.safe_complete(err, null, xhr, params, callback);
      }, this)
    });
  },


  update: function() {
    throw new error.NotImplemented();
  },


  _fetchUserMembership: function(project, userSpec, callback) {
    this._users.get({
      id: userSpec.id
    }, _.bind(function(err, user) {
      if (err) {
        callback(err);
        return;
      }

      this._fetchProjectRolesForUser(project, user, function(err, roles) {
        if (err) {
          callback(err);
          return;
        }

        callback(null, {
          id: user.id,
          name: user.name,
          email: user.email,
          roles: roles,
          enabled: user.enabled,
          type: "user",
          _backingObj: user
        });
      });

    }, this));
  },


  _fetchProjectRolesForUser: function(project, userSpec, callback) {
    this._user_roles.all({
      project: project,
      user: userSpec.id
    }, callback);
  }
});

module.exports = ProjectUserMembershipManager;
