var base = require("../../client/base"),
    error = require("../../client/error");

// TODO(roland): Make methods throw NotImplemented where applicable.

var FloatingIPBulkManager = base.Manager.extend({
  namespace: "os-floating-ips-bulk",
  plural: "floating_ip_info",
  singular: "floating_ip",

  get: function (params, callback) {
    params.parseResult = function (result) {
      result.instance_id = result.instance_uuid;
      delete result.instance_uuid;
      return result;
    };
    this._super(params, callback);
  },

  all: function (params, callback) {
    params.parseResult = function (results) {
      results.forEach(function (result) {
        result.instance_id = result.instance_uuid;
        delete result.instance_uuid;
      });
      return results;
    };
    this._super(params, callback);
  }
});


var FloatingIPManager = base.Manager.extend({
  namespace: "os-floating-ips",
  plural: "floating_ips",

  get: function (params, callback) {
    params.parseResult = function (result) {
      // for parity with floating-ips-bulk
      if (!result.instance_id) result.network_id = null;
      return result;
    };
    this._super(params, callback);
  },

  all: function (params, callback) {
    params.parseResult = function (results) {
      results.forEach(function (result) {
        // for parity with floating-ips-bulk
        if (!result.instance_id) result.network_id = null;
      });
      return results;
    };
    this._super(params, callback);
  },

  available: function (params, callback) {
    params.parseResult = function (ips) {
      var available = [];
      ips.forEach(function (ip) {
        if (!ip.instance_id) available.push(ip);
      });
      return available;
    };
    return this.all(params, callback);
  },

  add_to_instance: function (params, callback) {
    var client = this.client,
        manager = this;

    params.id = params.id || params.data.id;
    if (params.data && params.data.id) delete params.data.id;

    return this.get({id: params.id}, function (err, ip, xhr) {
      if (err) return manager.safe_complete(err, null, xhr, params, callback);
      var new_params = {
        id: params.data.instance_id,
        data: { address: params.data.address }
      };
      client.servers.add_floating_ip(new_params, function (err, data, xhr) {
        if (err) return manager.safe_complete(err, null, xhr, params, callback);
        manager.safe_complete(null, ip, {status: 202}, params, callback);
      });
    });
  },

  remove_from_instance: function (params, callback) {
    var client = this.client,
        manager = this;

    params.id = params.id || params.data.id;
    if (params.data && params.data.id) delete params.data.id;

    return this.get({id: params.id}, function (err, ip, xhr) {
      if (err) return manager.safe_complete(err, null, xhr, params, callback);
      var new_params = {
        id: ip.instance_id,
        data: { address: ip.ip }
      };
      client.servers.remove_floating_ip(new_params, function (err, data, xhr) {
        if (err) return manager.safe_complete(err, null, xhr, params, callback);
        manager.safe_complete(null, ip, {status: 202}, params, callback);
      });
    });
  },

  in_use: function (params, callback) {
    var manager = this;
    new FloatingIPBulkManager(this.client).all({data: params.data}, function (err, results, xhr) {
      if (err) return manager.safe_complete(err, null, xhr, params, callback);
      var in_use = [];
      results.forEach(function (ip) {
        if (ip.project_id) in_use.push(ip);
      });
      manager.safe_complete(null, in_use, xhr, params, callback);
    });
  },

  _rpc_to_api: function (rpc) {
    // DO NOT USE, this notification is incomplete.
    var api = {};
    //api.id = // OH YEAH, THEY FORGOT TO SEND THE ID.
    api.ip = rpc.floating_ip;
    return rpc;
  }
});


module.exports = FloatingIPManager;
