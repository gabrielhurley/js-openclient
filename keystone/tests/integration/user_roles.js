var expect = require('chai').expect,
    Keystone = require("../../v2.0/client"),
    client, new_user, new_role, new_project, user_data, role_data, project_data;

user_data = {
  name: "test_user",
  email: "test@example.com",
};

role_data = {name: "test_role"};

project_data = {
  name: "foo1",
  enabled: true
};


describe('Keystone user role manager', function () {
  before(function (done) {
    var users, roles, projects;

    client = new Keystone({
      url: process.env.OS_AUTH_URL,
      debug: process.env.OS_CLIENT_DEBUG
    }).authenticate({
      username: process.env.OS_USERNAME,
      password: process.env.OS_PASSWORD_INPUT,
      project: process.env.OS_TENANT_NAME
    });

    // Cleanup any previous test runs.
    users = client.users.all({async: false, endpoint_type: "adminURL"});
    for (var i = 0; i < users.length; i++) {
      if (users[i].name === user_data.name) {
        client.users.del({
          id: users[i].id,
          async: false,
          endpoint_type: "adminURL"
        });
      }
    }
    roles = client.roles.all({async: false, endpoint_type: "adminURL"});
    for (var j = 0; j < roles.length; j++) {
      if (roles[j].name === role_data.name) {
        client.roles.del({
          id: roles[j].id,
          async: false,
          endpoint_type: "adminURL"
        });
      }
    }
    projects = client.projects.all({async: false, endpoint_type: "adminURL"});
    for (var k = 0; k < projects.length; k++) {
      if (projects[k].name === project_data.name) {
        client.projects.del({
          id: projects[k].id,
          async: false,
          endpoint_type: "adminURL"
        });
      }
    }

    // Create our new user, project and role
    new_user = client.users.create({
      data: user_data,
      async: false,
      endpoint_type: "adminURL"
    });

    new_role = client.roles.create({
      data: role_data,
      async: false,
      endpoint_type: "adminURL"
    });

    new_project = client.projects.create({
      data: project_data,
      async: false,
      endpoint_type: "adminURL"
    });

    done();
  });


  it('should be able to add a role to a user', function (done) {
    var role = client.user_roles.update({
      id: new_role.id,
      user: new_user.id,
      project: new_project.id,
      async: false,
      endpoint_type: "adminURL"
    });
    expect(role.id).to.be.ok;
    expect(role.name).to.equal(new_role.name);
    done();
  });

  it("should be able to list a user's roles", function (done) {
    var roles = client.user_roles.all({
      user: new_user.id,
      project: new_project.id,
      async: false,
      endpoint_type: "adminURL"
    });
    expect(roles).to.have.length(1);
    expect(roles[0].name).to.equal(new_role.name);
    done();
  });

  it('should be able to remove a role from a user', function (done) {
    var roles;

    client.user_roles.del({
      id: new_role.id,
      user: new_user.id,
      project: new_project.id,
      async: false,
      endpoint_type: "adminURL"
    });

    roles = client.user_roles.all({
      user: new_user.id,
      project: new_project.id,
      async: false,
      endpoint_type: "adminURL"
    });
    expect(roles).to.have.length(0);
    done();
  });
});