var base = require("../../client/base"),
    error = require("../../client/error"),
    urljoin = require("../../client/utils").urljoin;


var ServerManager = base.Manager.extend({
  namespace: "servers",

  get_base_url: function (params) {
    var base_url = this._super(params);
    if (params.detail) {
      base_url = this.urljoin(base_url, 'detail');
    }
    return base_url;
  },

  // TODO(gabriel): Add in server creation logic...
  create: function (params) {
    if (!params.data.name) {
      params.data.name = null;
    }
    if (params.data.security_groups) {
      if (typeof params.data.security_groups !== "array") {
        params.data.security_groups = [params.data.security_groups];
      }
      params.data.security_groups = params.data.security_groups.map(function (sg) {
        return {"name": sg};
      });
    }
    return this._super(params);
  },

  _action: function (params, action, info, callback) {
    var url = urljoin(this.get_base_url(params), params.id, "action");
    params = this.prepare_params(params, url, "singular");
    params.data[action] = info || null;
    return this.client.post(params, callback) || this;
  },

  reboot: function (params) { return this._action(params, "reboot", {'type': 'HARD'}); },

  migrate: function (params) { return this._action(params, "migrate"); },

  stop: function (params) { return this._action(params, "stop"); },
  start: function (params) { return this._action(params, "start"); },

  pause: function (params) { return this._action(params, "pause"); },
  unpause: function (params) { return this._action(params, "unpause"); },

  lock: function (params) { return this._action(params, "lock"); },
  unlock: function (params) { return this._action(params, "unlock"); },

  suspend: function (params) { return this._action(params, "suspend"); },
  resume: function (params) { return this._action(params, "resume"); },

  rescue: function (params) { return this._action(params, "rescue"); },
  unrescue: function (params) { return this._action(params, "unrescue"); }

  // TODO: Methods implemented by python-novaclient which are not yet implemented here...
  // get_console_output
  // get_vnc_console
  // create_image
  // add_floating_ip
  // remove_floating_ip
  // add_fixed_ip
  // remove_fixed_ip
  // add_security_group
  // remove_security_group
  // resize
  // rebuild
  // confirm_resize
  // revert_resize
  // backup
  // set_meta
  // delete_meta
  // live_migrate
  // reset_state
  // change_password
  // diagnostics
  // actions
});


module.exports = ServerManager;
