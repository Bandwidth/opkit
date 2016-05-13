var assert = require('chai').assert;
var opkit = require('../opkit');
var AWS = require('../node_modules/aws-sdk');
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

/*describe('getSQSQueueSizeNotVisibleData', function() {
	it('verifies success of SQS Queue sizes', function() {
		var url = "testID";
		opkit.updateAcessKeyID(access);
		assert.equal(access,true);
	});
});*/

/*
describe('getSQSQueueSizeInt', function() {
	it('verifies success of retrieveing SQS queue size', function(done) {
		opkit.updateAuthKeys('AKIAJOQCFVMRLLNFWLZA','bHXuXbdF9tg7NJjCN2PutXjCJnkCV+Cb/0vJPn7F');
		opkit.getSQSQueueSizeInt('https://sqs.us-east-1.amazonaws.com/848840820992/nguyer-sms-queue', function(err, data) {
			var x = data;
		});
		assert.equal(x,2);
		done();
		
	});
});
*/

var assert = require('chai').assert;
describe('Array', function() {
  describe('#indexOf()', function () {
    it('should return -1 when the value is not present', function () {
      assert.equal(-1, [1,2,3].indexOf(5));
      assert.equal(-1, [1,2,3].indexOf(0));
    });
  });
});