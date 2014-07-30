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
    var key_value_pairs = {},
        openstack_params = {
          name: params.data.name,
          extra_specs: {
            'custom:description': params.data.description
          }
        },
        iteration;

    for (iteration in params.data) {
      if (params.data.hasOwnProperty(iteration) && (iteration.indexOf('extra_specs') >= 0)) {
        var match_array           = iteration.match(/extra_specs\[(\d+)\]/),
            index_number          = match_array[(match_array.length - 1)],
            attribute_match_array = iteration.match(/extra_specs\[\d+\]\[(.+)\]/),
            attribute             = attribute_match_array[(attribute_match_array.length - 1)];

        if (!key_value_pairs.hasOwnProperty(index_number)) key_value_pairs[index_number] = {};

        key_value_pairs[index_number][attribute] = params.data[iteration];
      }
    }

    for (iteration in key_value_pairs) {
      if (key_value_pairs.hasOwnProperty(iteration)) {
        var kv_pair = key_value_pairs[iteration];

        // Add the values to extra_specs if it has a key and a value...
        if (!!kv_pair['key'] && !!kv_pair['value']) {
          openstack_params.extra_specs[kv_pair['key']] = kv_pair['value'];
        }
      }
    }

    params.data = openstack_params; // Reassign the formatted data to our params.

    return this._super(params, callback);
  },

  update: function (params) { throw new error.NotImplemented(); }

});


module.exports = TypeManager;