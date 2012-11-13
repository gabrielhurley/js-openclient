var base = require("../../client/base"),
    error = require("../../client/error");

// TODO(roland): Make methods throw NotImplemented where applicable.

var VolumeManager = base.Manager.extend({
  namespace: "volumes"
});


module.exports = VolumeManager;
