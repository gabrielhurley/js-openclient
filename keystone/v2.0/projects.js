var base = require("../../client/base");


var ProjectManager = base.Manager.extend({
  namespace: "tenants",
  init: function (client) {
    this._super(client);
    // Keystone uses POST for project updates instead of PUT.
    this.method_map.update = "post";
  },

  enable: function (params, callback) {
    params.data = params.data || {};
    params.data.enabled = true;
    return this.update(params, callback);
  },

  disable: function (params, callback) {
    params.data = params.data || {};
    params.data.enabled = false;
    return this.update(params, callback);
  }

});


module.exports = ProjectManager;
