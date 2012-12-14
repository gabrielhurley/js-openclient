var base = require("../../client/base"),
    error = require("../../client/error");


var SecurityGroupRuleManager = base.Manager.extend({
  namespace: "os-security-group-rules",
  singular: "security_group_rule",

  get: function (params) { throw error.NotImplemented; },
  all: function (params) { throw error.NotImplemented; },
  update: function (params) { throw error.NotImplemented; },
});


module.exports = SecurityGroupRuleManager;
