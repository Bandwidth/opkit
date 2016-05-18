var assert = require('chai').assert;
var opkit = require('../index');
var sqsqueue = new opkit.SQS();
var sinon = require('sinon');
var AWSMock = require('aws-sdk-mock');
var AWS = require('aws-promised');

var auth1 = new opkit.Auth();
auth1.updateRegion('narnia-1');
auth1.updateAuthKeys('shiny gold one', 'old rusty one');

AWSMock.mock('SQS', 'getQueueAttributes', function(params, callback) {
	var data = {};
	var qualities = {};
	qualities.ApproximateNumberOfMessages = 2;
	qualities.ApproximateNumberOfMessagesNotVisible = 0;
	data.Attributes = qualities;
	callback(null, data);
});

AWSMock.mock('SQS', 'listQueues', function(params, callback) {
	var data = {};
	var urls = ['www.example.com'];
	data.QueueUrls = urls;
	callback(null, data);
});

AWSMock.mock('SQS', 'getQueueUrl', function(params, callback) {
	callback(null, "www.example.com");
});

describe('Opkit testing', function() {
	describe('SQSQueueSizeInt', function() {
		var result = undefined;
		before(function() {
			result = undefined;
			sqsqueue.getSQSQueueSizeInt("https://sqs", auth1)
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
			sqsqueue.getSQSQueueSizeNotVisibleInt("Example", auth1)
			.then(function (data) {
				result = data;
			});
		});
		
		it("getSQSQueueSizeNotVisibleInt successfully returns a promise with specified parameters", function() {
			assert.equal(result,0);
		});
	});
	describe('ListQueues', function() {
		before(function() {
			result = undefined;
			sqsqueue.listQueues("prefix", auth1)
			.then(function (data) {
				result = data;
			});
		});
		
		it("listQueues successfully returns a promise with an array of queue urls", function() {
			assert.equal(result.toString(), ['www.example.com'].toString());
		});
	});
});
