var base = require("../../client/base"),
    ContainerManager = require("./containers"),
    ObjectManager = require("./objects");

var Swift = base.Client.extend({
  service_type: "object-store",
  version: "1",

  init: function (options) {
    this._super(options);

    this.containers = new ContainerManager(this);
    this.objects = new ObjectManager(this);
  }
});

module.exports = Swift;
