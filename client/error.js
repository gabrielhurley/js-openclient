var inherits = require('util').inherits;


function defineErrorType(name, init) {
  var constructor = function error(message) {
    if (init) init.apply(this, arguments);
    Error.call(this, this.message || message);
  };

  inherits(constructor, Error);

  constructor.prototype.name = constructor.name;

  exports[name] = constructor;

  return constructor;
}


defineErrorType('NotFound', function (status, message) {
  this.status = status;
  this.message = message;
});

defineErrorType('Conflict', function (status, message) {
  this.status = status;
  this.message = message;
});

defineErrorType('NotImplemented', function (message) {
  if (!message) {
    this.message = this.name;
  }
});

defineErrorType('Aborted', function () {
  this.status = 0;
  this.message = 'Request aborted';
});

defineErrorType('ClientError', function (status, message, api_error) {
  this.status = status;
  if (message) {
    this.message = message;
  }  else if (api_error && api_error.message) {
    this.message = api_error.message;
  } else {
    this.message = this.name + '(' + status + ')';
  }
});

defineErrorType('BadRequest', function (status, message, api_error) {
  this.status = status;

  if (message) this.message = message;
  // If we have a api_error that was parsed into an object, pass it along as it may have
  // validation rules in it that are useful.
  if (api_error && typeof api_error === 'object') this.body = api_error;
});


var code_map = {
  0: exports.Aborted,
  400: exports.BadRequest,
  404: exports.NotFound,
  409: exports.Conflict,
  503: exports.NotImplemented
};


exports.get_error = function (status) {
  return code_map[status] || exports.ClientError;
};

