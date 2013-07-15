var base = require("../../client/base"),
    error = require("../../client/error");


var TypeManager = base.Manager.extend({
  namespace: "types",
  plural: "volume_types",

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

  get: function (params) { throw new error.NotImplemented(); },
  delete: function (params) { throw new error.NotImplemented(); },
  create: function (params) { throw new error.NotImplemented(); },
  update: function (params) { throw new error.NotImplemented(); }

});


module.exports = TypeManager;
