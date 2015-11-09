var base = require("../../client/base"),
    ResourcesManager = require("./resources"),
    StacksManager = require("./stacks"),
    TemplatesManager = require("./templates");


var Heat = base.Client.extend({
  service_type: "orchestration",
  version: "1",

  init: function (options) {
    this._super(options);
    this.resources = new ResourcesManager(this);
    this.stacks = new StacksManager(this);
    this.templates = new TemplatesManager(this);
  }
});

module.exports = Heat;
