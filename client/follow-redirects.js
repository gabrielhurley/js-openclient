// follow-redirects v0.0.4 from github.
// Author: Olivier Lalonde <olalonde@gmail.com>
// License: BSD

var nativeHttps = require('https'),
  nativeHttp = require('http'),
  url = require('url'),
  _ = require('underscore');

var maxRedirects = module.exports.maxRedirects = 5;

var protocols = {
  https: nativeHttps,
  http: nativeHttp
};

// Only use GETs on redirects
for (var protocol in protocols) {
  // h is either our cloned http or https object
  var h =  function() {};
  h.prototype = protocols[protocol];
  h = new h();

  module.exports[protocol] = h;

  h.request = function (h) {
    return function (options, callback, redirectOptions) {

      redirectOptions = redirectOptions || {};

      var max = (typeof options === 'object' && 'maxRedirects' in options) ? options.maxRedirects : exports.maxRedirects;

      var redirect = _.extend({
        count: 0,
        max: max,
        clientRequest: null,
        userCallback: callback
      }, redirectOptions);

      /**
       * Emit error if too many redirects
       */
      if (redirect.count > redirect.max) {
        var err = new Error('Max redirects exceeded. To allow more redirects, pass options.maxRedirects property.');
        redirect.clientRequest.emit('error', err);
        return redirect.clientRequest;
      }

      redirect.count++;

      /**
       * Parse URL from options
       */
      var reqUrl;
      if (typeof options === 'string') {
        reqUrl = options;
      }
      else {
        reqUrl = url.format(_.extend({ protocol: protocol }, options));
      }

      /*
       * Build client request
       */
      var clientRequest = h.__proto__.request(options, redirectCallback(reqUrl, redirect));

      // Save user's clientRequest so we can emit errors later
      if (!redirect.clientRequest) redirect.clientRequest = clientRequest;

      /**
       * ClientRequest callback for redirects
       */
      function redirectCallback (reqUrl, redirect) {
        return function (res) {
          // status must be 300-399 for redirects
          if (res.statusCode < 300 || res.statusCode > 399) {
            return redirect.userCallback(res);
          }

          // no `Location:` header => nowhere to redirect
          if (!('location' in res.headers)) {
            return redirect.userCallback(res);
          }

          // save the original clientRequest to our redirectOptions so we can emit errors later

          // need to use url.resolve() in case location is a relative URL
          var redirectUrl = url.resolve(reqUrl, res.headers['location']);
          // we need to call the right api (http vs https) depending on protocol


          var urlparts   = url.parse(redirectUrl);
          var searchname = urlparts.search;

          var proto           = urlparts.protocol.substr(0, urlparts.protocol.length - 1);
          var port            = urlparts.port;
          var redirectOptions = options;

          if (proto === 'https' && port === '80') {
            urlparts.port = '443';
            urlparts.host = urlparts.host.substr(0, urlparts.host.length - 3) + ':443';
            urlparts.href = urlparts.protocol + '//' + urlparts.host + urlparts.pathname;
            redirectOptions.headers['Host'] = urlparts.host;
          }


          redirectOptions.reqUrl   = url.format(urlparts);
          redirectOptions.hostname = urlparts.hostname;
          redirectOptions.path     = urlparts.pathname;
          redirectOptions.port     = urlparts.port;
          if (searchname) redirectOptions.path += searchname;


          var out = module.exports[proto].get(redirectOptions, redirectCallback(reqUrl, redirect), redirect);


          // bubble errors that occur on the redirect back up to the initiating client request
          // object, otherwise they wind up killing the process.
          out.on("error", function(err) { clientRequest.emit("error", err) });

          return out;
        };
      }

      return clientRequest;
    }
  }(h);

  // see https://github.com/joyent/node/blob/master/lib/http.js#L1623
  h.get = function (h) {
    return function (options, cb, redirectOptions) {
      var req = h.request(options, cb, redirectOptions);
      req.end();
      return req;
    };
  }(h);
}
