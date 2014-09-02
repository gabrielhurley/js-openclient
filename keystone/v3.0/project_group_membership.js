var _     = require("underscore"),
  async = require("async"),
  Class = require("../../client/inheritance").Class,
  base  = require("../../client/base"),
  error = require("../../client/error");

/**
 * Manager-alike for assigning group roles on a project.
 *
 * ProjectGroupMembership and ProjectUserMembership have peered schemas to ease usage within
 * CombinedMembership.
 *
 * @type {ProjectGroupMembershipManager}
 */
var ProjectGroupMembershipManager = Class.extend({
  safe_complete: base.Manager.prototype.safe_complete,


  init: function(groups, group_roles, role_assignments) {
    this._role_assignments  = role_assignments;
    this._groups            = groups;
    this._group_roles       = group_roles;
  },


  all: function(params, callback) {
    this._role_assignments.all({
      query: {
        "scope.project.id": params.data.project,
        "group.id": params.data.group
      }
    }, _.bind(function(err, assignments) {
      if (err) {
        this.safe_complete(err, null, null, params, callback);
        return;
      }

      var convertAssignment = _.bind(function(project, assignment, cb) {
        this._fetchGroupMembership(project.assignment.group, cb);
      }, this, params.data.project);

      async.map(assignments, convertAssignment, function(err, results) {
        this.safe_complete(err, results, null, params, callback);
      });
    }, this));
  },


  get: function(params, callback) {
    this._fetchGroupMembership(params.data.project, {id: params.data.group}, _.bind(function(err, membership) {
      if (err) {
        this.safe_complete(err, null, null, params, callback);
      } else {
        this.safe_complete(null, membership, {status: 200}, params, callback);
      }
    }, this));
  },


  del: function(params, callback) {
    var endpoint_type = params.endpoint_type;
    this._group_roles.all({
      project: params.data.project,

      group: params.id,

      endpoint_type: endpoint_type,

      success: _.bind(function(roles) {
        var calls = _.map(roles, _.bind(function(role) {
          return _.bind(function(done) {
            this._group_roles.del({
              id: role.id,

              project: params.data.project,

              group: params.id,

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
        }, this));
      }, this),

      error: _.bind(function(err, xhr) {
        this.safe_complete(err, null, xhr, params, callback);
      }, this)
    });
  },


  create: function(params, callback) {
    var endpoint_type = params.endpoint_type;

    this._group_roles.update({
      id: params.data.id,

      project: params.data.project,

      group: params.data.group,

      endpoint_type: endpoint_type,

      success: _.bind(function() {
        this._fetchGroupMembership(params.data.project, {id: params.data.group}, _.bind(function(err, membership) {
          if (err) {
            this.safe_complete(err, null, null, params, callback);
            return;
          }

          this.safe_complete(null, membership, { status: 200 }, params, callback);
        }, this));
      }, this),

      error: _.bind(function(err, xhr) {
        this.safe_complete(err, null, xhr, params, callback);
      }, this)
    });
  },


  update: function() {
    throw new error.NotImplemented();
  },


  _fetchGroupMembership: function(project, groupSpec, callback) {
    this._groups.get({
      data: {
        id: groupSpec.id
      }
    }, _.bind(function(err, group) {
      if (err) {
        callback(err);
        return;
      }

      this._fetchProjectRolesForGroup(project, groupSpec, function(err, roles) {
        if (err) {
          callback(err);
          return;
        }
        callback(null, {
          id: groupSpec.id,
          name: group.name,
          roles: roles,
          assignable_type: "group",
          _backingObj: group
        });
      });
    }, this));
  },


  _fetchProjectRolesForGroup: function(project, groupSpec, callback) {
    this._group_roles.all({
      project: project,
      group: groupSpec.id
    }, callback);
  }
});


module.exports = ProjectGroupMembershipManager;
