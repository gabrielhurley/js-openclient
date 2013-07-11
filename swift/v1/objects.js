var http = require('http');

var base = require("../../client/base"),
    error = require("../../client/error");


var ObjectManager = base.Manager.extend({
  namespace: "objects",

  init: function (client) {
    this._super(client);
    this.method_map.create = "put";
  },

  _safe_id: function (id) {
    return encodeURIComponent(id);
  },

    // Method to handle binary file transfers since the XMLHttpRequest
  // library currently tries to transfer everything as utf8.
  _doBinaryRequest: function (method, url, token, data, callback) {
    var client = this.client;

    var matches = url.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i),
        host_and_port = matches[1].split(':');

    var options = {
      hostname: host_and_port[0],
      port: host_and_port[1],
      path: '/' + url.substring(matches[0].length),
      method: method,
      headers: {
        'X-Auth-Token': token
      }
    };

    var response_data = "";

    var request = http.request(options, function (response) {
      response.setEncoding('binary');

      client.log("\nRES:", method, url,
                  "\nstatus:", response.statusCode);
      Object.keys(response.headers).forEach(function (key) {
        client.log(key + ":", response.headers[key]);
      });

      response.on('data', function (chunk) {
        response_data += chunk;
      });

      response.on('end', function () {
        if (response_data) client.log("body:", "<binary data>");
        callback(null, response_data);
      });

    });

    request.on('error', function (err) {
      callback(err);
    });

    client.log("\nREQ:", method, url);
    Object.keys(options.headers).forEach(function (key) {
      client.log(key + ":", options.headers[key]);
    });

    // Data should be a buffer.
    if (data) {
      request.write(data, 'binary');
    }

    request.end();
  },

  prepare_params: function (params, url, plural_or_singular) {
    params.result_key = false;
    return this._super(params, url, plural_or_singular);
  },

  prepare_namespace: function (params) {
    return params.manager_method === "create" ? params.container + "/" + params.id : params.container;
  },

  del: function (params, callback) {
    params.id = params.id || params.data.id || this._safe_id(params.data.name);
    params.container = params.data.container;
    delete params.data;
    this._super(params, callback);
  },

  get: function (params, callback) {
    if (!params.http_method) params.http_method = "head";

    params.id = params.id || params.data.id || this._safe_id(params.data.name);
    params.container = params.data.container;

    params.parseHeaders = function (headers) {
      var result = {};

      result.id = params.id;
      result.name = decodeURIComponent(params.id);
      result.hash = headers.etag;
      result.last_modified = headers['last-modified'];
      result.content_type = headers['content-type'];
      result.bytes = headers['content-length'];

      return result;
    };

    delete params.data;

    this._super(params, callback);
  },

  download: function (params, callback) {
    params.id = params.id || params.data.id || this._safe_id(params.data.name);
    params.container = params.data.container;
    params.url = this.get_base_url(params) + "/" + params.id;
    delete params.data;
    this._doBinaryRequest("GET", params.url, this.client.scoped_token.id, null, function (err, result) {
      if (err) {
        if (callback) callback(err);
        if (params.error) params.error(err);
      } else {
        if (callback) callback(null, result);
        if (params.success) params.success(result, {status: 200});
      }
    });
  },

  create: function (params, callback) {
    var manager = this,
        success = params.success,
        container = params.data.container;

    params.method = "PUT";
    if (!params.headers) params.headers = {};
    params.headers['Content-Type'] = 'application/octet-stream';
    params.id = params.id || params.data.id || this._safe_id(params.data.name);
    params.container = params.data.container;
    params.url = this.get_base_url(params) + "/" + params.id;

    delete params.data;

    var uploader = this._openBinaryStream(params, params.headers, this.client.scoped_token.id, function (err, result) {
      if (err) {
        if (callback) callback(err);
        if (params.error) params.error(err);
      } else {
        if (callback) callback(null, result, {status: 100});
        if (params.success) params.success(result, {status: 100});
      }
    });

    uploader.success = function (response_data, success_callback) {
      manager.get({
        id: params.id,
        data: {
          container: container
        }
      }, success_callback);
    };

    return uploader;
  },

  all: function (params, callback) {
    var manager = this;
    params.query = params.query || {};
    if (!params.query.format) params.query.format = "json";

    params.container = params.data.container;

    params.parseResult = function (results) {
      results.forEach(function (result) {
        result.id = manager._safe_id(result.name);
      });
      return results;
    };

    this._super(params, callback);
  }

});


module.exports = ObjectManager;
