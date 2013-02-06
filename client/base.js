var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest,
    async = require("async"),
    Class = require("./inheritance").Class,
    crypto = require('crypto'),
    error = require("./error"),
    urljoin = require("./utils").urljoin,
    is_ans1_token = require("./utils").is_ans1_token;


var Client = Class.extend({

  // Base client version
  VERSION: "1.0",
  redacted: ['password'],

  init: function (options) {
    options = options || {};
    this.debug = options.debug || false;
    this.url = options.url;
    this.scoped_token = options.scoped_token || null;
    this.unscoped_token = options.unscoped_token || null;
    this.service_catalog = options.service_catalog || [];
    this.tenant = options.project || null;
    this.user = options.user || null;
  },

  // Generic logging placeholder.
  // TODO(gabriel): Make this better.
  log: function () {
    if (this.debug) {
      console.log(Array.prototype.slice.apply(arguments).join(" "));
    }
  },

  redact: function (json_string) {
    for (var i = 0; i < this.redacted.length; i++) {
      var re = new RegExp('("' + this.redacted[i] + '":\\s?)"(([^\\"]|\\\\|\\")*)"', "g");
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
  url_for: function (endpoint_type) {
    for (var i = 0; i < this.service_catalog.length; i++) {
      if (this.service_catalog[i].type === this.service_type) {
        return this.service_catalog[i].endpoints[0][endpoint_type];
      }
    }
    return this.url;
  },

  // Core method for making requests to API endpoints.
  // All other methods eventually route back to this one.
  request: function (params, callback) {
    var xhr = new XMLHttpRequest(),
        client = this,
        async = true,
        token = this.scoped_token || this.unscoped_token,
        data,
        result,
        headers,
        method;

    if (typeof params.async === 'boolean') {
      async = params.async;
    }

    // This is mainly necessary due to Glance needing the Content-Length
    // header set on PUT requests, but xmlhttprequest only setting it for POST.
    if (params.allow_headers) xhr.setDisableHeaderCheck(true);

    xhr.open(params.method, params.url, async);

    method = params.method.toUpperCase();

    headers = params.headers || {};
    if (!headers["Content-Type"]) headers["Content-Type"] = "application/json";
    headers.Accept = "application/json";

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

    function end(err) {
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
        // Log the response regardless of what it is.
        client.log("\nRES:", method, params.url,
                   "\nstatus:", status,
                   async ? "\n" + xhr.getAllResponseHeaders() : "",
                   "\nbody:", xhr.responseText);

        // Response handling.
        // Ignore informational codes for now (1xx).
        // Handle successes (2xx).
        if (status >= 200 && status < 300) {
          if (xhr.responseText) {
            result = JSON.parse(xhr.responseText);

            if (result && params.result_key) {
              result = result[params.result_key];
              if (params.parseResult) {
                result = params.parseResult(result);
              }
            }
          } else {
            if (params.parseHeaders) {
              result = params.parseHeaders(xhr);
            }
          }

          end();
        }

        // Redirects are handled transparently by XMLHttpRequest.
        // Handle errors (4xx, 5xx)
        if (status >= 400) {
          client.log(xhr.responseText);

          var api_error,
              message,
              Err = error.get_error(status),
              err;

          try {
            api_error = JSON.parse(xhr.responseText).error;
            message = api_error.message;
          }
          catch (problem) {
            message = xhr.responseText;
          }

          err = new Err(status, message);

          if (async) {
            end(err);
          } else {
            throw err;
          }
        }
      }
    };

    // Finally, send out the request.
    if (params.data && Object.keys(params.data).length > 0) {  // Data is guaranteed to be an object by this point.
      data = JSON.stringify(params.data);
      this.log("\nREQ:", method, params.url,
               this.format_headers(headers),
               "\nbody:", this.redact(data));
      xhr.send(data);
    } else {
      this.log("\nREQ:", method, params.url, this.format_headers(headers));
      xhr.send();
    }

    // If this call is synchronous, return the result.
    if (!async) {
      return result;
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
      async: params.async
    }, callback);
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
    if (params.data && typeof params.data === "object" && Object.keys(params.data).length > 0) {
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
    return this.client[params.http_method || this.method_map.get](params, callback) || this;
  },

  // Fetches a single object based on the parameters passed in.
  // Default: GET to /<namespace>/<id>
  get: function (params, callback) {
    params.manager_method = "get";
    params = this.normalize_id(params);
    var url = urljoin(this.get_base_url(params), params.id);
    params = this.prepare_params(params, url, "singular");
    return this.client[params.http_method || this.method_map.get](params, callback) || this;
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
    return this.client[params.http_method || this.method_map.create](params, callback) || this;
  },

  // Updates an existing object.
  // Default: POST to /<namespace>/<id>
  update: function (params, callback) {
    params.manager_method = "update";
    params = this.normalize_id(params);
    var url = urljoin(this.get_base_url(params), params.id);
    params = this.prepare_params(params, url, "singular");
    return this.client[params.http_method || this.method_map.update](params, callback) || this;
  },

  // DELETE OPERATIONS

  // Deletes an object.
  // Default: DELETE to /<namespace>/<id>
  del: function (params, callback) {
    params.manager_method = "del";
    params = this.normalize_id(params);
    var url = urljoin(this.get_base_url(params), params.id);
    params = this.prepare_params(params, url, "singular");
    return this.client[params.http_method || this.method_map.del](params, callback) || this;
  }
});

exports.Client = Client;
exports.Manager = Manager;
