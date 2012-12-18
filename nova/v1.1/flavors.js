var base = require("../../client/base"),
    error = require("../../client/error");


var FlavorManager = base.Manager.extend({
  namespace: "flavors",

  get_base_url: function (params) {
    var base_url = this._super(params);
    if (!params.id) {  // If this is a "list" call...
      base_url = this.urljoin(base_url, 'detail');  // Always fetch the details.
    }
    return base_url;
  },

  update: function (params) { throw error.NotImplemented; }
});


module.exports = FlavorManager;
