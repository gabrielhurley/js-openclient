var base = require("../../client/base");

var FloatingIPPoolManager = base.Manager.extend({
  namespace: "os-floating-ip-pools",
  plural: "floating_ip_pools",

  get: function (params, callback) {
    params.parseResult = function (result) {
      return result;
    };
    this._super(params, callback);
  },

  all: function (params, callback) {
    params.parseResult = function (results) {
      return results;
    };
    this._super(params, callback);
  },

});


module.exports = FloatingIPPoolManager;
