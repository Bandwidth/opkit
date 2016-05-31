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

AWSMock.mock('EC2', 'waitFor', function(string, params, callback) {
	callback(null, "Success");
});

describe('EC2', function() {
	describe('#start', function() {
		var result = undefined;
		before(function() {
			result = undefined;
			return ecInstance.start('Name', 'My-EC2', auth1)
			.then(function(data) {
				result = data;
			});
		});
		it("starting an EC2 instance works", function() {
			assert.equal(result, "Success");
		});
	});

	describe('#startByName', function() {
		var result = undefined;
		before(function() {
			result = undefined;
			return ecInstance.startByName('My-EC2', auth1)
			.then(function(data) {
				result = data;
			});
		});
		it("starting an EC2 instance works", function() {
			assert.equal(result, "Success");
		});
	});

	describe('#stop', function() {
		before(function() {
			result = undefined;
			return ecInstance.stop('Name', 'My-EC2', auth1)
			.then(function(data) {
				result = data;
			});
		});
		it("stopping an EC2 instance works", function() {
			assert.equal(result, "Success");
		});
	});

	describe('#stopByName', function() {
		var result = undefined;
		before(function() {
			result = undefined;
			return ecInstance.stopByName('My-EC2', auth1)
			.then(function(data) {
				result = data;
			});
		});
		it("starting an EC2 instance works", function() {
			assert.equal(result, "Success");
		});
	});

	describe('#getInstanceID', function() {
		before (function() {
			result = undefined;
			return ecInstance.getInstanceID('tag', 'My-EC2', auth1)
			.then(function(data) {
				result = data;
			});
		});
		it("getting an instance ID of a specified EC2 instance works", function() {
			assert.equal(result[0], 'ExampleId');
		});
	});
});