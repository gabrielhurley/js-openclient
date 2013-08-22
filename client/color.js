exports.colors = {
  reset: '\033[0m',
  bold: '\033[1m',
  italic: '\033[3m',
  underline: '\033[4m',
  blink: '\033[5m',
  black: '\033[30m',
  red: '\033[31m',
  green: '\033[32m',
  yellow: '\033[33m',
  blue: '\033[34m',
  magenta: '\033[35m',
  cyan: '\033[36m',
  white: '\033[37m'
};

var supportsColor = false;

exports.enable = function (bool) {
  supportsColor = bool;
};

exports.wrap = function (color, string) {
  if (!supportsColor) return string;

  var wrap_with = exports.colors[color];
  if (!wrap_with) return string;

  return wrap_with + string + exports.colors.reset;
};

exports.red = function (string) { return exports.wrap('red', string); };
exports.cyan = function (string) { return exports.wrap('cyan', string); };
exports.green = function (string) { return exports.wrap('green', string); };
exports.yellow = function (string) { return exports.wrap('yellow', string); };
exports.bold = function (string) { return exports.wrap('bold', string); };
exports.italic = function (string) { return exports.wrap('italic', string); };
