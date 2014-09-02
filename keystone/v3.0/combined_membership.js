var _     = require("underscore"),
    async = require("async"),
    Class = require("../../client/inheritance").Class,
    base  = require("../../client/base"),
    error = require("../../client/error");
    AssignablesHelper = require("./util/assignables_helper");

var assignablesHelper = new AssignablesHelper();

/**
 * Manager-alike which delegates between a {UserProjectMembershipManager} and a {GroupProjectMembershipManager}, based
 * on the provided `assignable_type`.
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
    this._role_assignments.all({
      query: {
       "scope.project.id": params.data.project
      }
    }, _.bind(function(err, assignments) {
      if (err) {
        this.safe_complete(err, null, null, params, callback);
        return;
      }

      async.map(assignments, _.bind(this._convertAssignment, this, params.data.project), _.bind(function(err, results) {
        if (err) {
          this.safe_complete(err, null, null, params, callback);
          return;
        }

        this.safe_complete(null, results, { status: 200 }, params, callback);
      }, this));
    }, this));
  },


  get: function(params, callback) {
    var assignable_type = params.data.assignable_type;
    if (assignable_type === "user") {
      this._user_project_memberships.get(params, callback);
    } else if (assignable_type === "group") {
      this._group_project_memberships.get(params, callback);
    } else {
      var err = new Error("Invalid assignable_type");
      this.safe_complete(err, null, null, params, callback);
    }
  },


  create: function(params, callback) {
    var assignable_type = params.data.assignable_type;
    if (assignable_type === "user") {
      this._user_project_memberships.create(params, callback);
    } else if (assignable_type === "group") {
      this._group_project_memberships.create(params, callback);
    } else {
      var err = new Error("Invalid assignable_type");
      this.safe_complete(err, null, null, params, callback);
    }
  },

  createWithDisambiguatedId: function(params, callback) {
    var disambiguated_id = params.data.disambiguated_id,
        assignable_info = assignablesHelper.parseDisambiguatedId(disambiguated_id),
        assignable_type = assignable_info.assignable_type;

    delete params.data.disambiguated_id;
    params.data[assignable_type] = assignable_info.id;
    params.data.assignable_type = assignable_type;
    return this.create(params, callback);
  },


  del: function(params, callback) {
    var assignable_type = params.data.assignable_type;
    if (assignable_type === "user") {
      this._user_project_memberships.del(params, callback);
    } else if (assignable_type === "group") {
      this._group_project_memberships.del(params, callback);
    } else {
      var err = new Error("Invalid assignable_type");
      this.safe_complete(err, null, null, params, callback);
    }
  },


  update: function(params, callback) {
    var assignable_type = params.data.assignable_type;
    if (assignable_type === "user") {
      this._user_project_memberships.update(params, callback);
    } else if (assignable_type === "group") {
      this._group_project_memberships.update(params, callback);
    } else {
      var err = new Error("Invalid assignable_type");
      this.safe_complete(err, null, null, params, callback);
    }
  },

  _convertAssignment: function(project, assignment, callback) {
    if (assignment.user) {
      this._user_project_memberships._fetchUserMembership(project, assignment.user, callback);
    } else if (assignment.group) {
      this._group_project_memberships._fetchGroupMembership(project, assignment.group, callback);
    } else {
      callback(new Error("Unhandled assignment type"));
    }
  }

});


module.exports = ProjectMembershipManager;
