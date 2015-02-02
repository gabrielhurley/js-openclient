var _     = require("underscore"),
    async = require("async"),
    Class = require("../../client/inheritance").Class,
    base  = require("../../client/base"),
    error = require("../../client/error");
    AssignablesHelper = require("./util/assignables_helper");

var assignablesHelper = new AssignablesHelper();

/**
 * Manager-alike which delegates between a {UserProjectMembershipManager} and a {GroupProjectMembershipManager}, based
 * on the provided `type`.
 * @type {ProjectMembershipManager}
 */
var ProjectMembershipManager = Class.extend({
  safe_complete: base.Manager.prototype.safe_complete,


  init: function(user_project_memberships, group_project_memberships, role_assignments) {
    this._user_project_memberships  = user_project_memberships;
    this._group_project_memberships = group_project_memberships;
    this._role_assignments          = role_assignments;
  },


  all: function(params, callback) {
    var new_params = {
      query: {
        "scope.project.id": params.data.project
      }
    };

    this._role_assignments.all(new_params, _.bind(function(err, assignments) {
      if (err) {
        this.safe_complete(err, null, null, params, callback);
        return;
      }

      async.map(assignments,
        // Iterator
        _.bind(this._convertAssignment, this, params.data.project),

        // Callback
        _.bind(function(err, results) {
          // It's important that we still return a partial data set here even
          // if some assignments couldn't be mapped correctly. That requires
          // that _convertAssignment not return an error since async calls the
          // callback as soon as the first error occurs in the iterator.
          if (err) {
            this.safe_complete(err, null, null, params, callback);
            return;
          }

          this.safe_complete(null, results, { status: 200 }, params, callback);
        }, this)
      );
    }, this));
  },


  get: function(params, callback) {
    var type = params.data.type;
    if (type === "user") {
      this._user_project_memberships.get(params, callback);
    } else if (type === "group") {
      this._group_project_memberships.get(params, callback);
    } else {
      var err = new Error("Invalid type");
      this.safe_complete(err, null, null, params, callback);
    }
  },


  create: function(params, callback) {
    var type = params.data.type;
    if (type === "user") {
      this._user_project_memberships.create(params, callback);
    } else if (type === "group") {
      this._group_project_memberships.create(params, callback);
    } else {
      var err = new Error("Invalid type");
      this.safe_complete(err, null, null, params, callback);
    }
  },

  createWithDisambiguatedId: function(params, callback) {
    var disambiguated_id = params.data.disambiguated_id,
        assignable_info = assignablesHelper.parseDisambiguatedId(disambiguated_id),
        type = assignable_info.type;

    delete params.data.disambiguated_id;
    params.data[type] = assignable_info.id;
    params.data.type = type;
    return this.create(params, callback);
  },


  del: function(params, callback) {
    var type = params.data.type;
    if (type === "user") {
      this._user_project_memberships.del(params, callback);
    } else if (type === "group") {
      this._group_project_memberships.del(params, callback);
    } else {
      var err = new Error("Invalid type");
      this.safe_complete(err, null, null, params, callback);
    }
  },


  update: function(params, callback) {
    var type = params.data.type;
    if (type === "user") {
      this._user_project_memberships.update(params, callback);
    } else if (type === "group") {
      this._group_project_memberships.update(params, callback);
    } else {
      var err = new Error("Invalid type");
      this.safe_complete(err, null, null, params, callback);
    }
  },

  _convertAssignment: function(project, assignment, callback) {
    // Ensure we don't return an error from this function unless we have
    // something *completely* invalid like an unknown assignment type.
    // Otherwise we want to return partial data since this function is used
    // as an async iterator on aggregate data sets.
    function membershipCallback(err, membership, xhr) {
      if (err) {
        membership = {
          id: (assignment.user ? assignment.user.id : assignment.group.id),
          enabled: null,
          type: (assignment.user ? 'user' : 'group')
        };
      }
      callback(null, membership);
    }

    if (assignment.user) {
      this._user_project_memberships._fetchUserMembership(project, assignment.user, membershipCallback);
    } else if (assignment.group) {
      this._group_project_memberships._fetchGroupMembership(project, assignment.group, membershipCallback);
    } else {
      callback(new Error("Unhandled assignment type"));
    }
  }

});


module.exports = ProjectMembershipManager;
