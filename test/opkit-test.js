var assert = require('chai').assert;
var opkit = require('../index');
var opkitObject = new opkit();
var sinon = require('sinon');
var AWSMock = require('aws-sdk-mock');
var AWS = require('aws-promised');

var auth1 = new opkit.Auth();
auth1.updateRegion('narnia-1');
auth1.updateAuthKeys('shiny gold one', 'old rusty one');

opkitObject.createAuth("Test", auth1);

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

AWSMock.mock('CloudWatch', 'describeAlarms', function(params, callback){
	callback(null, {
		MetricAlarms: [{
			StateValue : 'OK',
			MetricName : 'MetricName',
			AlarmDescription: 'AlarmDescription',
			Namespace : 'Namespace',
			AlarmName : 'AlarmName'
		}]
	});
});

describe('Opkit', function() {
	describe('SQS', function() {
		describe('SQSQueueSizeInt', function() {
			var result = undefined;
			before(function() {
				result = undefined;
				return opkitObject.getSQSQueueSizeInt("example.com")
				.then(function(data) {
					result = data;
				});
			});
			
			it ("getSQSQueueSizeInt successfully returns a promise with specified parameters", function() {
			assert.equal(result, 2);
			
			});
		});	
		
		describe('SQSQueueSizeNotVisibleInt', function() {
			var result = undefined;
			before(function() {
				result = undefined;
				return opkitObject.getSQSQueueSizeNotVisibleInt("example.com")
				.then(function(data) {
					result = data;
				});
			});
			
			it ("getSQSQueueSizeInt successfully returns a promise with specified parameters", function() {
			assert.equal(result, 0);
			
			});
		});	
		
		describe('ListQueues', function() {
			before(function() {
				result = undefined;
				return opkitObject.listQueues("prefix")
				.then(function (data) {
					result = data;
				});
			});
			
			it("listQueues successfully returns a promise with an array of queue urls", function() {
				assert.equal(result.toString(), ['www.example.com'].toString());
			});
		});
	});
	describe('Alarms', function(){
		describe('#queryAlarmsByState()', function(){
			before(function() {
				result = undefined;
				return opkitObject.queryAlarmsByState('OK')
				.then(function (data){
					result = data.MetricAlarms[0].StateValue;
				});
			});	
			
			it('Should result in an object with StateValue same as state given', function () {
				assert.equal(result, 'OK');
			});
		});
		
		describe('#queryAlarmsByStateReadably', function(){
			before(function() {
				result = undefined;
				return opkitObject.queryAlarmsByStateReadably('OK')
				.then(function (data){
					result = data;
				});
			});
			
			it('Should result in the correct human-readable string', function () {
				assert.equal(result, 'Namespace, AlarmName: AlarmDescription\n');
			});
		});
		
		describe('#countAlarmsByState', function(){
			before(function () {
				result = undefined;
				return opkitObject.countAlarmsByState('OK')
				.then(function (data){
					result = data;
				});
			});
			
			it('Should result in the number of alarms in the particular search', function () {
				assert.equal(result, 1);
			});
		});
	});
});