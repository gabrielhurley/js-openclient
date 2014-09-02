var v2_client                      = require("../v2.0/client"),
    ProjectAssignableManager       = require("./project_assignables");
    UserRolesManager               = require("./user_roles"),
    GroupUsersManager              = require("./group_users"),
    GroupProjectMembershipManager  = require("./group_project_membership"),
    GroupsManager                  = require("./groups"),
    GroupRolesManager              = require("./group_roles"),
    ProjectGroupMembershipManager  = require("./project_group_membership"),
    ProjectUserMembershipManager   = require("./project_user_membership"),
    CombinedMembershipManager      = require("./combined_membership"),
    RoleAssignmentsManager         = require("./role_assignments"),
    ProjectManager                 = require("./projects");

var Keystone = v2_client.extend({
  service_type: "identity",
  version: "3.0",
  version_overrides: {
    "identity": [
      ["v2.0", "v3"]
    ]
  },

  init: function (options) {
    this._super(options);
    this.projects = new ProjectManager(this);
    this.user_roles = new UserRolesManager(this);

    this.group_users         = new GroupUsersManager(this);
    this.groups              = new GroupsManager(this);
    this.group_roles         = new GroupRolesManager(this);
    this.role_assignments    = new RoleAssignmentsManager(this);
    this.project_assignables = new ProjectAssignableManager(this.users, this.groups);

    this.project_user_memberships     = new ProjectUserMembershipManager(this.users, this.user_roles, this.role_assignments);
    this.project_group_memberships    = new ProjectGroupMembershipManager(this.groups, this.group_roles, this.role_assignments);
    this.project_combined_memberships = new CombinedMembershipManager(this.project_user_memberships,
                                                                      this.project_group_memberships,
                                                                      this.role_assignments,
                                                                      this.project_assignables);

    this.group_project_memberships    = new GroupProjectMembershipManager(this.role_assignments);
  }
});

module.exports = Keystone;
