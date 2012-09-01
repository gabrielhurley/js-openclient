var Mocha = require('mocha'),
    fs = require('fs'),
    path = require('path');

var mocha = new Mocha({
  ui: 'bdd',
  reporter: 'list',
  globals: ['syncProc']
});

// Deal with command line arguments...
var args = process.argv.slice(2); // ignore "node" and the script name.
for (var i = 0; i < args.length; i++) {
  var bits = args[i].split("=");
  if (bits.length === 2) {
    switch (bits[0].replace("--", "")) {
    case "username":
      process.env.OS_USERNAME = bits[1];
      break;
    case "project":
      process.env.OS_TENANT_NAME = bits[1];
      break;
    case "url":
      process.env.OS_AUTH_URL = bits[1];
      break;
    case "password":
      process.env.OS_PASSWORD_INPUT = bits[1];
      break;
    }
  }
  continue;
}

// Integration tests
fs.readdirSync('nova/tests/integration').filter(function (file) {
  return file.substr(-3) === '.js';
}).forEach(function (file) {
  mocha.addFile(path.join('nova/tests/integration', file));
});

mocha.run();