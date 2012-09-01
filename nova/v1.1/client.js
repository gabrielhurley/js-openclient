var base = require("../../client/base"),
    FlavorManager = require("./flavors");


var Nova = base.Client.extend({
  service_type: "compute",
  version: "1.1",

  init: function (options) {
    this._super(options);
    this.flavors = new FlavorManager(this);
  }
});

module.exports = Nova;