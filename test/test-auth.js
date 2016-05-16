var assert = require('chai').assert;
var opkit = require('../opkit');

describe('Auth', function() {
	describe('#updateRegion()', function () {
		it('should update the region in that particular object', function () {
			var auth1 = new opkit.Auth();
			auth1.updateRegion("us-east-1");
			assert.equal("us-east-1", auth1.props.region);
			auth1.updateRegion("hell");
			assert.equal("hell", auth1.props.region);
		});

		it('should update the region in that particular object,\n' +
		'and not change the region in other auth objects', function () {
			var auth1 = new opkit.Auth();
			var auth2 = new opkit.Auth();
			auth1.updateRegion("us-east-1");
			auth2.updateRegion("us-east-1");
			assert.equal("us-east-1", auth1.props.region);
			assert.equal("us-east-1", auth2.props.region);
			auth2.updateRegion("hell");
			assert.equal("us-east-1", auth1.props.region);
			assert.equal("hell", auth2.props.region);
		});
	});

	describe('#updateAuthKeys()', function () {
		it('should update the keys in that particular object', function () {
			var auth1 = new opkit.Auth();
			auth1.updateAuthKeys("skeleton", "other_skeleton");
			assert.equal("skeleton", auth1.props.accessKeyId);
			assert.equal("other_skeleton", auth1.props.secretAccessKey);
			auth1.updateAuthKeys("third_skeleton", "broken_shard_of_glass");
			assert.equal("third_skeleton", auth1.props.accessKeyId);
			assert.equal("broken_shard_of_glass", auth1.props.secretAccessKey);
		});

		it('should update the keys in that particular object,\n' +
		'and not change the keys in other auth objects', function () {
			var auth1 = new opkit.Auth();
			var auth2 = new opkit.Auth();
			auth1.updateAuthKeys("skeleton", "other_skeleton");
			auth2.updateAuthKeys("skeleton", "other_skeleton");
			assert.equal("skeleton", auth1.props.accessKeyId);
			assert.equal("other_skeleton", auth1.props.secretAccessKey);
			assert.equal("skeleton", auth2.props.accessKeyId);
			assert.equal("other_skeleton", auth2.props.secretAccessKey);
			auth2.updateAuthKeys("third_skeleton", "broken_shard_of_glass");
			assert.equal("skeleton", auth1.props.accessKeyId);
			assert.equal("other_skeleton", auth1.props.secretAccessKey);
			assert.equal("third_skeleton", auth2.props.accessKeyId);
			assert.equal("broken_shard_of_glass", auth2.props.secretAccessKey);
		});
	});

	describe('#updateAccessKeyId()', function () {
		it('should update the access key ID', function () {
			var auth1 = new opkit.Auth();
			auth1.updateAccessKeyId("skeleton");
			assert.equal("skeleton", auth1.props.accessKeyId);
			auth1.updateAccessKeyId("well_fed_key");
			assert.equal("well_fed_key", auth1.props.accessKeyId);
		});

		it('should update the access key ID in that particular object,\n' +
		'and not change other keys', function () {
			var auth1 = new opkit.Auth();
			var auth2 = new opkit.Auth();
			auth1.updateAccessKeyId("skeleton");
			auth2.updateAccessKeyId("skeleton");
			assert.equal("skeleton", auth1.props.accessKeyId);
			assert.equal("skeleton", auth2.props.accessKeyId);
			auth2.updateAccessKeyId("well_fed_key");
			assert.equal("skeleton", auth1.props.accessKeyId);
			assert.equal("well_fed_key", auth2.props.accessKeyId);
		});
	});

	describe('#updateSecretAccessKey()', function () {
		it('should update the secret access key in that particular object', function () {
			var auth1 = new opkit.Auth();
			auth1.updateSecretAccessKey("skeleton");
			assert.equal("skeleton", auth1.props.secretAccessKey);
			auth1.updateSecretAccessKey("lockpick");
			assert.equal("lockpick", auth1.props.secretAccessKey);
		});

		it('should update the secret access key in that particular object,\n' +
		'and not change other keys', function () {
			var auth1 = new opkit.Auth();
			var auth2 = new opkit.Auth();
			auth1.updateSecretAccessKey("skeleton");
			auth2.updateSecretAccessKey("skeleton");
			assert.equal("skeleton", auth1.props.secretAccessKey);
			assert.equal("skeleton", auth2.props.secretAccessKey);
			auth2.updateSecretAccessKey("lockpick");
			assert.equal("skeleton", auth1.props.secretAccessKey);
			assert.equal("lockpick", auth2.props.secretAccessKey);
		});
	});
});
