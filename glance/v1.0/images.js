var base = require("../../client/base"),
    error = require("../../client/error");


function _image_meta_to_headers(data) {
  var headers = {},
      non_meta_props = ['name', 'is_public', 'disk_format', 'container_format'];

  data = data || {};

  (Object.keys(data)).forEach(function (key) {
    if (key === "id") return;

    if (non_meta_props.indexOf(key) !== -1) {
      headers['x-image-meta-' + key] = "" + data[key];
    } else {
      headers['x-image-meta-property-' + key] = "" + data.properties[key];
    }
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
    if (!params.id) {  // If this is a "list" call...
      base_url = this.urljoin(base_url, 'detail');  // Always fetch the details.
    }
    return base_url;
  },

  create: function (params) { throw new error.NotImplemented(); },

  update: function (params, callback) {
    params.id = params.id || params.data.id;
    params.headers = _image_meta_to_headers(params.data);
    params.allow_headers = true;
    params.headers['Content-Type'] = 'application/octet-stream';
    params.headers['Content-Length'] = 0;
    delete params.data;
    return this._super(params, callback);
  },

  get: function (params, callback) {
    params.http_method = "head";

    params.parseHeaders = function (xhr) {
      var result = {properties: {}},
          lines = xhr.getAllResponseHeaders().split(/\r\n|\r|\n/);

      lines.forEach(function (line) {
        var matches = line.match(/x-image-meta-(.*)?: (.*)/);
        if (matches) {
          if (matches[1].indexOf('property-') === 0) {
            result.properties[matches[1].substring(9)] = matches[2];
          } else {
            result[matches[1]] = matches[2];
          }
        }
      });

      return result;
    };
    return this._super(params, callback);
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
        if (non_bootable.indexOf(item.container_format) === -1) {
          filtered.push(item);
        }
      });
      return filtered;
    };
    return this.all(params, callback);
  }
});


module.exports = ImageManager;
