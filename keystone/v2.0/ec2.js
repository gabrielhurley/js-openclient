var base = require("../../client/base"),
    error = require("../../client/error"),
    interpolate = require("../../client/utils").interpolate;


var EC2Manager = base.Manager.extend({
  namespace: "/users/{user_id}/credentials/OS-EC2",
  plural: "credentials",

  prepare_namespace: function (params) {
    return interpolate(this.namespace, {user_id: params.id});
  },

  create: function (params, callback) {
    var project = params.data.tenant_id;
    params.id = params.id || params.data.id;
    params.use_raw_data = true;
    params.data = {tenant_id: project};
    this._super(params, callback);
  }

});


module.exports = EC2Manager;
