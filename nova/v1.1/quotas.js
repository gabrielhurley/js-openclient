var async = require('async'),
    base = require("../../client/base"),
    error = require("../../client/error");

// TODO(roland): Make methods throw NotImplemented where applicable.

var QuotaManager = base.Manager.extend({
  namespace: "os-quota-sets",
  singular: 'quota_set',
  plural: 'quota_sets',

  usages: function (params) {
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
        manager.client.servers.all({detail: true}, function (err, results) {
          if (err) {
            return next(err);
          }
          instances = results;
          next();
        });
      },
      function (next) {
        manager.client.flavors.all({detail: true}, function (err, results) {
          if (err) {
            return next(err);
          }
          results.forEach(function (flavor) {
            flavors[flavor.id] = flavor;
          });
          next();
        });
      }
    ], function (err) {
      if (err && params.error) {
        return params.error(err);
      }

      instances.forEach(function (instance) {
        var flavor = flavors[instance.flavor.id];

        usages.vcpus += flavor.vcpus;
        usages.cores += flavor.vcpus;
        usages.ram += flavor.ram;
      });

      return params.success(usages);
    });
  }
});


module.exports = QuotaManager;
