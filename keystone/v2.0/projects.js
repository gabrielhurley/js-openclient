var base = require("../../client/base");


var ProjectManager = base.Manager.extend({
  namespace: "tenants",
  init: function (client) {
    this._super(client);
    // Keystone uses POST for project updates instead of PUT.
    this.method_map.update = "post";
  }
});


module.exports = ProjectManager;