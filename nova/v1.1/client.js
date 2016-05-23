var base = require("../../client/base");

var AZManager = require("./availability_zones"),
    CertsManager = require("./certs"),
    FlavorManager = require("./flavors"),
    FloatingIPManager = require('./floating_ips'),
    FloatingIPPoolManager = require('./floating_ip_pools'),
    ImageManager = require('./images'),
    KeypairManager = require('./keypairs'),
    LimitManager = require('./limits'),
    NetworkManager = require('./networks'),
    QuotaManager = require('./quotas'),
    SecurityGroupManager = require('./security_groups'),
    SecurityGroupRuleManager = require('./security_group_rules'),
    SecurityGroupDefaultRuleManager = require('./security_group_default_rules'),
    ServerManager = require("./servers");


var Nova = base.Client.extend({
  service_type: "compute",
  version: "1.1",

  init: function (options) {
    this._super(options);

    this.availability_zones = new AZManager(this);
    this.certs = new CertsManager(this);
    this.flavors = new FlavorManager(this);
    this.floating_ips = new FloatingIPManager(this);
    this.floating_ip_pools = new FloatingIPPoolManager(this);
    this.images = new ImageManager(this);
    this.keypairs = new KeypairManager(this);
    this.limits = new LimitManager(this);
    this.networks = new NetworkManager(this);
    this.quotas = new QuotaManager(this);
    this.security_groups = new SecurityGroupManager(this);
    this.security_group_rules = new SecurityGroupRuleManager(this);
    this.security_group_default_rules = new SecurityGroupDefaultRuleManager(this);
    this.servers = new ServerManager(this);
  }
});

module.exports = Nova;
