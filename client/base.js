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
    this.scoped_token = null;
    this.unscoped_token = null;
    this.service_catalog = [];
    this.tenant = null;
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
  request: function (params) {
    var xhr = new XMLHttpRequest(),
        client = this,
        async = true,
        token = this.scoped_token || this.unscoped_token,
        data, result, headers, method;

    if (typeof(params.async) !== "undefined") {
      async = params.async;
    }

    xhr.open(params.method, params.url, async);

    method = params.method.toUpperCase();

    headers = params.headers || {};
    headers["Content-Type"] = "application/json";
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

    // Set up our state change handlers.
    xhr.onreadystatechange = function () {
      var status = parseInt(xhr.status, 10);
      // Handle completed requests.
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
            }
          }
          if (params.success) {
            params.success(result, xhr);
          }
        }
        // Redirects are handled transparently by XMLHttpRequest.
        // Handle errors (4xx, 5xx)
        if (status >= 400) {
          if (params.error) {
            params.error(xhr);
          }
          client.log(xhr.responseText);
          var api_error, e = error.get_error(status);
          try {
            api_error = JSON.parse(xhr.responseText).error;
          }
          catch (problem) {
            api_error = xhr.responseText;
          }
          throw e.apply(e, [status, api_error]);
        }
      }
    };

    // Finally, send out the request.
    if (params.data) {
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

  get: function (params) {
    params.method = "GET";
    return this.request(params);
  },

  post: function (params) {
    params.method = "POST";
    return this.request(params);
  },

  head: function (params) {
    params.method = "HEAD";
    return this.request(params);
  },

  put: function (params) {
    params.method = "PUT";
    return this.request(params);
  },

  patch: function (params) {
    params.method = "PATCH";
    return this.request(params);
  },

  del: function (params) {
    params.method = "DELETE";
    return this.request(params);
  },

  // Authentication against the auth URL
  authenticate: function (params) {
    var credentials = {},
        client = this,
        result, authenticated;

    authenticated = function (result, xhr) {
      if (result.token.tenant) {
        if (is_ans1_token(result.token.id)) {
          // Rewrite the token id as the MD5 hash since we can use that in place
          // of the full PKI-signed token (which is enormous).
          result.token.id = crypto.createHash('md5').update(result.token.id).digest("hex");
        }
        client.scoped_token = result.token;
        client.service_catalog = result.serviceCatalog;
        client.tenant = result.token.tenant;
      }
      else {
        client.unscoped_token = result.token;
      }
    };

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
      async: false,
      success: authenticated
    });
    return this;
  }
});


var Manager = Class.extend({

  // Default endpoint type for API calls to talk to.
  endpoint_type: "publicURL",
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
    if (params.data) {
      params.data = this.prepare_data(params.data || {});
    }
    return params;
  },

  // READ OPERATIONS

  // Fetches a list of all objects available to the authorized user.
  // Default: GET to /<namespace>
  all: function (params) {
    params.manager_method = "all";
    params = this.prepare_params(params, this.get_base_url(params), "plural");
    return this.client[this.method_map.get](params) || this;
  },

  // Fetches a single object based on the parameters passed in.
  // Default: GET to /<namespace>/<id>
  get: function (params) {
    params.manager_method = "get";
    var url = urljoin(this.get_base_url(params), params.id);
    params = this.prepare_params(params, url, "singular");
    return this.client[this.method_map.get](params) || this;
  },

  // Fetches a list of objects based on the filter criteria passed in.
  // Default: GET to /<namespace>?<query params>
  filter: function (params) {
    throw error.NotImplemented;
  },

  // Fetches a list of objects based on the filter criteria passed in.
  // Default: GET to /<namespace>?<list of ids>
  in_bulk: function (params) {
    throw error.NotImplemented;
  },

  // WRITE OPERATIONS

  // Creates a new object.
  // Default: POST to /<namespace>
  create: function (params) {
    params.manager_method = "create";
    params = this.prepare_params(params, this.get_base_url(params), "singular");
    return this.client[this.method_map.create](params) || this;
  },

  // Updates an existing object.
  // Default: POST to /<namespace>/<id>
  update: function (params) {
    params.manager_method = "update";
    var url = urljoin(this.get_base_url(params), params.id);
    params = this.prepare_params(params, url, "singular");
    return this.client[this.method_map.update](params) || this;
  },

  // DELETE OPERATIONS

  // Deletes an object.
  // Default: DELETE to /<namespace>/<id>
  del: function (params) {
    params.manager_method = "del";
    var url = urljoin(this.get_base_url(params), params.id);
    params = this.prepare_params(params, url, "singular");
    return this.client[this.method_map.del](params) || this;
  }
});

exports.Client = Client;
exports.Manager = Manager;
