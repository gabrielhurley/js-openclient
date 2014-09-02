var _                 = require("underscore"),
    async             = require("async"),
    Class             = require("../../client/inheritance").Class,
    base              = require("../../client/base"),
    error             = require("../../client/error"),
    AssignablesHelper = require("./util/assignables_helper");

var assignablesHelper = new AssignablesHelper();

/**
 * An Assignable is anything that can be given a role assignment. Currently, we support Group and User as Project
 * Assignables. An assignable is its original type decorated with `assignable_type` and `disambiguated_id` attributes.
 *
 * @type {ProjectAssignableManager}
 */
var ProjectAssignableManager = Class.extend({
  safe_complete: base.Manager.prototype.safe_complete,


  init: function(users, groups) {
    this._users = users;
    this._groups = groups;
  },


  all: function(params, callback) {
    async.parallel({

      users: _.bind(function(cb) {
        this._users.all({}, cb)
      }, this),

      groups: _.bind(function(cb) {
        this._groups.all({}, cb);
      }, this)

    }, _.bind(function(err, results) {
      if (err) {
        this.safe_complete(err, null, null, params, callback);
        return;
      }

      _.each(results.users[0], function(user) {
        user.assignable_type = "user";
        user.disambiguated_id = assignablesHelper.disambiguatedId(user.assignable_type, user.id);
      });

      _.each(results.groups[0], function(group) {
        group.assignable_type = "group";
        group.disambiguated_id = assignablesHelper.disambiguatedId(group.assignable_type, group.id);
      });

      this.safe_complete(null, results.users[0].concat(results.groups[0]), { status: 200 }, params, callback);
    }, this));
  },



  get: function() {
    throw new error.NotImplemented();
  },


  create: function() {
    throw new error.NotImplemented();
  },


  update: function() {
    throw new error.NotImplemented();
  },


  del: function() {
    throw new error.NotImplemented();
  }

});

module.exports = ProjectAssignableManager;
