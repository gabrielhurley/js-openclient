var async = require("async"),
    base = require("../../client/base"),
    urljoin = require("../../client/utils").urljoin,
    ProjectManager = require("./projects"),
    RoleManager = require("./roles"),
    UserManager = require("./users"),
    ProjectMembershipManager = require("./membership"),
    UserRoleManager = require("./user_roles"),
    EC2Manager = require("./ec2");


var Keystone = base.Client.extend({
  service_type: "identity",
  version: "2.0",

  init: function (options) {
    this._super(options);
    this.projects = new ProjectManager(this);
    this.roles = new RoleManager(this);
    this.users = new UserManager(this);
    this.user_roles = new UserRoleManager(this);
    this.membership = new ProjectMembershipManager(this);
    this.ec2 = new EC2Manager(this);
  }
});

module.exports = Keystone;
