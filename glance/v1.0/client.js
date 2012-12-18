var base = require("../../client/base"),
    ImageManager = require("./images");

var Glance = base.Client.extend({
  service_type: "image",
  version: "1",

  init: function (options) {
    this._super(options);
    this.images = new ImageManager(this);
  }
});

module.exports = Glance;
