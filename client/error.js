var inherits = require('util').inherits;


defineErrorType('NotFound', function (status, message) {
  this.status = status;
  this.message = this.name + ':' + message;
});


defineErrorType('NotImplemented', function (message) {
  if (!message) this.message = this.name;
});


defineErrorType('ClientError', function (status, api_error) {
  this.status = status;
  if (api_error && api_error.message) {
    this.message = api_error.message
  } else {
    this.message = this.name + '(' + status + ')';
  }
});


var code_map = {
  404: exports.NotFound,
  503: exports.NotImplemented
};


exports.get_error = function (status) {
  return code_map[status] || exports.ClientError;
};


function defineErrorType (name, init) {
  var constructor = eval('(function ' + name + '(message){' + 
    'if (init) init.apply(this, arguments);' +
    'Error.call(this, this.message || message);' + 
  '})');

  inherits(constructor, Error);

  constructor.prototype.name = constructor.name;

  exports[name] = constructor;

  return constructor;
}
