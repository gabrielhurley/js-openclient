var base = require("../../client/base"),
    VolumeManager = require('./volumes'),
    SnapshotManager = require('./snapshots'),
    QuotaManager = require('./quotas'),
    AZManager = require('./availability_zones'),
    TypeManager = require('./types'),
    LimitManager = require('./limits');

var Cinder = base.Client.extend({
  service_type: "volume",
  version: "1",

  init: function (options) {
    this._super(options);

    this.volumes = new VolumeManager(this);
    this.snapshots = new SnapshotManager(this);
    this.quotas = new QuotaManager(this);
    this.limits = new LimitManager(this);
    this.availability_zones = new AZManager(this);
    this.types = new TypeManager(this);
  }
});

module.exports = Cinder;
