var base = require("../../client/base"),
    error = require("../../client/error");

// TODO(roland): Make methods throw NotImplemented where applicable.

var QuotaManager = base.Manager.extend({
  namespace: "os-quota-sets",
  singular: 'quota_set',
  plural: 'quota_sets',

  _quota_names: ["volumes", "gigabytes"],

  update: function (params, callback) {
    params.id = params.id || params.data.id;

    // Treat blank values as "unlimited" and set them to -1.
    this._quota_names.forEach(function (name) {
      var val = params.data[name];
      if (typeof val !== "undefined" && val !== 0 && !val) params.data[name] = -1;
    });

    params.parseResult = function (result) {
      result.id = params.id;
      return result;
    };

    this._super(params, callback);
  },

  usages: function (params, callback) {
    var usages = {},
        flavors = {},
        volumes = [];

    usages.id = this.client.tenant.id;
    usages.gigabytes = 0;
    usages.disk = 0;

    this.client.volumes.all({
      detail: true,
      success: function (volumes) {
        volumes.forEach(function (volume) {
          usages.gigabytes += volume.size;
          usages.disk += volume.size;
        });
        if (callback) callback(null, usages);
        return params.success(usages);
      },
      error: function (err) {
        if (callback) callback(err);
        return params.error(err);
      }
    });
  }
});


module.exports = QuotaManager;
