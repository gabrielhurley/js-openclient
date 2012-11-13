var base = require("../../client/base"),
    error = require("../../client/error");

// TODO(roland): Make methods throw NotImplemented where applicable.

var QuotaManager = base.Manager.extend({
  namespace: "os-quota-sets",
  singular: 'quota_set',
  plural: 'quota_sets'// TODO(roland): is this right?
});


module.exports = QuotaManager;
