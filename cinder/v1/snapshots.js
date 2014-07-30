var base = require("../../client/base"),
    error = require("../../client/error");

// TODO(roland): Make methods throw NotImplemented where applicable.

var SnapshotManager = base.Manager.extend({
  namespace: "snapshots",

  get_base_url: function (params) {
    var base_url = this._super(params);
    if (params.detail) {
      base_url = this.urljoin(base_url, 'detail');
    }
    return base_url;
  },

  all: function (params, callback) {
    if (typeof params.detail === "undefined") params.detail = true;
    return this._super(params, callback);
  },

  _rpc_to_api: function (rpc) {
    // Utility method to convert an RPC "notification"-style object into one
    // which resembles data returned by the API for compatibility purposes.
    var api = {};
    api.id = rpc.snapshot_id;
    api.volume_id = rpc.volume_id;
    api.display_name = rpc.display_name;
    api.created_at = rpc.created_at.replace(/\s/g, '').replace(/(\d{4})-(\d{2})-(\d{2})([\d:]+)+.*/, "$1-$2-$3T$4Z");
    api.size = rpc.size;
    api.snapshot_id = rpc.snapshot_id;
    api.status = rpc.status;
    api["os-vol-tenant-attr:project_id"] = rpc.tenant_id;
    return api;
  }

});


module.exports = SnapshotManager;
