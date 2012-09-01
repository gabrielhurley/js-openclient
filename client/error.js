var NotImplemented = function (message) {
  this.name = "NotImplemented";
  this.message = message;
  return this;
};


var ClientError = function (status, message) {
  this.name = "ClientError";
  this.status = status;
  this.message = "ClientError (" + this.status + "): " + message;
  return this;
};


var NotFound = function (status, message) {
  this.name = "NotFound";
  this.status = status;
  this.message = "NotFound: " + message;
  return this;
};


var code_map = {
  404: NotFound,
  503: NotImplemented
};


module.exports = {
  get_error: function (status) {
    return code_map[status] || ClientError;
  },
  ClientError: ClientError,
  NotFound: NotFound,
  NotImplemented: NotImplemented
};