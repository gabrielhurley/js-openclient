var expect = require('chai').expect,
    Keystone = require("../../v2.0/client"),
    client, new_user, new_user_data, updated_user_data;


updated_user_data = {
  name: "test_user_update",
  email: "test_update@example.com",
  password: "testy",
  enabled: false
};

new_user_data = {
  name: "test_user",
  email: "test@example.com",
};


describe('Keystone user manager', function () {
  before(function (done) {
    var users;

    // Cleanup any previous test runs.
    client = new Keystone({
      url: process.env.OS_AUTH_URL,
      debug: process.env.OS_CLIENT_DEBUG
    }).authenticate({
      username: process.env.OS_USERNAME,
      password: process.env.OS_PASSWORD_INPUT,
      project: process.env.OS_TENANT_NAME
    });

    users = client.users.all({async: false, endpoint_type: "adminURL"});
    for (var i = 0; i < users.length; i++) {
      if (users[i].name === new_user_data.name || users[i].name === updated_user_data.name) {
        client.users.del({
          id: users[i].id,
          async: false,
          endpoint_type: "adminURL"
        });
      }
    }
    done();
  });
  it('should be able to create a user synchronously', function (done) {
    expect(client.scoped_token).to.not.equal(null);

    new_user = client.users.create({
      data: new_user_data,
      async: false,
      endpoint_type: "adminURL"
    });

    expect(new_user.name).to.equal(new_user_data.name);
    expect(new_user.email).to.equal(new_user_data.email);
    expect(new_user.id).to.be.ok;
    done();
  });

  it('should be able to update a user synchronously', function (done) {
    var updated_user = client.users.update({
      endpoint_type: "adminURL",
      async: false,
      id: new_user.id,
      data: updated_user_data
    });
    expect(updated_user.name).to.equal(updated_user_data.name);
    expect(updated_user.email).to.equal(updated_user_data.email);
    expect(updated_user.enabled).to.be.false;
    expect(updated_user.id).to.be.ok;
    done();
  });

  it('should be able to fetch and delete a user asynchronously', function (done) {
    // Test chaining get, delete, and list calls asynchronously;
    client.users.get({
      id: new_user.id,
      endpoint_type: "adminURL",
      success: function (user) {
        expect(user.name).to.equal(updated_user_data.name);
        client.users.del({
          id: new_user.id,
          endpoint_type: "adminURL",
          success: function (result) {
            var users = client.users.all({async: false, endpoint_type: "adminURL"});
            for (var i = 0; i < users.length; i++) {
              expect(users[i].id).not.to.equal(new_user.id);
            }
            done();
          }
        });
      }
    });
  });
});


