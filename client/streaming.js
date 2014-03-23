var http = require('http');

function StreamingUpload(client, request, params) {
  var upload = this;

  this.client = client;
  this.request = request;
  this.params = params;
  this.timeout =  null;
  this.success = null;
  this.callback = null;

  request.on('error', function (err) {
    upload.client.log('error', 'request error', err);
    if (upload.callback) upload.callback(err);
  });

  request.on('response', function (response) {
    var response_data = "";

    response.on('data', function (chunk) {
      response_data += chunk;
    });

    response.on('end', function () {
      var status = parseInt(response.statusCode, 10),
          req_headers = {},
          resp_headers = {};

      // NOTE (gabriel): Using a Node internal attribute here...
      Object.keys(request._headers).forEach(function (key) {
        req_headers[key.toLowerCase()] = request._headers[key];
      });

      Object.keys(response.headers).forEach(function (key) {
        resp_headers[key.toLowerCase()] = response.headers[key];
      });

      client.process_response(upload.params.method, upload.params.url, '<binary data>', status, response_data, req_headers, resp_headers, upload.params, function (err, result) {
        if (err) {
          upload.callback(err, null, {status: status});
        } else {
          if (upload.success) {
            upload.success(result, upload.callback);
          } else {
            upload.callback(null, result, {status: status});
          }
        }
      });
    });
  });
}

StreamingUpload.prototype._updateTimeout = function () {
  if (this.timeout) clearTimeout(this.timeout);
  this.timeout = setTimeout(this._timeout.bind(this), 60 * 1000);
};

StreamingUpload.prototype._timeout = function () {
  this._endTransfer();
  this.callback('Transfer timed out.', null, {status: 504});
};

StreamingUpload.prototype._continueTransfer = function (data) {
  this._updateTimeout();

  if (data.end === data.size - 1) {
    this._endTransfer();
  } else {
    this.callback(null, null, {status: 100});
  }
};

StreamingUpload.prototype._endTransfer = function () {
  this.request.end();
  if (this.timeout) clearTimeout(this.timeout);
};

StreamingUpload.prototype.write = function (data, callback) {
  this.callback = callback;
  var chunk = data.chunk instanceof Buffer ? data.chunk : new Buffer(data.chunk, 'base64');
  var written = this.request.write(chunk, 'binary');
  if (written) {
    this._continueTransfer(data);
  } else {
    this.request.socket.once('drain', this._continueTransfer.bind(this, data));
  }
};


module.exports.StreamingUpload = StreamingUpload;
