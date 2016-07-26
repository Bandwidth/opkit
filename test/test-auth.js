var assert = require('chai').assert;
var opkit = require('../index');

describe('Auth', function() {

	var auth1;

	afterEach(function() {
		auth1 = undefined;
	});

	describe('#updateRegion()', function () {
		before(function() {
			auth1 = new opkit.Auth();
			auth1.updateRegion("us-east-1");
		});

		it('should update the region in that particular object', function () {
			assert.equal("us-east-1", auth1.props.region);
		});
	});

	describe('#updateAuthKeys()', function () {
		before(function() {
			auth1 = new opkit.Auth();
			auth1.updateAuthKeys("skeleton", "other_skeleton");
		});

		it('should update the keys in that particular object', function () {
			assert.equal("skeleton", auth1.props.accessKeyId);
			assert.equal("other_skeleton", auth1.props.secretAccessKey);
		});
	});

	describe('#updateAccessKeyId()', function () {
		before(function() {
			auth1 = new opkit.Auth();
			auth1.updateAccessKeyId("skeleton");
		});

		it('should update the access key ID', function () {
			assert.equal("skeleton", auth1.props.accessKeyId);
		});
	});

	describe('#updateSecretAccessKey()', function () {
		before(function() {
			auth1 = new opkit.Auth();
			auth1.updateSecretAccessKey("skeleton");
		});

		it('should update the secret access key in that particular object', function () {
			assert.equal("skeleton", auth1.props.secretAccessKey);
		});
	});

	describe('#updateShortName', function () {
		before(function() {
			auth1 = new opkit.Auth();
			auth1.updateShortName("skeleton");
		});

		it('should update the short name in that particular object', function () {
			assert.equal("skeleton", auth1.shortName);
		});
	});
});
