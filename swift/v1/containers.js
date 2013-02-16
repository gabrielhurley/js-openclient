var base = require("../../client/base"),
    error = require("../../client/error");


var ContainerManager = base.Manager.extend({
  namespace: "containers",

  init: function (client) {
    this._super(client);
    this.method_map.create = "put";
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
        success = params.success;

    params.id = params.name || params.data.name;
    delete params.data;

    params.success = function (result, xhr) {
      if (!result) {
        manager.get({
          id: params.id,
          success: success,
          error: params.error
        }, callback);
      }
      else {
        if (callback) callback(null, result);
        success(result, xhr);
      }
    };

    this._super(params, function (err) {
      if (err && callback) callback(err);
    });
  },

  get: function (params, callback) {
    params.http_method = "head";

    params.id = params.id || params.data.id;

    params.parseHeaders = function (xhr) {
      var result = {},
          lines = xhr.getAllResponseHeaders().split(/\r\n|\r|\n/);

      lines.forEach(function (line) {
        var matches = line.match(/x-container-(.*)?: (.*)/);
        if (matches) {
          result[matches[1]] = matches[2];
        }
        if (result['object-count']) result.count = parseInt(result['object-count'], 10);
        if (result['bytes-used']) result.bytes = parseInt(result['bytes-used'], 10);
      });

      result.id = params.id;
      result.name = params.id;

      return result;
    };

    this._super(params, callback);
  },

  all: function (params, callback) {
    params.parseResult = function (results) {
      results.forEach(function (result) {
        result.id = result.name;
      });
      return results;
    };
    this._super(params, callback);
  }

});


module.exports = ContainerManager;
