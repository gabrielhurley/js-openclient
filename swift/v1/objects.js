var http = require('http');

var base = require("../../client/base"),
    error = require("../../client/error");



var ObjectManager = base.Manager.extend({
  namespace: "objects",

  init: function (client) {
    this._super(client);
    this.method_map.create = "put";
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
    params.id = params.id || params.data.id || params.data.name;
    params.container = params.data.container;
    delete params.data;
    this._super(params, callback);
  },

  get: function (params, callback) {
    if (!params.http_method) params.http_method = "head";

    params.id = params.id || params.data.id || params.data.name;
    params.container = params.data.container;

    params.parseHeaders = function (xhr) {
      var result = {};

      result.id = params.id;
      result.name = params.id;
      result.hash = xhr.getResponseHeader('etag');
      result.last_modified = xhr.getResponseHeader('last-modified');
      result.content_type = xhr.getResponseHeader('content-type');
      result.bytes = xhr.getResponseHeader('content-length');

      return result;
    };

    delete params.data;

    this._super(params, callback);
  },

  download: function (params, callback) {
    params.id = params.id || params.data.id || params.data.name;
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
    // NOTE: The params.data.file data is expected to be passed in base64 encoded.

    var manager = this,
        success = params.success,
        container = params.data.container,
        data = params.data.file;

    params.success = function (result, xhr) {
      if (!result) {
        manager.get({
          id: params.id,
          data: {
            container: container
          },
          success: success,
          error: params.error
        }, callback);
      }
      else {
        if (callback) callback(null, result);
        success(result, xhr);
      }
    };

    params.http_method = "put";
    if (!params.headers) params.headers = {};
    params.headers['Content-Type'] = 'application/octet-stream';
    params.id = params.id || params.data.id || params.data.name;
    params.container = params.data.container;
    params.url = this.get_base_url(params) + "/" + params.id;

    delete params.data;

    this._doBinaryRequest("PUT", params.url, this.client.scoped_token.id, new Buffer(data, 'base64'), function (err, result) {
      if (err) {
        if (callback) callback(err);
        if (params.error) params.error(err);
      } else {
        if (callback) callback(null, result);
        if (params.success) params.success(result, {status: 200});
      }
    });
  },

  all: function (params, callback) {
    params.container = params.data.container;

    params.parseResult = function (results) {
      results.forEach(function (result) {
        result.id = result.name;
      });
      return results;
    };

    this._super(params, callback);
  }

});


module.exports = ObjectManager;
