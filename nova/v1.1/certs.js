var base = require("../../client/base"),
    error = require("../../client/error"),
    urljoin = require("../../client/utils").urljoin;


var CertsManager = base.Manager.extend({
  namespace: "os-certificates",
  plural: "certificates",
  singular: "certificate",

  update: function (params, callback) { throw new error.NotImplemented(); },
  del: function (params, callback) { throw new error.NotImplemented(); },
  all: function (params, callback) { throw new error.NotImplemented(); },
  in_bulk: function (params, callback) { throw new error.NotImplemented(); },
  filter: function (params, callback) { throw new error.NotImplemented(); },

  get: function (params, callback) {
    params = this.prepare_params(params, this.get_base_url(params), "singular");
    params.url = urljoin(params.url, "root");
    return this.client.get(params, callback);
  }

});


module.exports = CertsManager;
