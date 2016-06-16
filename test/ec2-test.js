var assert = require('chai').assert;
var opkit = require('../index');
var ecInstance = new opkit.EC2();
var sinon = require('sinon');
var AWSMock = require('aws-sdk-mock');
var AWS = require('aws-promised');

var auth1 = new opkit.Auth();
auth1.updateRegion('narnia-1');
auth1.updateAuthKeys('shiny gold one', 'old rusty one');

var result;
var spy;

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
	data.Reservations = [{Instances : [{InstanceId : 'ExampleId', Tags : [{Key : 'Name', Value : 'Tag'}], State : {Name : 'Testing'}}]}];
	callback(null, data);
});

AWSMock.mock('EC2', 'waitFor', function(string, params, callback) {
	callback(null, "Success");
});

describe('EC2', function() {

	describe('#start', function() {
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
		before(function() {
			spy = undefined;
			result = undefined;
			spy = sinon.spy(ecInstance, "start");
			return ecInstance.startByName('My-EC2', auth1)
			.then(function(data) {
				result = data;
			});
		});
		it("starting an EC2 instance works", function() {
			assert.equal(result, "Success");
			assert.equal(spy.calledWithExactly('Name', 'My-EC2', auth1),true);
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
		before(function() {
			spy = undefined;
			result = undefined;
			spy = sinon.spy(ecInstance, 'stop');
			return ecInstance.stopByName('My-EC2', auth1)
			.then(function(data) {
				result = data;
			});
		});
		it("starting an EC2 instance works", function() {
			assert.equal(result, "Success");
			assert.equal(spy.calledWithExactly('Name', 'My-EC2', auth1),true);
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

	describe('#listInstances', function() {
		before (function() {
			result = undefined;
			return ecInstance.listInstances('tag', 'My-EC2', auth1)
			.then(function(data) {
				result = data;
			});
		});
		it("getting data about a specified EC2 instance works", function() {
			assert.equal(JSON.stringify(result[0]), '{"Name":"Tag","State":"Testing","id":"ExampleId"}');
		});
	});

	describe('#listInstances without a name tag', function() {
		before (function() {
			AWSMock.restore('EC2', 'describeInstances');
			AWSMock.mock('EC2', 'describeInstances', function(params, callback) {
				var data = {};
				data.Reservations = [{Instances : [{InstanceId : 'ExampleId', Tags : [{Key : 'NotName', Value : 'Tag'}], State : {Name : 'Testing'}}]}];
				callback(null, data);
			});
			result = undefined;
			return ecInstance.listInstances('tag', 'My-EC2', auth1)
			.then(function(data) {
				result = data;
			});
		});
		it("getting data about a specified EC2 instance without a name works", function() {
			assert.equal(JSON.stringify(result[0]), '{"State":"Testing","id":"ExampleId"}');
		});
	});
});