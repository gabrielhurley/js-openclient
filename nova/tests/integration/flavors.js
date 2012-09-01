var expect = require('chai').expect,
    Nova = require("../../v1.1/client"),
    client, new_flavor, flavor_data;

flavor_data = {
  id: '9999',
  name: "test_flavor",
  ram: 1024,
  vcpus: 2,
  disk: 10,
  swap: 10,
  rxtx_factor: 1,
  "OS-FLV-EXT-DATA:ephemeral": 50,
  "os-flavor-access:is_public": false
};


describe('Nova flavor manager', function () {
  before(function (done) {
    var flavors;

    // Cleanup any previous test runs.
    client = new Nova({
      url: process.env.OS_AUTH_URL,
      debug: process.env.OS_CLIENT_DEBUG
    }).authenticate({
      username: process.env.OS_USERNAME,
      password: process.env.OS_PASSWORD_INPUT,
      project: process.env.OS_TENANT_NAME
    });

    flavors = client.flavors.all({async: false});
    for (var i = 0; i < flavors.length; i++) {
      if (flavors[i].name === flavor_data.name) {
        client.flavors.del({id: flavors[i].id, async: false});
      }
    }
    done();
  });

  it('should be able to create a flavor', function (done) {
    new_flavor = client.flavors.create({
      data: flavor_data,
      async: false
    });

    expect(new_flavor.name).to.equal(flavor_data.name);
    expect(new_flavor.id).to.equal(flavor_data.id);
    done();
  });

  it('should be able to retrieve and delete a flavor', function (done) {
    // Test chaining get, delete, and list calls asynchronously;
    client.flavors.get({
      id: new_flavor.id,
      success: function (flavor) {
        client.flavors.del({
          id: flavor.id,
          success: function (result) {
            var flavors = client.flavors.all({async: false});
            for (var i = 0; i < flavors.length; i++) {
              expect(flavors[i].id).not.to.equal(new_flavor.id);
            }
            done();
          }
        });
      }
    });
  });
});