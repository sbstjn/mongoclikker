var mongoclikker = require('../mongoclikker.js');
var assert = require('assert');

exports.testNumbers = function(beforeExit, assert) {
  assert.equal(1.1, mongoclikker.cast('1.1'));
  assert.equal(1, mongoclikker.cast('1'));
  assert.equal(0, mongoclikker.cast('0'));
  assert.equal('NaN', mongoclikker.cast('NaN'));
  assert.equal('1,1', mongoclikker.cast('1,1'));
};

exports.testStrings = function(beforeExit, assert) {
  assert.equal('String', mongoclikker.cast('String'));
  assert.equal(null, mongoclikker.cast('null'));
  assert.equal('[0]', mongoclikker.cast('[0]'));
};

exports.testBooleans = function(beforeExit, assert) {
  assert.equal(true, mongoclikker.cast('true'));
  assert.equal(false, mongoclikker.cast('false'));
};