var base = require("../../client/base");


var ImageManager = base.Manager.extend({
  namespace: "images",

  prepare_namespace: function (params) {
    return "v" + this.client.version + "/" + this.namespace;
  },

  get_base_url: function (params) {
    var base_url = this._super(params);
    if (!params.id) {  // If this is a "list" call...
      base_url = this.urljoin(base_url, 'detail');  // Always fetch the details.
    }
    return base_url;
  }
});


module.exports = ImageManager;
