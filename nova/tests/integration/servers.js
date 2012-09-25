var expect = require('chai').expect,
    Nova = require("../../v1.1/client"),
    client, new_server, server_data;

server_data = {
  name: "test_server"
};

/*
describe('Nova server manager', function () {
  before(function (done) {
    var servers;

    // Cleanup any previous test runs.
    client = new Nova({
      url: process.env.OS_AUTH_URL,
      debug: process.env.OS_CLIENT_DEBUG
    }).authenticate({
      username: process.env.OS_USERNAME,
      password: process.env.OS_PASSWORD_INPUT,
      project: process.env.OS_TENANT_NAME
    });

    servers = client.servers.all({async: false});
    for (var i = 0; i < servers.length; i++) {
      if (servers[i].name === server_data.name) {
        client.servers.del({id: servers[i].id, async: false});
      }
    }
    done();
  });


  it('should be able to create a server', function (done) {
    new_server = client.servers.create({
      data: server_data,
      async: false
    });

    expect(new_server.name).to.equal(server_data.name);
    expect(new_server.id).to.equal(server_data.id);
    done();
  });


  it('should be able to retrieve and delete a server', function (done) {
    // Test chaining get, delete, and list calls asynchronously;
    client.servers.get({
      id: new_server.id,
      success: function (server) {
        client.servers.del({
          id: server.id,
          success: function (result) {
            var servers = client.servers.all({async: false});
            for (var i = 0; i < servers.length; i++) {
              expect(servers[i].id).not.to.equal(new_server.id);
            }
            done();
          }
        });
      }
    });
  });
});
*/
