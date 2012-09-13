var base = require("./client/base"),
    Keystone = require("./keystone/v2.0/client"),
    Nova = require("./nova/v1.1/client");

module.exports = {
  base: base,
  Keystone: Keystone,
  Nova: Nova
};