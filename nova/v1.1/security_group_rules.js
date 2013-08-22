var base = require("../../client/base"),
    error = require("../../client/error");


var SecurityGroupRuleManager = base.Manager.extend({
  namespace: "os-security-group-rules",
  singular: "security_group_rule",

  get: function (params) { throw new error.NotImplemented(); },
  all: function (params) { throw new error.NotImplemented(); },
  update: function (params) { throw new error.NotImplemented(); },

  create: function (params, callback) {
    if (typeof params.data.group_id !== "undefined" && !params.data.group_id) delete params.data.group_id;
    if (params.data.from_port && !params.data.to_port) params.data.to_port = params.data.from_port;

    if (params.data.cidr && params.data.group_id) {
      var err = {
        status: 400,
        message: "Either a CIDR or a security group may be specified as a source, not both."
      };
      return this.safe_complete(err, null, {status: 400}, params, callback);
    }

    this._super(params, callback);
  }
});


module.exports = SecurityGroupRuleManager;
