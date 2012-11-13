var expect = require('chai').expect,
    Keystone = require("../../v2.0/client"),
    client, new_project, new_project_data, new_name;


new_name = "foo2";

new_project_data = {
  name: "foo1",
  enabled: true
};


describe('Keystone project manager', function () {
  before(function (done) {
    var projects;

    // Cleanup any previous test runs.
    client = new Keystone({
      url: process.env.OS_AUTH_URL,
      debug: process.env.OS_CLIENT_DEBUG

    }).authenticate({
      username: process.env.OS_USERNAME,
      password: process.env.OS_PASSWORD_INPUT,
      project: process.env.OS_TENANT_NAME,
      async: false
    });

    projects = client.projects.all({async: false, endpoint_type: "adminURL"});
    for (var i = 0; i < projects.length; i++) {
      if (projects[i].name === new_project_data.name || projects[i].name === new_name) {
        client.projects.del({
          id: projects[i].id,
          async: false,
          endpoint_type: "adminURL"
        });
      }
    }
    done();
  });

  it('should be able to create a project synchronously', function (done) {
    expect(client.scoped_token).to.not.equal(null);

    new_project = client.projects.create({
      data: new_project_data,
      async: false,
      endpoint_type: "adminURL"
    });

    expect(new_project.name).to.equal(new_project_data.name);
    expect(new_project.id).to.be.ok;
    done();
  });

  it('should be able to update a project synchronously', function (done) {
    client.projects.update({
      endpoint_type: "adminURL",
      async: false,
      id: new_project.id,
      data: {
        name: new_name
      }
    });
    done();
  });

  it('should be able to fetch and delete a project asynchronously', function (done) {
    // Test chaining get, delete, and list calls asynchronously;
    client.projects.get({
      id: new_project.id,
      endpoint_type: "adminURL",
      success: function (project) {
        expect(project.name).to.equal(new_name);
        client.projects.del({
          id: new_project.id,
          endpoint_type: "adminURL",
          success: function (result) {
            var projects = client.projects.all({async: false, endpoint_type: "adminURL"});
            for (var i = 0; i < projects.length; i++) {
              expect(projects[i].id).not.to.equal(new_project.id);
            }
            done();
          }
        });
      }
    });
  });
});


