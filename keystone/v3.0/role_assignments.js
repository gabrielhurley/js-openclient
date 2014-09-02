var async = require("async"),
    base  = require("../../client/base"),
    error = require("../../client/error");

/**
 * RoleAssignments is list-only (RoleAssignments#all).
 *
 * @type {RoleAssignments}
 */
var RoleAssignments = base.Manager.extend({
  namespace: "role_assignments",
  plural: "role_assignments",


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

module.exports = RoleAssignments;
