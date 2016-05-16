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
beforeEach(function() {
	
	AWSMock.mock('SQS', 'getQueueAttributes', function(params, callback) {
		callback(null, 'success');
	});
	
	sinon.stub(sqsqueue, 'getSQSQueueSizeInt', function(url, callback) {
		this.retrieveSQSQueueData(url, 'ApproximateNumberOfMessages', callback);
	});
	
	sinon.stub(sqsqueue, 'getSQSQueueSizeNotVisibleInt', function(url, callback) {
		this.retrieveSQSQueueData(url, 'ApproximateNumberOfMessagesNotVisble', callback);
	});
	
	sinon.stub(sqsqueue, 'retrieveSQSQueueData', function(url, param, callback) {
		var sqs = new AWS.sqs({apiVersion: '2012-11-05'});
		sqs.getQueueAttributes(this.sqsQueueParameterFormatter(url, param), function(err, data) {
			if (err) {
				callback(err, null);
			}
			else {
				callback(null, data);
			}
		});
	});
	
});

//Executed after tests
afterEach(function() {
	sqsqueue.retrieveSQSQueueData.restore();
	sqsqueue.getSQSQueueSizeInt.restore();
	sqsqueue.getSQSQueueSizeNotVisibleInt.restore();
	AWSMock.restore('SQS', 'getQueueAttributes');
});

it("getSQSQueueSizeInt successfully makes a callback", function() {
	var spy = sinon.spy();
	var proxy = sqsqueue.getSQSQueueSizeInt("Example", spy);
	
	assert(spy.called);
});

it("getSQSQueueSizeNotVisibleInt successfully makes a callback", function() {
	var spy = sinon.spy();
	var proxy = sqsqueue.getSQSQueueSizeNotVisibleInt("Example", spy);
	
	assert(spy.called);
});

