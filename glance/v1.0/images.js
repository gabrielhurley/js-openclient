var base = require("../../client/base"),
    error = require("../../client/error");


function _image_meta_to_headers(data) {
  var headers = {},
      non_meta_props = ['name', 'is_public', 'disk_format', 'container_format', 'protected'];

  data = data || {};
  data.properties = data.properties || {};

  (Object.keys(data)).forEach(function (key) {
    if (key === "id" || key === "properties") return;

    if (non_meta_props.indexOf(key) !== -1) {
      headers['x-image-meta-' + key] = "" + data[key];
    } else {
      headers['x-image-meta-property-' + key] = "" + data[key];
    }
  });

  (Object.keys(data.properties)).forEach(function (key) {
    headers['x-image-meta-property-' + key] = "" + data.properties[key];
  });

  headers['x-glance-registry-purge-props'] = "false";

  return headers;
}


var ImageManager = base.Manager.extend({
  namespace: "images",

  prepare_namespace: function (params) {
    return "v" + this.client.version + "/" + this.namespace;
  },

  get_base_url: function (params) {
    var base_url = this._super(params);
    if (!params.id && params.manager_method !== 'create') {  // If this is a "list" call...
      base_url = this.urljoin(base_url, 'detail');  // Always fetch the details.
    }
    return base_url;
  },

  create: function (params, callback) {
    var manager = this,
        success = params.success;

    params.data = params.data || {};

    // Glance does not really do anything with container_format at the
    // moment. It requires it is set to the same disk_format for the three
    // Amazon image types, otherwise it just treats them as 'bare.' As such
    // we will just set that to be that here instead of bothering the user
    // with asking them for information we can already determine.
    if (['ami', 'aki', 'ari'].indexOf(params.data.disk_format) >= 0) {
      params.data.container_format = params.data.disk_format;
    } else {
      params.data.container_format = 'bare';
    }

    params.method = "POST";
    params.manager_method = 'create';
    params.id = params.id || params.data.id;
    params.headers = _image_meta_to_headers(params.data);
    params.allow_headers = true;
    params.headers['Content-Type'] = 'application/octet-stream';
    params.url = this.get_base_url(params);
    params.result_key = this.singular;
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

    uploader.success = function (result, success_callback) {
      success_callback(null, result, {status: 200});
    };

    return uploader;
  },

  del: function (params, callback) {
    if (params.data) delete params.data;
    params.headers = params.headers || {};
    params.allow_headers = true;
    params.headers['Content-Type'] = 'application/octet-stream';
    params.headers['Content-Length'] = 0;
    this._super(params, callback);
  },

  update: function (params, callback) {
    params.id = params.id || params.data.id;
    params.headers = _image_meta_to_headers(params.data);
    params.allow_headers = true;
    params.headers['Content-Type'] = 'application/octet-stream';
    params.headers['Content-Length'] = 0;
    delete params.data;
    this._super(params, callback);
  },

  get: function (params, callback) {
    params.http_method = "head";

    params.parseHeaders = function (headers) {
      var result = {properties: {}},
          lines = headers;

      Object.keys(headers).forEach(function (key) {
        if (key.indexOf("x-image-meta-") === 0) {
          if (key.indexOf("x-image-meta-property-") === 0) {
            result.properties[key.replace("x-image-meta-property-", "")] = headers[key];
          } else {
            result[key.replace("x-image-meta-", "")] = headers[key];
          }
        }
      });

      return result;
    };
    this._super(params, callback);
  },

  all: function (params, callback) {
    params.query = params.query || {};
    if (typeof params.query.all_tenants !== "undefined") {
      if (params.query.all_tenants) params.query.is_public = "None";
      delete params.query.all_tenants;
    }
    this._super(params, callback);
  },

  bootable: function (params, callback) {
    var manager = this;
    params.parseResult = function (result) {
      var filtered = [],
          non_bootable = ['ari', 'aki'];

      result.forEach(function (item) {
        if (non_bootable.indexOf(item.container_format) !== -1) return;
        if (item.status.toLowerCase() !== "active") return;
        filtered.push(item);
      });
      return filtered;
    };
    this.all(params, callback);
  }
});


module.exports = ImageManager;
