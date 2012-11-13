var expect = require('chai').expect,
    Nova = require("../../v1/client"),
    client;

describe('Cinder limit  manager', function () {
  before(function (done) {
    // Cleanup any previous test runs.
    client = new Nova({
      url: process.env.OS_AUTH_URL,
      debug: process.env.OS_CLIENT_DEBUG

    }).authenticate({
      username: process.env.OS_USERNAME,
      password: process.env.OS_PASSWORD_INPUT,
      project: process.env.OS_TENANT_NAME,
      async: false
    });

    var limits = client.volumes.all({async: false});

    //console.log(limits);

    done();
  });

  it('is ok', function () {
    expect(true).to.be.ok
  });
});
