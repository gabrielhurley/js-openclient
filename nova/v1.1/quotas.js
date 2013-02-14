var async = require('async'),
    base = require("../../client/base"),
    error = require("../../client/error");

// TODO(roland): Make methods throw NotImplemented where applicable.

var QuotaManager = base.Manager.extend({
  namespace: "os-quota-sets",
  singular: 'quota_set',
  plural: 'quota_sets',

  usages: function (params, callback) {
    var manager = this,
        usages = {},
        flavors = {},
        instances = [];

    usages.id = this.client.tenant.id;
    usages.cores = 0;
    usages.vcpus = 0;
    usages.ram = 0;

    async.parallel([
      function (next) {
        manager.client.servers.all({
          detail: true,
          success: function (results) {
            instances = results;
            next(null);
          },
          error: next
        });
      },
      function (next) {
        manager.client.flavors.all({
          detail: true,
          success: function (results) {
            results.forEach(function (flavor) {
              flavors[flavor.id] = flavor;
            });
            next(null);
          },
          error: next
        });
      }
    ], function (err) {
      if (err) {
        if (callback) callback(err);
        if (params.error) params.error(err);
        return;
      }

      instances.forEach(function (instance) {
        var flavor = flavors[instance.flavor.id];

        usages.vcpus += flavor.vcpus;
        usages.cores += flavor.vcpus;
        usages.ram += flavor.ram;
      });

      if (callback) callback(null, usages);
      return params.success(usages);
    });
  }
});


module.exports = QuotaManager;
