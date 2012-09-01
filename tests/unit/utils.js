var expect = require('chai').expect,
    utils = require('../../client/utils');

describe('Interpolate', function () {
  it('should replace markers in strings', function (done) {
    var string = "/{foo}/and/{bar}",
        expected = "/good/and/great",
        context = {foo: "good", bar: "great"};

    expect(utils.interpolate(string, context)).to.equal(expected);

    done();
  });
});


