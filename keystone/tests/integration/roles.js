var expect = require('chai').expect,
    Keystone = require("../../v2.0/client"),
    client, new_role, role_data;

role_data = {name: "test_role"};


describe('Keystone role manager', function () {
  before(function (done) {
    var roles;

    // Cleanup any previous test runs.
    client = new Keystone({
      url: process.env.OS_AUTH_URL,
      debug: process.env.OS_CLIENT_DEBUG
    }).authenticate({
      username: process.env.OS_USERNAME,
      password: process.env.OS_PASSWORD_INPUT,
      project: process.env.OS_TENANT_NAME
    });

    roles = client.roles.all({async: false, endpoint_type: "adminURL"});
    for (var i = 0; i < roles.length; i++) {
      if (roles[i].name === role_data.name) {
        client.roles.del({
          id: roles[i].id,
          async: false,
          endpoint_type: "adminURL"
        });
      }
    }
    done();
  });

  it('should be able to create a role synchronously', function (done) {
    expect(client.scoped_token).to.not.equal(null);

    new_role = client.roles.create({
      data: role_data,
      async: false,
      endpoint_type: "adminURL"
    });

    expect(new_role.name).to.equal(role_data.name);
    expect(new_role.id).to.be.ok;
    done();
  });

  it('should be able to fetch and delete a role asynchronously', function (done) {
    // Test chaining get, delete, and list calls asynchronously;
    client.roles.get({
      id: new_role.id,
      endpoint_type: "adminURL",
      success: function (role) {
        client.roles.del({
          id: new_role.id,
          endpoint_type: "adminURL",
          success: function (result) {
            var roles = client.roles.all({async: false, endpoint_type: "adminURL"});
            for (var i = 0; i < roles.length; i++) {
              expect(roles[i].id).not.to.equal(new_role.id);
            }
            done();
          }
        });
      }
    });
  });
});


