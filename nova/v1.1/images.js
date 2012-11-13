var base = require("../../client/base"),
    error = require("../../client/error");

// TODO(roland): Make methods throw NotImplemented where applicable.

var ImageManager = base.Manager.extend({
  namespace: "images"
});


module.exports = ImageManager;
