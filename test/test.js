var assert = require('chai').assert;
var Opkit = require('../opkit');
var object = new Opkit();
var sinon = require('sinon');

/****** EXAMPLE USAGE
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
    var callback = sinon.spy();
    var proxy = once(callback);

    proxy();

    assert(callback.called);
});
*/

it("calls the callback function", function() {
	var callback = sinon.spy();
	object.retrieveSQSQueueDataMock('example', 'ApproximateNumberOfMessages', callback);
	
	//proxy();
	
	assert(callback.called);
});

/* Does not work yet
it("test should call subscribers with message as first argument", function () {
    var key = 'ExampleKey';
	var sKey = 'ExampleSecretKey';
    var spy = sinon.spy();
	
	object.updateAuthKeys(key, sKey, spy);
	//assert.equal(object.props.accessKeyID,'ExampleKey');
	assert(spy.calledWith(key, sKey));
    PubSub.publishSync(message, "some payload");

    assert(spy.calledWith(message));
});
*/
