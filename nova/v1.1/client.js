var base = require("../../client/base"),
    FlavorManager = require("./flavors"),
    ServerManager = require("./servers"),

    FloatingIPManager = require('./floating_ips'),

    ImageManager = require('./images'),
    QuotaManager = require('./quotas'),
    LimitManager = require('./limits'),
    KeypairManager = require('./keypairs');


var Nova = base.Client.extend({
  service_type: "compute",
  version: "1.1",

  init: function (options) {
    this._super(options);

    this.flavors = new FlavorManager(this);
    this.servers = new ServerManager(this);
    this.floating_ips = new FloatingIPManager(this);
    this.images = new ImageManager(this);
    this.quotas = new QuotaManager(this);
    this.limits = new LimitManager(this);
    this.keypairs = new KeypairManager(this);
  }
});

module.exports = Nova;
