var base = require("../../client/base"),
    error = require("../../client/error");

// TODO(roland): Make methods throw NotImplemented where applicable.

var QuotaManager = base.Manager.extend({
  namespace: "os-quota-sets",
  singular: 'quota_set',
  plural: 'quota_sets',

  usages: function (params) {
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
        return params.success(usages);
      },
      error: function (err) {
        return params.error(err);
      }
    });
  }
});


module.exports = QuotaManager;
