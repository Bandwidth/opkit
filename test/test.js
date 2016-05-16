var assert = require('chai').assert;
var opkit = require('../index');
var sqsqueue = new opkit.SQS();
var sinon = require('sinon');
var AWSMock = require('aws-sdk-mock');
var AWS = require('aws-promised');

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
});

