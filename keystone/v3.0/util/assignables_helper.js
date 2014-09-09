/*global require: false, module: false */

var _     = require("underscore"),
    Class = require("../../../client/inheritance").Class;

var VALID_TYPES = ["user", "group"];

var AssignablesHelper = Class.extend({
  init: function() {
    _.bindAll(this, "parseDisambiguatedId", "disambiguatedId");
  },

  /**
   * Returns an object of signature {type: TYPE, id: ID}, or else `null` if parsing wasn't possible.
   *
   * @param disambiguated_id id to parse
   *
   * @returns {object|null}
   */
  parseDisambiguatedId: function(disambiguated_id) {
    var data = {},
        parts = disambiguated_id.split("_"),
        // Snag the proposed type off the front
        type = parts.shift(),
        // Put the rest back together again
        id = parts.join("_");

    if (!_.contains(VALID_TYPES, type)) {
      return null;
    }

    data.type = type;
    data.id = id;

    return data;
  },

  /**
   * Generates a disambiguatedId compatible with `AssignablesHelper#parseDisambiguatedId`
   *
   * @param type
   * @param id
   * @returns {string}
   */
  disambiguatedId: function(type, id) {
    if (!_.contains(VALID_TYPES, type)) {
      throw new Error("Invalid type `" + type + "` specified; must be one of " + VALID_TYPES.join(", "));
    }
    return type + "_" + id;
  }
});

module.exports = AssignablesHelper;
