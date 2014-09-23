var base = require("../../client/base"),
    error = require("../../client/error");


var TypeManager = base.Manager.extend({
  namespace: "types",
  plural: "volume_types",

  all: function (params, callback) {
    params.parseResult = function (types) {
      var changed_types = [];

      types.forEach(function (type) {
        if (type.extra_specs && type.extra_specs['custom:description']) {
          type.description = type.extra_specs['custom:description'];
          delete type.extra_specs['custom:description'];
        }

        changed_types.push(type);
      });

      return changed_types;
    };

    return this._super(params, callback);
  },

  create: function (params, callback) {
    // Set the custom description only if there is one (zeros count here...)
    if (params.data.description || params.data.description === 0) {
      params.data.extra_specs['custom:description'] = params.data.description;
      delete params.data.description;
    }

    return this._super(params, callback);
  },

  update: function (params) { throw new error.NotImplemented(); }

});


module.exports = TypeManager;
