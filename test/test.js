var assert = require('chai').assert;
var opkit = require('../index');
var sqsqueue = new opkit.SQS();
var alarms = new opkit.Alarms();
//var object = new opkit();
var sinon = require('sinon');
var AWSMock = require('aws-sdk-mock');
var AWS = require('aws-promised');

/**** Example
function once(fn) {
    var returnValue, called = false;
    return function () {
        if (!called) {
            called = true;
            returnValue = fn.apply(this, arguments);
        }
        return returnValue;
    };
}

it("calls the original function", function () {
    var spy = sinon.spy();
    var proxy = once(spy);

    proxy();

    assert(spy.called);
});
****/ 

//Mocking out functions
describe('Opkit testing', function() {

	describe('SQS functions', function() {
		
		beforeEach(function() {
			
			AWSMock.mock('SQS', 'getQueueAttributes', function(params, callback) {
				var data = {};
				var qualities = {};
				qualities.ApproximateNumberOfMessages = 2;
				qualities.ApproximateNumberOfMessagesNotVisible = 0;
				data.Attributes = qualities;
				callback(null, data);
			});
		});

		afterEach(function() {
			//sqsqueue.retrieveSQSQueueData.restore();
			AWSMock.restore('SQS', 'getQueueAttributes');
		});

		it("getSQSQueueSizeInt successfully makes a callback", function() {
			var spy = sinon.spy();
			var proxy = sqsqueue.getSQSQueueSizeInt("Example", {apiVersion: '2012-11-05'}, spy);
			
			assert(spy.calledWith(null, 2));
		});

		it("getSQSQueueSizeNotVisibleInt successfully makes a callback", function() {
			var spy = sinon.spy();
			var proxy = sqsqueue.getSQSQueueSizeNotVisibleInt("Example", {apiVersion: '2012-11-05'}, spy);
			
			assert(spy.calledWith(null, 0));
		});
	});
	
	/**** Some other testing unrelated to SQSQueues goes here - should be unaffected by mocks made eariler ****/
	
});

