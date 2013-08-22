var crypto = require('crypto'),
    http = require('http'),
    URL = require('url');

var async = require("async");

var Class = require("./inheritance").Class,
    color = require("./color"),
    error = require("./error"),
    is_ans1_token = require("./utils").is_ans1_token,
    StreamingUpload = require("./streaming").StreamingUpload,
    urljoin = require("./utils").urljoin,
    io = require("./io");


var XMLHttpRequest = io.XMLHttpRequest;


// There are certain things such as console color capabilities that just
// can't be feature-detected, sadly. This is a pretty safe alternative.
color.enable(!io._native);


var Client = Class.extend({

  // Base client version
  VERSION: "1.0",
  redacted_request: ['password'],
  redacted_response: [
    'private_key',
    // TODO: This is a mega hack to redact the private key in certain situation
    //       problem is that properties are ordered non-deterministically so "data"
    //       could come before "private_key" we need a better way to do this. But it
    //       works for now.
    'private_key": null, "data'
  ],

  // Small hack, but if we're not using the native XHR, we're almost certainly
  // in a NodeJS environment, not in a browser.
  is_browser: io._native,

  init: function (options) {
    options = options || {};
    this.user_agent = options.user_agent || "js-openclient";
    this.debug = options.debug || false;
    this.log_level = this.debug ? "debug" : (options.log_level || "warning");
    this._log_level = this.log_levels[this.log_level];  // Store the numeric version so we don't recalculate it every time.
    this.truncate_long_response = options.truncate_long_response || true; // Set default truncation to truncate...
    this.truncate_response_at = options.truncate_response_at || -1; // but only based on specific truncation lengths in params.
    this.url = options.url;
    this.scoped_token = options.scoped_token || null;
    this.unscoped_token = options.unscoped_token || null;
    this.service_catalog = options.service_catalog || [];
    this.tenant = options.project || null;
    this.user = options.user || null;
    // Allow URL rewrite hacks to bypass proxy issues.
    // The argument should be an array in the form of [<match>, <replacement>]
    this.url_rewrite = options.url_rewrite || false;
  },

  log_levels: {
    "critical": 100,
    "error": 80,
    "warn": 60,
    "info": 40,
    "debug": 20
  },

  log_level_method_map: {
    100: function (string) { console.error(color.bold(color.red(string))); },
    80: function (string) { console.error(color.red(string)); },
    60: function (string) { console.error(color.yellow(string)); },
    40: function (string) { console.error(color.cyan(string)); },
    20: console.log
  },

  // Generic logging function that outputs to the appropriate log method with
  // colorized output, etc.
  log: function (level) {
    if (typeof level !== "number") level = this.log_levels[level];
    if (level >= this._log_level) {
      this.log_level_method_map[level](Array.prototype.slice.apply(arguments, [1, arguments.length]).join(" "));
    }
  },

  redact: function (json_string, redacted) {
    for (var i = 0; i < redacted.length; i++) {
      var re = new RegExp('("' + redacted[i] + '":\\s?)"(([^\\"]|\\\\|\\")*)"', "g");
      json_string = json_string.replace(re, '$1"*****"');
    }
    return json_string;
  },

  // Format headers to pretty-print for easier reading.
  format_headers: function (headers) {
    var formatted = "";
    for (var header in headers) {
      if (headers.hasOwnProperty(header)) {
        formatted += "\n" + header + ": " + headers[header];
      }
    }
    return formatted;
  },

  // Fetches a URL for the current service type with the given endpoint type.
  url_for: function (endpoint_type, service_type) {
    var search_service_type = service_type || this.service_type;
    for (var i = 0; i < this.service_catalog.length; i++) {
      if (this.service_catalog[i].type === search_service_type) {
        return this.service_catalog[i].endpoints[0][endpoint_type];
      }
    }
    if (service_type) {  // If we came up empty for a specific search, return null.
      return null;
    } else {  // Otherwise try returning a pre-set URL.
      return this.url;
    }
  },

  log_request: function (level, method, url, headers, data) {
    var args = [level, "\nREQ:", method, url, this.format_headers(headers)];
    if (data) args = args.concat(["\nbody:", this.redact(data, this.redacted_request)]);
    this.log.apply(this, args);
  },

  log_response: function (level, method, url, status, headers, data) {
    var args = [level, "\nRES:", method, url, "\nstatus:", status, this.format_headers(headers)];
    if (data) args = args.concat(["\nbody:", this.redact(data, this.redacted_response)]);
    this.log.apply(this, args);
  },

  process_response: function (method, url, data, status, response_text, req_headers, resp_headers, params, callback) {
    var client = this;

    // We may have missed logging the request that triggered the error
    // if the log level was too low so we check and log here.
    if ((status === 0 || status >= 400) && client._log_level < client.log_levels.error) {
      client.log_request("error", method, url, req_headers, data);
    }

    // If not set, check for a param truncation but fallback to -1, otherwise respect the user-defined global truncation.
    var truncate_at = client.truncate_response_at === -1 ? (params.truncate_at || client.truncate_response_at) : client.truncate_response_at;

    if (
      client.truncate_long_response &&
      truncate_at >= 0 &&
      response_text.length >= client.truncate_response_at
    ) {
      response_text = response_text.substring(0, truncate_at) + "... (truncated)";
    }

    if (status === 0) {
      response_text = "<REQUEST ABORTED>";
    }


    client.log_response((status === 0 || status >= 400) ? "error" : "info",
                        method, url, status, resp_headers, response_text);


    // Response handling.
    // Ignore informational codes for now (1xx).
    // Handle successes (2xx).
    if (status >= 200 && status < 300) {
      var result;

      if (params.raw_result) {
        result = response_text;
      } else if (response_text) {
        try {
          result = JSON.parse(response_text);
        } catch (e) {
          console.error("Invalid JSON response");
        }

        if (result) {
          if (params.result_key) {
            result = result[params.result_key];
          }
          if (params.parseResult) {
            result = params.parseResult(result);
          }
        }
      } else {
        if (params.parseHeaders) {
          result = params.parseHeaders(resp_headers);
        }
      }

      callback(null, result);
    }

    // Redirects are handled transparently by XMLHttpRequest.
    // Handle errors (4xx, 5xx)
    if (status === 0 || status >= 400) {
      var api_error,
          message,
          Err = error.get_error(status),
          err;

      try {
        api_error = JSON.parse(response_text);
        if (api_error.hasOwnProperty('error')) api_error = api_error.error;
        // NOTE: The following are for stupid Cinder errors.
        if (api_error.hasOwnProperty('badRequest')) api_error = api_error.badRequest;
        if (api_error.hasOwnProperty('overLimit')) api_error = api_error.overLimit;
        if (api_error.hasOwnProperty('forbidden')) api_error = api_error.forbidden;
        message = api_error.message;
      }
      catch (problem) {
        message = response_text;
      }

      err = new Err(status, message, api_error);

      callback(err);
    }
  },

  // Core method for making requests to API endpoints.
  // All other methods eventually route back to this one.
  request: function (params, callback) {
    var xhr = new XMLHttpRequest(),
        client = this,
        token = this.scoped_token || this.unscoped_token,
        url = params.url,
        dataType,
        data,
        headers,
        method;

    // This is mainly necessary due to Glance needing the Content-Length
    // header set on PUT requests, but xmlhttprequest only setting it for POST.
    if (params.allow_headers && typeof xhr.setDisableHeaderCheck === "function") xhr.setDisableHeaderCheck(true);

    // When run in Node we can optionally allow using insecure/self-signed certs.
    if (params.allow_insecure_cert && typeof xhr.setAllowInsecureCert === "function") xhr.setAllowInsecureCert(true);

    if (params.query) {
      var query_params = [];
      Object.keys(params.query).forEach(function (key) {
        query_params.push(key + "=" + params.query[key]);
      });
      url += "?" + query_params.join("&");
    }

    if (this.url_rewrite) {
      url = url.replace(this.url_rewrite[0], this.url_rewrite[1]);
    }

    xhr.open(params.method, url, true);

    method = params.method.toUpperCase();

    headers = params.headers || {};

    if (!headers["Content-Type"]) {
      if (params.use_http_form_data) {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
      } else {
        headers["Content-Type"] = "application/json";
      }
    }

    headers.Accept = "application/json";

    headers['X-Requested-With'] = this.user_agent;

    // Set our auth token if we have one.
    if (token) {
      headers['X-Auth-Token'] = token.id;
    }

    // Create our XMLHttpRequest and set headers.
    for (var header in headers) {
      if (headers.hasOwnProperty(header)) {
        xhr.setRequestHeader(header, headers[header]);
      }
    }

    function end(err, result) {
      if (!err && params.defer) {
        return params.defer(result, function (e, r) {
          params.defer = null;
          result = r || result;
          end(e);
        });
      }
      if (err && params.error) {
        params.error(err, xhr);
      }
      if (!err && params.success) {
        params.success(result, xhr);
      }
      if (params.complete) {
        params.complete(result, xhr, err);
      }
      if (callback) {
        callback(err, result, xhr);
      }
    }

    // Set up our state change handlers.
    xhr.onreadystatechange = function () {
      var status = parseInt(xhr.status, 10);
      if (xhr.readyState === 4) {
        var raw_headers = xhr.getAllResponseHeaders(),
            lines = raw_headers.split(/\r\n|\r|\n|;/),
            resp_headers = {};
        lines.forEach(function (line) {
          var matches;
          line = line.trim();
          // Standard header format.
          matches = line.match(/^(.*)?: (.*)$/);
          if (matches) {
            resp_headers[matches[1].toLowerCase()] = matches[2];
          } else {
            // Sometimes headers come back from XHR with an = sign instead of a colon...
            matches = line.match(/^(.*)?=(.*)$/);
            if (matches) {
              resp_headers[matches[1].toLowerCase()] = matches[2];
            }
          }
        });

        client.process_response(method, url, data, status, xhr.responseText, headers, resp_headers, params, end);
      }
    };

    dataType = typeof params.data;

    // Finally, send out the request.
    if (dataType === 'string' || dataType === 'number') {
      data = params.data;
      client.log_request("info", method, url, headers, data);
      xhr.send(params.data);

    } else if (dataType === 'object' && Object.keys(params.data).length > 0) {
      // Data is guaranteed to be an object by this point.
      if (params.use_http_form_data) {
        data = URL.format({query: params.data}).substr(1);
      } else {
        data = JSON.stringify(params.data);
      }

      client.log_request("info", method, url, headers, data);
      xhr.send(data);

    } else {
      client.log_request("info", method, url, headers);
      xhr.send();
    }

    // Otherwise return null so the manager class can return itself for chaining.
    return;
  },

  get: function (params, callback) {
    params.method = "GET";
    return this.request(params, callback);
  },

  post: function (params, callback) {
    params.method = "POST";
    return this.request(params, callback);
  },

  head: function (params, callback) {
    params.method = "HEAD";
    return this.request(params, callback);
  },

  put: function (params, callback) {
    params.method = "PUT";
    return this.request(params, callback);
  },

  patch: function (params, callback) {
    params.method = "PATCH";
    return this.request(params, callback);
  },

  del: function (params, callback) {
    params.method = "DELETE";
    return this.request(params, callback);
  },

  // Authentication against the auth URL
  authenticate: function (params, callback) {
    var credentials = {},
        client = this;

    function authenticated(result, xhr) {
      if (result.token) {
        if (is_ans1_token(result.token.id)) {
          // Rewrite the token id as the MD5 hash since we can use that in place
          // of the full PKI-signed token (which is enormous).
          result.token.id = crypto.createHash('md5').update(result.token.id).digest("hex");
        }

        if (result.token.tenant) {
          client.scoped_token = result.token;
          client.service_catalog = result.serviceCatalog;
          client.tenant = result.token.tenant;
          client.user = result.user;
        }
        else {
          client.unscoped_token = result.token;
        }
      }

      if (callback) callback(null, result);
      if (params.success) params.success(client, xhr);
    }

    params = params || {};
    if (params.username && params.password) {
      credentials.auth = {
        "passwordCredentials" : {
          "username": params.username,
          "password": params.password
        }
      };
    }
    else if (params.token) {
      credentials.auth = {"token": {"id": params.token}};
    }
    if (params.project) {
      credentials.auth.tenantName = params.project;
    }

    this.post({
      url: urljoin(this.url, "/tokens"),
      data: credentials,
      result_key: "access",
      success: authenticated,
      error: function (err, xhr) {
        if (callback) callback(err);
        if (params.error) params.error(err);
      }
    });

    return this;
  }
});


var Manager = Class.extend({

  // Default endpoint type for API calls to talk to.
  endpoint_type: "internalURL",
  endpoint_type_backup: "publicURL",

  urljoin: urljoin,  // For convenience.

  init: function (client) {
    this.client = client;
    this.plural = this.plural || this.namespace;
    this.singular = this.singular || this.get_singular();

    // Mapping of manager CRUD types to client HTTP methods.
    // APIs that don't follow the common pattern can override this to
    // fit their API scheme.
    // This should be initialized for each manager to avoid conflicts.
    this.method_map = {
      create: "post",
      update: "put",
      get: "get",
      del: "del"
    };
  },

  // Convenience function that attempts to take english plural forms and
  // make them singular by removing the "s". This function exists so that
  // most plural and singular resource names can be derived from that single
  // "namespace" value on the manager class.
  get_singular: function () {
    if (this.plural.substr(-1) !== "s") {
      throw new Error("Could not automatically determine singular resource name.");
    }
    return this.plural.substr(0, this.plural.length - 1);
  },

  // Fetches the appropriate service endpoint from the service catalog.
  get_base_url: function (params) {
    var base = this.client.url_for(params.endpoint_type || this.endpoint_type);
    if (!base) this.client.url_for(params.endpoint_type_backup || this.endpoint_type_backup);
    return urljoin(base, this.prepare_namespace(params));
  },

  // Most of the APIs want data sent to them to be wrapped with the singular
  // form of the resource's name; this method allows customization of that
  // if necessary.
  prepare_data: function (data) {
    if (this.use_raw_data) return data;

    var wrapped_data = {};
    wrapped_data[this.singular] = data;
    return wrapped_data;
  },

  // Placeholder function which can be customized by subclasses for APIs
  // with complex or illogical API namespacing.
  prepare_namespace: function (params) {
    return this.namespace;
  },

  // Prepares common parameters to be passed to client.request().
  prepare_params: function (params, url, plural_or_singular) {
    params = params || {};
    params.url = params.url || url;
    // Allow false-y values for the result key.
    if (typeof(params.result_key) === "undefined") {
      params.result_key = params.result_key || this[plural_or_singular];
    }

    // Ensure that we only wrap the data object if data is present and
    // contains actual values.
    if (params.use_raw_data) {
      params.data = params.data;
    } else if (params.data && typeof params.data === "object" && Object.keys(params.data).length > 0) {
      params.data = this.prepare_data(params.data || {});
    } else {
      params.data = {};
    }
    return params;
  },

  normalize_id: function (params) {
    if (params.data && params.data.id) {
      params.id = params.data.id;
    }
    return params;
  },

  // READ OPERATIONS

  // Fetches a list of all objects available to the authorized user.
  // Default: GET to /<namespace>
  all: function (params, callback) {
    params.manager_method = "all";
    params = this.prepare_params(params, this.get_base_url(params), "plural");
    return this.client[params.http_method || this.method_map.get](params, callback);
  },

  // Fetches a single object based on the parameters passed in.
  // Default: GET to /<namespace>/<id>
  get: function (params, callback) {
    params.manager_method = "get";
    params = this.normalize_id(params);
    var url = urljoin(this.get_base_url(params), params.id);
    params = this.prepare_params(params, url, "singular");
    return this.client[params.http_method || this.method_map.get](params, callback);
  },

  // Fetches a list of objects based on the filter criteria passed in.
  // Default: GET to /<namespace>?<query params>
  filter: function (params) {
    throw new error.NotImplemented();
  },

  // Fetches a list of objects based on the filter criteria passed in.
  // Default *SHOULD BE BUT ISN'T*: GET to /<namespace>?<list of ids>
  // In reality the default is to mock this method with parallel get calls.
  in_bulk: function (params) {
    var manager = this,
        lookups = [],
        success = params.success,
        error = params.error;

    if (params.success) delete params.success;
    if (params.error) delete params.error;


    params.data.ids.forEach(function (id) {
      lookups.push(function (done) {
        var cloned_params = JSON.parse(JSON.stringify(params));
        delete cloned_params.data.ids;
        cloned_params.data.id = id;
        cloned_params.success = function (result, xhr) { return done(null, result); };
        cloned_params.error = function (err, xhr) { return done(err); };
        manager.get(cloned_params);
      });
    });

    async.parallel(lookups, function (err, results) {
      if (err && error) return error(err);
      if (success) success(results);
      return results;
    });
  },

  // WRITE OPERATIONS

  // Creates a new object.
  // Default: POST to /<namespace>
  create: function (params, callback) {
    params.manager_method = "create";
    params = this.prepare_params(params, this.get_base_url(params), "singular");
    return this.client[params.http_method || this.method_map.create](params, callback);
  },

  // Updates an existing object.
  // Default: POST to /<namespace>/<id>
  update: function (params, callback) {
    params.manager_method = "update";
    params = this.normalize_id(params);
    var url = urljoin(this.get_base_url(params), params.id);
    params = this.prepare_params(params, url, "singular");
    return this.client[params.http_method || this.method_map.update](params, callback);
  },

  // DELETE OPERATIONS

  // Deletes an object.
  // Default: DELETE to /<namespace>/<id>
  del: function (params, callback) {
    params.manager_method = "del";
    params = this.normalize_id(params);
    var url = urljoin(this.get_base_url(params), params.id);
    params = this.prepare_params(params, url, "singular");
    return this.client[params.http_method || this.method_map.del](params, callback);
  },

  // Method to initiate binary file transfers since the XMLHttpRequest
  // library currently tries to transfer everything as utf8, and browsers
  // don't support streaming transfers via XHR.
  _openBinaryStream: function (params, headers, token, callback) {
    var client = this.client;

    var matches = params.url.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i),
        host_and_port = matches[1].split(':');

    var options = {
      hostname: host_and_port[0],
      port: host_and_port[1],
      path: '/' + params.url.substring(matches[0].length),
      method: params.method,
      headers: {
        'X-Auth-Token': token
      }
    };

    // Create our XMLHttpRequest and set headers.
    for (var header in headers) {
      if (headers.hasOwnProperty(header)) {
        options.headers[header] = headers[header];
      }
    }

    // For our initial connection, simply indicate that the socket is ready.
    var request = http.request(options).on('socket', function (socket) {
      callback();
    });

    client.log('info', '\nREQ:', params.method, params.url);
    Object.keys(options.headers).forEach(function (key) {
      client.log('info', key + ":", options.headers[key]);
    });

    // Return a StreamingUpload object so we can continue writing to it.
    return new StreamingUpload(this.client, request, params);
  },
});

exports.Client = Client;
exports.Manager = Manager;
