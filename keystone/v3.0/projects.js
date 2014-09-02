var V2ProjectManager = require("../v2.0/projects");

var ProjectManager = V2ProjectManager.extend({
  namespace: "projects",
  plural: "projects",


  init: function(client) {
    this._super(client);
    this.method_map.update = "patch";
  }
});

module.exports = ProjectManager;
