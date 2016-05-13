var assert = require('chai').assert;
var Opkit = require('../opkit');
var object = new Opkit();
var AWS = require('../node_modules/aws-promised');
var sqs = new AWS.sqs({apiVersion: '2012-11-05'});

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

/*AWS.config.update({accessKeyId: 'AKIAJOQCFVMRLLNFWLZA', secretAccessKey: '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'});
AWS.config.update({region: 'us-east-1'}); */

console.log(object.props);

describe('Opkit', function() {
	describe('#updateAuthKeys()', function() {
		it('should verify updateAuthKeys does not cause an error', function() {
			object.updateAuthKeys('AKIAJOQCFVMRLLNFWLZA', 'bHXuXbdF9tg7NJjCN2PutXjCJnkCV+Cb/0vJPn7F');
			//object.sqsQueueParameterFormatter('https://sqs.us-east-1.amazonaws.com/848840820992/nguyer-sms-queue', 'Attrib');
		});
	});
});

describe('Opkit', function() {
	describe('#updateRegion', function() {
		it('should verify updating the region does not cause an error', function() {
			object.updateRegion('us-east-1');
		});
	});
});

describe('Opkit', function() {
	describe('#queryAlarmsByState', function() {
		it('should verify queryAlarmsByState does not produce an error', function() {
			object.queryAlarmsByState('OK');
		});
	});
});

describe('Opkit', function() {
	describe('#queryAlarmsByStateReadably', function() {
		it('should verify queryAlarmsByStateReadably does not produce an error', function() {
			object.queryAlarmsByStateReadably('OK');
		});
	});
});

describe('Opkit', function() {
	describe('#healthReportByState', function() {
		it('should verify healthReportByState does not produce an error', function() {
			object.healthReportByState();
		});
	});
});

/*
describe('Opkit', function() {
	describe('#getSQSQueueSizeInt', function() {
		it('should verify getSQSQueueSizeInt does not cause an error', function(done) {
			object.getSQSQueueSizeInt('https://sqs.us-east-1.amazonaws.com/848840820992/nguyer-sms-queue', done);
		});
	});
});
*/

describe('Opkit', function() {
	describe('#sqsQueueParameterFormatter', function() {
		it('should be a basic test', function() {
			//object.updateAuthKeys('AKIAJOQCFVMRLLNFWLZA', 'bHXuXbdF9tg7NJjCN2PutXjCJnkCV+Cb/0vJPn7F');
			object.sqsQueueParameterFormatter('https://sqs.us-east-1.amazonaws.com/848840820992/nguyer-sms-queue', 'Attrib');
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