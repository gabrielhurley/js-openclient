var base = require("../../client/base"),
    error = require("../../client/error");


var ServerManager = base.Manager.extend({
  namespace: "servers",

  get_base_url: function (params) {
    var base_url = this._super(params);
    if (params.detail) {
      base_url = this.urljoin(base_url, 'detail');
    }
    return base_url;
  },

  // TODO(gabriel): Add in server creation logic...
  create: function (params) { throw error.NotImplemented; }
  // TODO(gabriel): Add all the extra methods the Nova API supports on servers.
});


module.exports = ServerManager;
