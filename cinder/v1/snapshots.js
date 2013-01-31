var base = require("../../client/base"),
    error = require("../../client/error");

// TODO(roland): Make methods throw NotImplemented where applicable.

var SnapshotManager = base.Manager.extend({
  namespace: "snapshots"
});


module.exports = SnapshotManager;
