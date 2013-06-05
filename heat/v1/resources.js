var base = require("../../client/base"),
    utils = require("../../client/utils");


var ResourcesManager = base.Manager.extend({
  namespace: "/stacks/{stack_id}/resources",
  plural: "resources",

  prepare_namespace: function (params) {
    params.data = params.data || {};
    var stack_id = params.data.stack_id;
    delete params.data.stack_id;

    return utils.interpolate(this.namespace, {stack_id: stack_id});
  },

  all: function (params, callback) {
    params.parseResult = function (results) {
      results.forEach(function (result) {
        result.id = result.physical_resource_id;
      });
      return results;
    };
    this._super(params, callback);
  }

});


module.exports = ResourcesManager;
