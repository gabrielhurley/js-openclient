var base = require("../../client/base"),
    error = require("../../client/error");


var AZManager = base.Manager.extend({
  namespace: "os-availability-zone",
  plural: "availabilityZoneInfo",
  singular: "availabilityZoneInfo",

  get_base_url: function (params) {
    var base_url = this._super(params);
    // NOTE: /detail is admin-only.
    if (params.detail) {
      base_url = this.urljoin(base_url, 'detail');
    }
    return base_url;
  },

  all: function (params, callback) {
    if (typeof params.parseResult !== "function") {
      params.parseResult = function (zones) {
        zones.forEach(function (zone) {
          zone.id = zone.zoneName;
        });
        return zones;
      };
    }
    return this._super(params, callback);
  },

  available: function (params, callback) {
    params.parseResult = function (zones) {
      var available_zones = [];
      zones.forEach(function (zone) {
        if (zone.zoneState.available) {
          zone.id = zone.zoneName;
          available_zones.push(zone);
        }
      });
      return available_zones;
    };
    this.all(params, callback);
  },

  get: function (params) { throw new error.NotImplemented(); },
  delete: function (params) { throw new error.NotImplemented(); },
  create: function (params) { throw new error.NotImplemented(); },
  update: function (params) { throw new error.NotImplemented(); }

});


module.exports = AZManager;
