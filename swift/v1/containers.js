var base = require("../../client/base"),
    error = require("../../client/error");


var ContainerManager = base.Manager.extend({
  namespace: "containers",

  init: function (client) {
    this._super(client);
    this.method_map.create = "put";
  },

  _safe_id: function (id) {
    return encodeURIComponent(id);
  },

  prepare_params: function (params, url, plural_or_singular) {
    params.result_key = false;
    return this._super(params, url, plural_or_singular);
  },

  prepare_namespace: function (params) {
    return params.manager_method === "create" ? params.id : "";
  },

  create: function (params, callback) {
    var manager = this,
        success = params.success,
        error = params.error;

    if (params.success) delete params.success;
    if (params.error) delete params.error;

    params.id = this._safe_id(params.name || params.data.name);
    delete params.data;

    this._super(params, function (err, result, xhr) {
      if (err) return manager.safe_complete(err, null, xhr, params, callback);

      if (!result) {
        manager.get({id: params.id,}, function (err, result, xhr) {
          if (err) return manager.safe_complete(err, null, xhr, params, callback);
          manager.safe_complete(null, result, xhr, params, callback);
        });
      } else {
        manager.safe_complete(null, result, xhr, params, callback);
      }
    });
  },

  get: function (params, callback) {
    params.http_method = "head";

    params.id = params.id || params.data.id;

    params.parseHeaders = function (headers) {
      var result = {};

      Object.keys(headers).forEach(function (key) {
        if (key.indexOf("x-container-") === 0) {
          result[key.replace("x-container-", "")] = headers[key];
        }
        if (result['object-count']) result.count = parseInt(result['object-count'], 10);
        if (result['bytes-used']) result.bytes = parseInt(result['bytes-used'], 10);
      });

      result.id = params.id;
      result.name = decodeURIComponent(params.id);

      return result;
    };

    this._super(params, callback);
  },

  all: function (params, callback) {
    var manager = this;

    params.query = params.query || {};
    if (!params.query.format) params.query.format = "json";

    params.parseResult = function (results) {
      results.forEach(function (result) {
        result.id = manager._safe_id(result.name);
      });
      return results;
    };
    this._super(params, callback);
  }

});


module.exports = ContainerManager;
