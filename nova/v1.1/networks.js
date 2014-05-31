var base = require("../../client/base"),
    error = require("../../client/error");


var NetworkManager = base.Manager.extend({
  namespace: "os-networks",
  plural: "networks",

  create: function (params, callback) {
    // Nova will choke with an error trying to parse an int if MTU is sent
    // but anything other than an integer or null;
    if (!params.data.mtu) params.data.mtu = null;
    return this._super(params, callback);
  },

  del: function (params, callback) {
    var manager = this,
        id = params.id || params.data.id;
    params.url = this.urljoin(this.get_base_url(params), id);
    // Always try to disassociate first; it's slightly inefficient, but it
    // ensures that delete won't fail because you forgot to do the disassocation
    // manually. This doesn't seem like a place where two steps are necessary.
    return this.disassociate({id: id}, function (err, result, xhr) {
      if (err) return manager.safe_complete(err, null, xhr, params, callback);
      manager.client.del(params, callback);
    });
  },

  disassociate: function (params, callback) {
    // Unlike novaclient, this method defaults to disassociating everything.
    var url = this.urljoin(this.get_base_url(params), params.id || params.data.id, "action");
    params = this.prepare_params(params, url, "singular");
    params.data = {disassociate: null};
    return this.client.post(params, callback);
  }
});


module.exports = NetworkManager;
