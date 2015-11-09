var base = require("../../client/base"),
    utils = require("../../client/utils"),
    urljoin = require("../../client/utils").urljoin;


var TemplatesManager = base.Manager.extend({
  namespace: "/stacks/{stack_id}/template",
  plural: "templates",

  prepare_namespace: function (params) {
    params.data = params.data || {};
    var stack_id = params.data.stack_id;
    delete params.data.stack_id;

    return utils.interpolate(this.namespace, {stack_id: stack_id});
  },

  get: function (params, callback) {
    var url = urljoin(this.get_base_url(params));
    params = this.prepare_params(params, url);
    this.client.get(params, callback);
  }

});


module.exports = TemplatesManager;
