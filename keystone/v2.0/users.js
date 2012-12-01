var async = require("async"),
    base = require("../../client/base"),
    utils = require("../../client/utils"),
    urljoin = utils.urljoin,
    interpolate = utils.interpolate;


var UserManager = base.Manager.extend({
  namespace: "users",
  update: function (params) {
    // Keystone splits user update functions into four pieces. :-/
    var manager = this,
        pattern = "{id}/OS-KSADM/{action}",
        result = null,
        url, user_id, username, email, default_project, enabled, password,
        update_basics, update_enabled, update_project, update_password,
        assemble_data, wait_for_result, result_user;

    params.data = params.data || {};
    // Copy our data because we don't want to alter it across the
    // various API calls accidentally.
    user_id = params.id;
    username = params.data.name;
    email = params.data.email;
    default_project = params.data.project;
    enabled = params.data.enabled;
    password = params.data.password;

    assemble_data = function (err, results) {
      result_user = {id: params.id};
      if (results.basics) {
        result_user.name = results.basics.name;
        if (results.basics.extra && results.basics.extra.email) {
          result_user.email = results.basics.extra.email;
        }
      }
      if (results.enabled) {
        result_user.enabled = results.enabled.extra.enabled;
      }
      // FIXME(gabriel): This should fill in the rest of the details.
      return result_user;
    };

    update_basics = function (callback) {
      var result, new_params = params;
      if (username || email) {
        params.data = {id: user_id, name: username, email: email};
        result = manager._super(params);
      }
      callback(null, result);
    };

    update_enabled = function (callback) {
      var result;
      if (typeof(enabled) !== "undefined") {
        params.url = urljoin(manager.get_base_url(params),
                             interpolate(pattern,
                                         {id: params.id, action: "enabled"}));
        params.data = {id: user_id, enabled: enabled};
        result = manager._super(params);
      }
      callback(null, result);
    };

    update_project = function (callback) {
      var result;
      if (default_project) {
        params.url = urljoin(manager.get_base_url(params),
                             interpolate(pattern,
                                         {id: params.id, action: "tenant"}));
        params.data = {id: user_id, tenantId: default_project};
        result = manager._super(params);
      }
      callback(null, result);
    };

    update_password = function (callback) {
      var result;
      if (password) {
        params.url = urljoin(manager.get_base_url(params),
                             interpolate(pattern,
                                         {id: params.id, action: "password"}));
        params.data = {id: user_id, password: password};
        result = manager._super(params);
      }
      callback(null, result);
    };

    // Make jobs synchronous but process them asynchronously in parallel.
    params.async = false;
    async.parallel({
      basics: update_basics,
      enabled: update_enabled,
      project: update_project,
      password: update_password
    }, assemble_data);
    if (!params.async) {
      wait_for_result = function () {
        if (typeof(result_user) === "null") {
          wait_for_result();
        }
      };
      setTimeout(wait_for_result, 100);
      return result_user;
    }
  },

  _updateEnabled: function (status, params, callback) {
    var path = interpolate("{id}/OS-KSADM/{action}", {id: params.id, action: "enabled"}),
        url = urljoin(this.get_base_url(params), path);
    params.data = {id: params.id, enabled: status};
    params = this.prepare_params(params, url, "singular");
    return this.client.put(params, callback) || this;
  },
  enable: function (params, callback) { return this._updateEnabled(true, params, callback); },
  disable: function (params, callback) { return this._updateEnabled(false, params, callback); }
});


module.exports = UserManager;
