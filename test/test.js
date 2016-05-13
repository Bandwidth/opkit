var assert = require('chai').assert;
var Opkit = require('../opkit');
var object = new Opkit();
var AWS = require('../node_modules/aws-promised');
var sqs = new AWS.sqs({apiVersion: '2012-11-05'});

describe('Opkit', function() {
	describe('#updateAuthKeys()', function() {
		it('should verify updateAuthKeys does not cause an error', function() {
			object.updateAuthKeys('YOURKEY', 'YOURSECRETKEY');
		});
	});
});

describe('Opkit', function() {
	describe('#getSQSQueueSizeInt', function() {
		it('should verify getSQSQueueSizeInt does not cause an error', function(done) {
			object.getSQSQueueSizeInt('YOUR URL', done);
		});
	});
});

describe('Opkit', function() {
	describe('#sqsQueueParameterFormatter', function() {
		it('should be a basic test', function() {
			object.sqsQueueParameterFormatter('YOUR URL', 'Attrib');
		});
	});
});

describe('Array', function() {
  describe('#indexOf()', function () {
    it('should return -1 when the value is not present', function () {
      assert.equal(-1, [1,2,3].indexOf(5));
      assert.equal(-1, [1,2,3].indexOf(0));
    });
  });
});