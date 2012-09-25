var base = require("../../client/base"),
    FlavorManager = require("./flavors"),
    ServerManager = require("./servers");


var Nova = base.Client.extend({
  service_type: "compute",
  version: "1.1",

  init: function (options) {
    this._super(options);
    this.flavors = new FlavorManager(this);
    this.servers = new ServerManager(this);
  }
});

module.exports = Nova;
