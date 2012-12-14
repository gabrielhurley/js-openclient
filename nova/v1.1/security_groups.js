var base = require("../../client/base"),
    error = require("../../client/error");


var SecurityGroupManager = base.Manager.extend({
  namespace: "os-security-groups",
  plural: "security_groups",

  update: function (params) { throw error.NotImplemented; }
});


module.exports = SecurityGroupManager;
