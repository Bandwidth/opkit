var assert = require('chai').assert;
var opkit = require('../index');
describe('#equals', function() {
	it('verifies two vectors are equal', function() {
		vec = [1, 2, 3, 4];
		assert.equal(opkit.equals(vec, vec),true);
	});
});
