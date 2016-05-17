var assert = require('chai').assert;
var opkit = require('../index');
var sqsqueue = new opkit.SQS();
var sinon = require('sinon');
var AWSMock = require('aws-sdk-mock');
var AWS = require('aws-promised');

var result = undefined;

AWSMock.mock('SQS', 'getQueueAttributes', function(params, callback) {
	var data = {};
	var qualities = {};
	qualities.ApproximateNumberOfMessages = 2;
	qualities.ApproximateNumberOfMessagesNotVisible = 0;
	data.Attributes = qualities;
	callback(null, data);
});

describe('Opkit testing', function() {
	describe('SQSQueueSizeInt', function() {
		before(function() {
			result = undefined;
			sqsqueue.getSQSQueueSizeInt("Example", {apiVersion: '2012-11-05'})
			.then(function (data) {
				result = data;
			});
		});
		
		it("getSQSQueueSizeInt successfully returns a promise with specified parameters", function() {
			assert.equal(result, 2);
		});
	});	
	describe('SQSQueueSizeNotVisibleInt', function() {
		before(function() {
			result = undefined;
			sqsqueue.getSQSQueueSizeNotVisibleInt("Example", {apiVersion: '2012-11-05'})
			.then(function (data) {
				result = data;
			});
		});
		
		it("getSQSQueueSizeNotVisibleInt successfully returns a promise with specified parameters", function() {
			assert.equal(result,0);
		});
	});
});



