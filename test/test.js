var assert = require('chai').assert;
var opkit = require('../index');
var object = new opkit.SQS();
var alarms = new opkit.Alarms();
//var object = new opkit();
var sinon = require('sinon');

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
	sinon.stub(object, 'retrieveSQSQueueData', function (url, param, auth, callback) {
		callback(null,'success.');
	});

	sinon.stub(object, 'getSQSQueueSizeInt', function(url, auth, callback) {
		object.retrieveSQSQueueData(url, 'ApproximateNumberOfMessages', auth, callback);
	});
	
	sinon.stub(object, 'getSQSQueueSizeNotVisibleInt', function(url, auth, callback) {
		object.retrieveSQSQueueData(url, 'ApproximateNumberOfMessagesNotVisible', auth, callback);
	});
	
	//Not sure how to stub out promises
	/*sinon.stub(alarms, 'healthReportByState', function(auth) {
		return new Promise(function(resolve) {
			return "success";
		});
	});*/
});

//Executed after tests
afterEach(function() {
	object.retrieveSQSQueueData.restore();
	object.getSQSQueueSizeInt.restore();
	object.getSQSQueueSizeNotVisibleInt.restore();
	//alarms.healthReportByState.restore();
});

it("getSQSQueueSizeInt successfully makes a callback", function() {
	var spy = sinon.spy();
	var proxy = object.getSQSQueueSizeInt("Example", "d", spy);
	
	assert(spy.called);
});

it("getSQSQueueSizeNotVisibleInt successfully makes a callback", function() {
	var spy = sinon.spy();
	var proxy = object.getSQSQueueSizeNotVisibleInt("Example", "d", spy);
	
	assert(spy.called);
});

/*
it("Does a simple test", function() {
	var spy = sinon.spy();
	var proxy = alarms.healthReportByState("test");
	proxy.then(spy);
	
	assert(spy.called);
});
*/
