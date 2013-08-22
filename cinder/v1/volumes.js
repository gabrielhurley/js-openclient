var async = require('async'),
    base = require("../../client/base"),
    error = require("../../client/error"),
    urljoin = require("../../client/utils").urljoin;


var VolumeManager = base.Manager.extend({
  namespace: "volumes",

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

  _action: function (params, action, info, callback) {
    var url = urljoin(this.get_base_url(params), params.id || params.data.id, "action");
    if (params.data && params.data.id) delete params.data.id;
    params = this.prepare_params(params, url, "singular");
    params.data[action] = info || null;
    return this.client.post(params, callback);
  },

  attach: function (params, callback) {
    // NOTE: THIS DOES NOT MIRROR PYTHON-CINDERCLIENT'S ATTACH METHOD.
    // Unlike python-cinderclient, this method *actually* attaches the
    // volume to the instance.
    var Nova = require("../../nova/v1.1/client");  // Avoid circular imports.

    var nova = new Nova(this.client);

    params.data.volumeId = params.id || params.data.id;
    params.id = params.data.instance_uuid;
    params.data.device = params.data.mountpoint || null;

    if (params.data.id) delete params.data.id;
    delete params.data.instance_uuid;

    return nova.servers.attach(params, callback);
  },

  detach: function (params, callback) {
    // NOTE: THIS DOES NOT MIRROR PYTHON-CINDERCLIENT'S DETACH METHOD.
    // Unlike python-cinderclient, this method *actually* detaches the
    // volume from the instance.
    var Nova = require("../../nova/v1.1/client");  // Avoid circular imports.

    var manager = this,
        nova = new Nova(this.client),
        vol_id = params.id || params.data.id;

    if (!params.data || !params.data.instance_uuid) {
      // Get volume w/ all attachments.
      manager.get({
        id: vol_id,
        success: function (volume) {
          // Detach all of them in parallel.
          if (volume.attachments.length) {
            var calls = [];

            volume.attachments.forEach(function (attachment) {
              calls.push(function (next) {
                nova.servers.detach({
                  id: attachment.server_id,
                  data: {
                    volumeId: vol_id
                  },
                  success: function () {
                    next(null);
                  },
                  error: function (err) {
                    next(err);
                  }
                });
              });
            });

            async.parallel(calls, function (err) {
              // TODO: preserve original error status code
              if (err) return manager.safe_complete(err, null, null, params, callback);
              manager.safe_complete(null, null, {status: 202}, params, callback);
            });
          } else {
            manager.safe_complete(null, null, {status: 202}, params, callback);
          }
        },
        error: function (err, xhr) {
          manager.safe_complete(err, null, xhr, params, callback);
        }
      });
    } else {
      return nova.servers.detach({
        id: params.data.instance_uuid,
        data: {
          volumeId: vol_id
        },
        success: params.success,
        error: params.error
      }, callback);
    }
  }

});


module.exports = VolumeManager;
