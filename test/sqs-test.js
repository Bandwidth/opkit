var assert = require('chai').assert;
var opkit = require('../index');
var sqsqueue = new opkit.SQS();
var sinon = require('sinon');
require('sinon-as-promised');
var AWS = require('aws-promised');

describe('SQS', function() {

	var auth1;
	var result;

	before(function() {
		auth1 = new opkit.Auth();
		auth1.updateRegion('narnia-1');
		auth1.updateAuthKeys('shiny gold one', 'old rusty one');

		sinon.stub(AWS, 'sqs', function(auth) {
			this.getQueueAttributesPromised = function(params) {
				var data = {};
				var qualities = {};
				qualities.ApproximateNumberOfMessages = 2;
				qualities.ApproximateNumberOfMessagesNotVisible = 0;
				data.Attributes = qualities;
				return Promise.resolve(data);
			};
			this.listQueuesPromised = function(params) {
				var data = {};
				var urls = ['www.example.com'];
				data.QueueUrls = urls;
				return Promise.resolve(data);
			};
			this.getQueueUrlPromised = function(params) {
				return Promise.resolve('www.example.com');
			}
		});
	});

	afterEach(function() {
		result = undefined;
	});

	after(function() {
		AWS.sqs.restore();
	});

	describe('SQSQueueSizeInt', function() {
		before(function() {
			return sqsqueue.getSQSQueueSizeInt("https://sqs", auth1)
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
			return sqsqueue.getSQSQueueSizeNotVisibleInt("Example", auth1)
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
			return sqsqueue.listQueues("prefix", auth1)
			.then(function (data) {
				result = data;
			});
		});
		
		it("listQueues successfully returns a promise with an array of queue urls", function() {
			assert.equal(result.toString(), ['www.example.com'].toString());
		});
	});
});
