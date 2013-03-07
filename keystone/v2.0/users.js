var async = require("async"),
    base = require("../../client/base"),
    utils = require("../../client/utils"),
    urljoin = utils.urljoin,
    interpolate = utils.interpolate;


var UserManager = base.Manager.extend({
  namespace: "users",
  update: function (params, callback) {
    // Keystone splits user update functions into four pieces. :-/
    var manager = this,
        pattern = "{id}/OS-KSADM/{action}",
        result = null,
        success = params.success,
        error = params.error,
        url, user_id, username, email, default_project, enabled, password,
        update_basics, update_enabled, update_project, update_password;

    params.data = params.data || {};
    // Copy our data because we don't want to alter it across the
    // various API calls accidentally.
    this.normalize_id(params);
    user_id = params.id;
    username = params.data.name;
    email = params.data.email;
    default_project = params.data.project;
    enabled = params.data.enabled;
    password = params.data.password;

    update_basics = function (done) {
      if (username || email) {
        var new_params = {
          data: {id: user_id, name: username, email: email},
          success: function (result) { done(null, result); },
          error: done,
          endpoint_type: params.endpoint_type
        };
        manager._super(new_params);
      } else {
        done(null);
      }
    };

    update_enabled = function (done) {
      if (typeof(enabled) !== "undefined") {
        var new_params = {
          data: {id: user_id, enabled: enabled},
          success: function (result) { done(null, result); },
          error: done,
          endpoint_type: params.endpoint_type
        };
        new_params.url = urljoin(manager.get_base_url(params), interpolate(pattern, {id: params.id, action: "enabled"}));
        manager._super(new_params);
      } else {
        done(null);
      }
    };

    update_project = function (done) {
      if (default_project) {
        var new_params = {
          data: {id: user_id, tenantId: default_project},
          success: function (result) { done(null, result); },
          error: done,
          endpoint_type: params.endpoint_type
        };
        new_params.url = urljoin(manager.get_base_url(params), interpolate(pattern, {id: params.id, action: "tenant"}));
        manager._super(new_params);
      } else {
        done(null);
      }
    };

    update_password = function (done) {
      if (password) {
        var new_params = {
          data: {id: user_id, password: password},
          success: function (result) { done(null, result); },
          error: done,
          endpoint_type: params.endpoint_type
        };
        new_params.url = urljoin(manager.get_base_url(params), interpolate(pattern, {id: params.id, action: "password"}));
        manager._super(new_params);
      } else {
        done(null);
      }
    };

    async.parallel({
      basics: update_basics,
      enabled: update_enabled,
      project: update_project,
      password: update_password
    }, function (err, results) {
      if (err) {
        if (callback) callback(err);
        return error(err);
      }

      var result_user = {id: params.id};
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
      if (callback) callback(result_user);
      success(result_user);
    });
  },

  _updateEnabled: function (status, params, callback) {
    var path = interpolate("{id}/OS-KSADM/{action}", {id: params.id, action: "enabled"}),
        url = urljoin(this.get_base_url(params), path);
    params.data = {id: params.id, enabled: status};
    params = this.prepare_params(params, url, "singular");
    params.parseResult = function (result) {
      if (typeof result.extra.enabled !== "undefined") {
        result.enabled = result.extra.enabled;
      }
      return result;
    };
    return this.client.put(params, callback);
  },
  enable: function (params, callback) { return this._updateEnabled(true, params, callback); },
  disable: function (params, callback) { return this._updateEnabled(false, params, callback); }
});


module.exports = UserManager;
