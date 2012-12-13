var base = require("../../client/base"),
    error = require("../../client/error");


var KeypairManager = base.Manager.extend({
  namespace: "os-keypairs",
  plural: "keypairs",
  singular: "keypair",

  all: function (params) {
    var manager = this;
    params.parseResult = function (result) {
      var modified_results = [];
      result.forEach(function (item) {
        var modified_item = item[manager.singular];
        modified_item.id = modified_item.name;
        modified_results.push(modified_item);
      });
      return modified_results;
    };
    return this._super(params);
  },
  get: function (params) { throw error.NotImplemented; },
  update: function (params) { throw error.NotImplemented; }
});


module.exports = KeypairManager;
