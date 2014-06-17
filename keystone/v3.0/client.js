var v2_client = require("../v2.0/client"),
    GroupsManager = require("./groups");


var Keystone = v2_client.extend({
  service_type: "identity",
  version: "3.0",

  init: function (options) {
    this._super(options);
    this.groups = new GroupsManager(this);
  }
});

module.exports = Keystone;
