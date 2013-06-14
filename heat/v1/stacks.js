var async = require('async'),
    base = require("../../client/base");


var StacksManager = base.Manager.extend({
  namespace: "stacks",
  use_raw_data: true,

  create: function (params, callback) {
    var success = params.success,
        error = params.error,
        manager = this;

    if (params.success) delete params.success;
    if (params.error) delete params.error;

    params.raw_result = true;

    params.data = params.data || {};
    params.data.parameters = params.data.parameters || {};

    Object.keys(params.data).forEach(function (key) {
      if (key.indexOf("parameters.") === 0) {
        params.data.parameters[key.replace('parameters.', '')] = params.data[key];
        delete params.data[key];
      }
    });

    this._super(params, function (err, result, xhr) {
      if (err) {
        if (error) error(err);
        if (callback) callback(err);
        return;
      }
      manager.get({
        url: xhr.getResponseHeader('location'),
        success: success,
        error: error
      }, callback);
    });
  },

  all: function (params, callback) {
    if (!params.detail) return this._super(params, callback);

    var success = params.success,
        error = params.error,
        manager = this;

    if (params.success) delete params.success;
    if (params.error) delete params.error;

    this._super(params, function (err, results, xhr) {
      if (err) {
        if (error) error(err);
        if (callback) callback(err);
        return;
      }

      var detailed = [];

      async.forEach(results, function (stack, done) {
        manager.get({url: stack.links[0].href}, function (err, result) {
          if (err) {
            if (error) error(err);
            if (callback) callback(err);
          } else {
            detailed.push(result);
          }
          done();
        });
      }, function (err) {
        if (err) {
          if (error) error(err);
          if (callback) callback(err);
        } else {
          if (success) success(detailed);
          if (callback) callback(null, detailed);
        }
      });
    });
  },

  del: function (params, callback) {
    var data = params.data || {};
    if (params.data) delete params.data;

    params.allow_headers = true;
    params.headers = params.headers || {};
    params.url = this.urljoin(this.get_base_url(params), data.stack_name, params.id);
    params.headers['Content-Length'] = 0;
    this._super(params, callback);
  }
});


module.exports = StacksManager;
