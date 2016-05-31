var assert = require('chai').assert;
var opkit = require('../index');
var ecInstance = new opkit.EC2();
var sinon = require('sinon');
var AWSMock = require('aws-sdk-mock');
var AWS = require('aws-promised');

var auth1 = new opkit.Auth();
auth1.updateRegion('narnia-1');
auth1.updateAuthKeys('shiny gold one', 'old rusty one');

AWSMock.mock('EC2', 'startInstances', function(params, callback) {
	var data = 2;
	callback(null, data);
});

AWSMock.mock('EC2', 'stopInstances', function(params, callback) {
	var data = 9;
	callback(null, data);
});

AWSMock.mock('EC2', 'describeInstances', function(params, callback) {
	var data = {};
	data.Reservations = [{Instances : [{InstanceId : 'ExampleId'}]}];
	callback(null, data);
});

describe('EC2', function() {
	describe('#start', function() {
		var result = undefined;
		before(function() {
			result = undefined;
			return ecInstance.start('tag', auth1)
			.then(function(data) {
				result = data;
			});
		});
		it("starting an EC2 instance works", function() {
			assert.equal(result, 2);
		});
	});

	describe('#stop', function() {
		before(function() {
			result = undefined;
			return ecInstance.stop('tag', auth1)
			.then(function(data) {
				result = data;
			});
		});
		it("stopping an EC2 instance works", function() {
			assert.equal(result, 9);
		});
	});

	describe('#getInstanceID', function() {
		before (function() {
			result = undefined;
			return ecInstance.getInstanceID('tag', auth1)
			.then(function(data) {
				result = data;
			});
		});
		it("getting an instance ID of a specified EC2 instance works", function() {
			assert.equal(result, 'ExampleId');
		});
	});
});