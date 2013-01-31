var base = require("../../client/base"),
    error = require("../../client/error");

// TODO(roland): Make methods throw NotImplemented where applicable.

var VolumeManager = base.Manager.extend({
  namespace: "volumes",

  get_base_url: function (params) {
    var base_url = this._super(params);
    if (params.detail) {
      base_url = this.urljoin(base_url, 'detail');
    }
    return base_url;
  },

  all: function (params) {
    if (typeof params.detail === "undefined") params.detail = true;
    return this._super(params);
  }
});


module.exports = VolumeManager;
