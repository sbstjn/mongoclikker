var mongoclikker = require('../mongoclikker.js');
var assert = require('assert');

exports.testNumbers = function(beforeExit, assert) {
    assert.equal(1.1, mongoclikker.cast('1.1'));
    assert.equal(1, mongoclikker.cast('1'));
};

exports.testStrings = function(beforeExit, assert) {
    assert.equal('String', mongoclikker.cast('String'));
};