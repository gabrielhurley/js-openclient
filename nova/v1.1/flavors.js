var async = require('async'),
    base = require("../../client/base"),
    error = require("../../client/error");


var FlavorManager = base.Manager.extend({
  namespace: "flavors",

  get_base_url: function (params) {
    var base_url = this._super(params);
    if (params.manager_method === "all") {
      base_url = this.urljoin(base_url, 'detail');  // Always fetch the details.
    }
    return base_url;
  },

  all: function (params, callback) {
    params.query = params.query || {};
    if (typeof params.query.all_tenants !== "undefined") {
      if (params.query.all_tenants) params.query.is_public = "None";
      delete params.query.all_tenants;
    }
    this._super(params, callback);
  },

  get: function (params, callback) {
    var manager = this;

    params.id = params.id || params.data.id;

    if (params.include_deleted) {
      this._super(params, callback);
    } else {
      this.all({}, function (err, flavors, xhr) {
        if (err) {
          manager.safe_complete(err, null, xhr, params, callback);
        } else {
          var found_flavor;

          flavors.forEach(function (flavor) {
            if (found_flavor) return;
            if (flavor.id === params.id) found_flavor = flavor;
          });

          if (found_flavor) {
            manager.safe_complete(err, found_flavor, {status: 200}, params, callback);
          } else {
            var error = {
              message: "Flavor not found",
              status: 404
            };
            manager.safe_complete(error, null, {status: 404}, params, callback);
          }
        }
      });
    }
  },

  update: function (params, callback) {
    var manager = this;

    params.id = params.id || params.data.id;

    if (params.data.id) delete params.data.id;

    this.del({
      id: params.id,
      success: function () {
        manager.create({
          data: params.data,
          success: function (flavor, xhr) {
            manager.safe_complete(null, flavor, xhr, params, callback);
          },
          error: function (err, xhr) {
            manager.safe_complete(err, null, xhr, params, callback);
          }
        });
      },
      error: function (err, xhr) {
        manager.safe_complete(err, null, xhr, params, callback);
      }
    });
  },

  // Gets all the flavors that are actually in use by the current project,
  // including "deleted" flavors still referenced by active instances.
  in_use: function (params, callback) {
    var manager = this,
        usages = {},
        flavors = [],
        flavors_map = {},
        instances = params.instances || [];

    async.parallel([
      function (next) {
        // If our instances list is pre-populated then skip a new lookup.
        if (instances.length) return next();
        // Otherwise fetch all the instances.
        manager.client.servers.all({
          query: {
            all_tenants: true  // Doesn't hurt anything for a non-admin call.
          },
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
          query: {
            all_tenants: true  // Doesn't hurt anything for a non-admin call.
          },
          success: function (results) {
            flavors = results;
            results.forEach(function (flavor) {
              flavors_map[flavor.id] = flavor;
            });
            next(null);
          },
          error: next
        });
      }
    ], function (err) {
      if (err) return manager.safe_complete(err, null, null, params, callback);

      var missing_flavor_calls = [];
      // Fetch any "deleted" flavors which may still be referened
      // by active instances. This can currently only be done by
      // a GET request for each flavor individually.
      instances.forEach(function (instance) {
        if (!flavors_map[instance.flavor.id]) {
          missing_flavor_calls.push(function (next) {
            manager.client.flavors.get({id: instance.flavor.id, include_deleted: true}, function (err, result) {
              if (err) return next(err);
              flavors.push(result);
              flavors[result.id] = result;
              next();
            });
          });
        }
      });

      async.parallel(missing_flavor_calls, function (err) {
        if (err) return manager.safe_complete(err, null, null, params, callback);
        manager.safe_complete(err, flavors, {status: 200}, params, callback);
      });
    });
  }
});


module.exports = FlavorManager;
