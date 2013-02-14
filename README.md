# An Opinionated Client for RESTful APIs #

This project aims to provide a very opinionated core client which can be used in
either node.js or in the browser (browser support not yet complete) to communicate
with a RESTful APIs, including but not limited to any OpenStack-compatible API.

The aims of this project are very specific:

1. Require absolutely minimum boilerplate code for adding new API
   resource managers.

2. Provide an extremely stable, backwards-compatible, carefully maintained
   API to users of this library. Changes in remote APIs should be managed
   under-the-hood when necessary.

2. Do not support every legacy authentication mechanism or every legacy vagary
   of remote APIs. (The included OpenStack components are intended for use on
   Essex or newer OpenStack deployments running Keystone authentication.)

3. Do not mirror the APIs precisely. Instead provide a clean interface which is
   consistent across __every__ API resource and raise `NotImplemented` errors
   when a method is not supported by the underlying API.

4. Where possible, hacks should be added on specific managers to emulate
   methods are not natively supported by the API. For example, `in_bulk`  may
   be emulated by making multiple calls, etc.

Any client extending this library should do the utmost to avoid breaking the
fundamental API contract that this library provides.

## Example ##

The following shows off a variety of the features of the client:

```javascript
var Keystone = require("openclient").Keystone;

var client = new Keystone({
  url: <auth url>,
  debug: true
})

client.authenticate({
    username: <username>,
    password: <password>,
    project: <project name>
  // Callbacks can either be success/error handlers in the options object or
  // a callback function as the last argument.
  }, function (err, token) {
  client.projects.all({
    endpoint_type: "adminURL",  // Defaults to "publicURL".

    // Callbacks receive the result of the call;
    success: function (projects) {
      var updated_project, project = projects[0];
      client.projects.update({
        endpoint_type: "adminURL",
        id: project.id,
        data: {
          name: <new name>
        },
        success: function (updated_project) {
          updated_project.name === <new name>;  // true
        },
        error: function (err) {
          console.error(err);
        }
      });
    },
    error: function (err) {
      console.error(err);
    }
  });
});

```

Plenty more examples are available in the integration tests for the clients
themselves.

## API Methods ##

The primary methods that the base `Manager` class exposes are:

* `all`: retrieve a list of all available resources.
* `get`: retrieve a single resource.
* `create`: create a new resource.
* `update`: update an existing resource.
* `del`: delete an existing resource.
* `in_bulk`: retrieve each of the resources in a given list of ids.
* `filter`: retrieve a list of resources which match the filter criteria. (not yet implemented in most cases)

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

## License ##

This library is published under a BSD license and may be freely used in
accordance with those terms.
