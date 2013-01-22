var base = require("../../client/base");


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

  get: function (params) {
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
    return this._super(params);
  },

  bootable: function (params) {
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
    return this.all(params);
  }
});


module.exports = ImageManager;
