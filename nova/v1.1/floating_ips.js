var base = require("../../client/base"),
    error = require("../../client/error");

// TODO(roland): Make methods throw NotImplemented where applicable.

var FloatingIPManager = base.Manager.extend({
  namespace: "os-floating-ips",
  plural: "floating_ips",

  available: function (params) {
    params.parseResult = function (ips) {
      var available = [];
      ips.forEach(function (ip) {
        if (!ip.instance_id) available.push(ip);
      });
      return available;
    };
    return this.all(params);
  },

  add_to_instance: function (params) {
    var client = this.client;
    params.id = params.id || params.data.id;
    if (params.data && params.data.id) delete params.data.id;
    return this.get({
      id: params.id,
      success: function (ip) {
        params.id = params.data.instance_id;
        params.data.address = ip.ip;
        delete params.data.instance_id;
        return client.servers.add_floating_ip(params);
      },
      error: params.error
    });
  },

  remove_from_instance: function (params) {
    var client = this.client;
    params.data = params.data || {};
    params.id = params.id || params.data.id;
    if (params.data.id) delete params.data.id;
    return this.get({
      id: params.id,
      success: function (ip) {
        params.id = ip.instance_id;
        params.data.address = ip.ip;
        return client.servers.remove_floating_ip(params);
      },
      error: params.error
    });
  }
});


module.exports = FloatingIPManager;
