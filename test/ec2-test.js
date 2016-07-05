var assert = require('chai').assert;
var opkit = require('../index');
var ecInstance = new opkit.EC2();
var sinon = require('sinon');
var AWSMock = require('aws-sdk-mock');
var AWS = require('aws-promised');

describe('EC2', function() {

	var auth1;
	var result;
	var spy;

	before(function() {
		auth1 = new opkit.Auth();
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
			data.Reservations = [{Instances : [{InstanceId : 'ExampleId', 
									Tags : [{Key : 'Name', Value : 'Tag'}], State : {Name : 'Testing'}}]}];
			callback(null, data);
		});

		AWSMock.mock('EC2', 'waitFor', function(string, params, callback) {
			callback(null, "Success");
		});

		AWSMock.mock('EC2', 'getConsoleOutput', function(params, callback) {
			callback(null, {Timestamp : 1, Output : 'dGVzdA=='});
		});
	});

	afterEach(function() {
		result = undefined;
		spy = undefined;
	});

	describe("start", function() {
		before(function() {
			return ecInstance.start('Name', 'My-EC2', auth1)
			.then(function(data) {
				result = data;
			});			
		});

		it("starting an EC2 instance works", function() {
			assert.equal(result, "Success");
		});
	});

	describe("startByName", function() {
		before(function() {
			spy = sinon.spy(ecInstance, "start");
			return ecInstance.startByName('My-EC2', auth1)
			.then(function(data) {
				result = data;
			});			
		});

		it("starting an EC2 instance by name works", function() {
			assert.equal(spy.calledWithExactly('Name', 'My-EC2', auth1),true);			
		});
	});

	describe("stop", function() {
		before(function() {
			return ecInstance.stop('Name', 'My-EC2', auth1)
			.then(function(data) {
				result = data;
			});
		});

		it("stopping an EC2 instance works", function() {
			assert.equal(result, "Success");
		});
	});

	describe("stopByName", function() {
		before(function() {
			spy = sinon.spy(ecInstance, 'stop');
			return ecInstance.stopByName('My-EC2', auth1)
			.then(function(data) {
				result = data;
			});			
		});

		it("stopping an EC2 instance by name works", function() {
			assert.equal(spy.calledWithExactly('Name', 'My-EC2', auth1),true);
		});
	});

	describe("getInstanceID", function() {
		before(function() {
			return ecInstance.getInstanceID('tag', 'My-EC2', auth1)
			.then(function(data) {
				result = data;
			});
		});

		it("getting the instance ID of a specified EC2 instance works", function() {
			assert.equal(result[0], 'ExampleId');
		});
	});

	describe("listInstances", function() {
		before(function() {
			return ecInstance.listInstances('tag', 'My-EC2', auth1)
			.then(function(data) {
				result = data;
			});
		});

		it("listing instances works", function() {
			assert.equal(JSON.stringify(result[0]), 
							'{"Name":"Tag","State":"Testing","id":"ExampleId"}');
		});
	});

	describe("listInstances without a name tag", function() {
		before(function() {
			AWSMock.restore('EC2', 'describeInstances');
			AWSMock.mock('EC2', 'describeInstances', function(params, callback) {
				var data = {};
				data.Reservations = [{Instances : [{InstanceId : 'ExampleId', 
										Tags : [{Key : 'NotName', Value : 'Tag'}], State : {Name : 'Testing'}}]}];
				callback(null, data);
			});
			return ecInstance.listInstances('tag', 'My-EC2', auth1)
			.then(function(data) {
				result = data;
			});
		});

		it("listing instances without a name tag works", function() {
			assert.equal(JSON.stringify(result[0]), 
							'{"State":"Testing","id":"ExampleId"}');
		});
	});

	describe("getInstancesStatus", function() {
		before(function() {
			return ecInstance.getInstancesStatus('tag', 'My-EC2', 'running', auth1)
			.then(function(data) {
				result = data;
			});
		});

		it("getting data about instances based on state works", function() {
			assert.equal(JSON.stringify(result[0]), '{"State":"Testing","id":"ExampleId"}');
		});
	});

	describe("getInstancesStopped", function() {
		before(function() {
			spy = sinon.spy(ecInstance, 'getInstancesStatus');
			return ecInstance.getInstancesStopped('tag', 'My-EC2', auth1);
		});

		after(function() {
			ecInstance.getInstancesStatus.restore();
		});

		it("getting data about stopped instances works", function() {
			assert.equal(spy.calledWith('tag', 'My-EC2', 'stopped', auth1), true);
		});
	});

	describe("getInstancesStarted", function() {
		before(function() {
			spy = sinon.spy(ecInstance, 'getInstancesStatus');
			return ecInstance.getInstancesStarted('tag', 'My-EC2', auth1);
		});

		it("getting data about started instances works", function() {
			assert.equal(spy.calledWith('tag', 'My-EC2', 'running', auth1), true);
		});
	});

	describe("getLogs", function() {
		before(function() {
			return ecInstance.getLogs('tag', 'My-EC2', auth1)
			.then(function(data) {
				result = data;
			});
		});

		it("getting logs about an instance works", function() {
			assert.equal(result, 'Timestamp: 1\ntest');
		});
	});

	describe("getLogs with multiple instances", function() {
		before(function() {
			AWSMock.restore('EC2', 'describeInstances');
			AWSMock.mock('EC2', 'describeInstances', function(params, callback) {
				var data = {};
				data.Reservations = [{Instances : [{InstanceId : 'ExampleId', 
													Tags : [{Key : 'NotName', Value : 'Tag'}], State : {Name : 'Testing'}},
													{InstanceId : 'OtherId', 
														Tags : [{Key : 'OtherName', Value : 'Tag'}], State : {Name : 'Testing'}}]}];
				callback(null, data);
			});
			return ecInstance.getLogs('tag', 'My-EC2', auth1)
			.catch(function(err) {
				result = err;
			});
		});

		it("does not retrieve logs if more than one instance is specified", function() {
			assert.equal(result, 'More than one instance specified.');
		});
	});

	describe("getLogs with no instances", function() {
		before(function() {
			AWSMock.restore('EC2', 'describeInstances');
			AWSMock.mock('EC2', 'describeInstances', function(params, callback) {
				callback(null, {});
			});
			return ecInstance.getLogs('tag', 'My-EC2', auth1)
			.catch(function(err) {
				result = err;
			});
		});

		it("does not retrieve logs if no instances are specified", function() {
			assert.equal(result, 'No instances available.');
		});
	});

	describe("reboot", function() {
		before(function() {
			return ecInstance.reboot('tag', 'My-EC2', auth1)
			.then(function(data) {
				result = data;
			});	
		});

		it("rebooting instances works", function() {
			assert.equal(result, 'Success');
		});
	});
});