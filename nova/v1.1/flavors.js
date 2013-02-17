var base = require("../../client/base"),
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

  get: function (params, callback) {
    params.id = params.id || params.data.id;

    if (params.include_deleted) {
      this._super(params, callback);
    } else {
      this.all({}, function (err, flavors, xhr) {
        if (err) {
          if (callback) callback(err, xhr);
          if (params.error) params.error(err, xhr);
        } else {
          var found_flavor;

          flavors.forEach(function (flavor) {
            if (found_flavor) return;
            if (flavor.id === params.id) found_flavor = flavor;
          });

          if (found_flavor) {
            if (callback) callback(null, found_flavor, {status: 200});
            if (params.error) params.success(found_flavor, {status: 200});
          } else {
            var error = {
              message: "Flavor not found",
              status: 404
            };
            if (callback) callback(error, null, {status: 404});
            if (params.error) params.error(error, {status: 404});
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
            if (callback) callback(null, flavor, xhr);
            if (params.success) params.success(flavor, xhr);
          },
          error: function (err, xhr) {
            if (callback) callback(err, xhr);
            if (params.error) params.error(err, xhr);
          }
        });
      },
      error: function (err, xhr) {
        if (callback) callback(err, xhr);
        if (params.error) params.error(err, xhr);
      }
    });
  }
});


module.exports = FlavorManager;
