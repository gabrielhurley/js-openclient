# JavaScript OpenStack Client #

This project aims to provide a very opinionated core client which can be used in
either node.js or in the browser to communicate with an OpenStack-compatible
API.

The aims of this project are very specific:

1. Require absolutely minimum boilerplate code for adding new API
   resource managers.

2. Provide an extremely stable, backwards-compatible, carefully maintained
   API to users of this library. Changes in OpenStack APIs should be managed
   under-the-hood when necessary.

2. Do not support every legacy authentication mechanism or every legacy vagary
   of pre-Essex APIs. (It is intended for use on Essex or newer OpenStack
   deployments running Keystone authentication __only__.)

3. Do not mirror the APIs precisely. Instead provide a clean, consistent
   interface for __every__ API resource and raise `NotImplemented` errors
   when a method is not supported by the underlying API.

4. Where possible, hacks can be added in on specific managers for methods
   which can be emulated but may require multiple calls, etc.

Under no circumstances should any client extending this library break the
fundamental API contract that this library provides.

## Example ##

Using the client works like this:

```javascript
var Keystone = require("js-openstackclient").Keystone;

var client = new Keystone({
    url: <auth url>,
    debug: true
  }).authenticate({
    username: <username>,
    password: <password>,
    project: <project name>
  });

// Calls default to being asynchronous and can be chained together.
client.projects.all({
  endpoint_type: "adminURL",  // Defaults to "publicURL".

  // Callbacks receive the result of the call;
  success: function (projects) {
    var updated_project, project = projects[0];

    // Synchronous calls return the result directly.
    updated_project = client.projects.update({
      async: false,
      endpoint_type: "adminURL",
      id: project.id,
      data: {
        name: <new name>
      }
    });
    updated_project.name === <new name>;  // true
  }
});
```

Plenty more examples are available in the integration tests for the clients
themselves.

## API Methods ##

Documentation coming soon.

## Running the tests ##

The tests for the clients are __entirely__ integration tests. They require
a functioning OpenStack deployment, and are best-tested against a clean
DevStack deployment.

To run the tests for a given client, use the test runner with your OpenStack
credentials (using a fresh DevStack installation is recommended); you may set
the standard `OS_` variables in the environment, or you can pass the required
arguments like so:

```
node <client dir>/tests/run.js
    --url=http://<keystone url>:5000/v2.0
    --username=<admin username>
    --project=<admin project>
    --password=<admin password>
```