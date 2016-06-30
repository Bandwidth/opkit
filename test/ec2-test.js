var assert = require('chai').assert;
var opkit = require('../index');
var ecInstance = new opkit.EC2();
var sinon = require('sinon');
var AWSMock = require('aws-sdk-mock');
var AWS = require('aws-promised');

describe('EC2', function() {

	var auth1;
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

	beforeEach(function() {
		spy = undefined;
	});

	it("starting an EC2 instance works", function() {
		return ecInstance.start('Name', 'My-EC2', auth1)
		.then(function(data) {
			assert.equal(data, "Success")
		});
	});

	it("starting an EC2 instance by name works", function() {
		spy = sinon.spy(ecInstance, "start");
		return ecInstance.startByName('My-EC2', auth1)
		.then(function(data) {
			assert.equal(data, "Success");
			assert.equal(spy.calledWithExactly('Name', 'My-EC2', auth1),true);
		});
	});

	it("stopping an EC2 instance works", function() {
		return ecInstance.stop('Name', 'My-EC2', auth1)
		.then(function(data) {
			assert.equal(data, "Success");
		});
	});

	it("stopping an EC2 instance by name works", function() {
		spy = sinon.spy(ecInstance, 'stop');
		return ecInstance.stopByName('My-EC2', auth1)
		.then(function(data) {
			assert.equal(data, "Success");
			assert.equal(spy.calledWithExactly('Name', 'My-EC2', auth1),true);
		});
	});

	it("getting an instance ID of a specified EC2 instance works", function() {
		return ecInstance.getInstanceID('tag', 'My-EC2', auth1)
		.then(function(data) {
			assert.equal(data[0], 'ExampleId');
		});
	});

	it("listing instances works", function() {
		return ecInstance.listInstances('tag', 'My-EC2', auth1)
		.then(function(data) {
			assert.equal(JSON.stringify(data[0]), 
							'{"Name":"Tag","State":"Testing","id":"ExampleId"}');
		});
	});

	it("listing instances without a name tag works", function() {
		AWSMock.restore('EC2', 'describeInstances');
		AWSMock.mock('EC2', 'describeInstances', function(params, callback) {
			var data = {};
			data.Reservations = [{Instances : [{InstanceId : 'ExampleId', 
									Tags : [{Key : 'NotName', Value : 'Tag'}], State : {Name : 'Testing'}}]}];
			callback(null, data);
		});
		return ecInstance.listInstances('tag', 'My-EC2', auth1)
		.then(function(data) {
			assert.equal(JSON.stringify(data[0]), 
							'{"State":"Testing","id":"ExampleId"}');
		});
	});

	it("getting data about instances based on state works", function() {
		return ecInstance.getInstancesStatus('tag', 'My-EC2', 'running', auth1)
		.then(function(data) {
			assert.equal(JSON.stringify(data[0]), '{"State":"Testing","id":"ExampleId"}');
		});
	});

	it("getting data about stopped instances works", function() {
		spy = sinon.spy(ecInstance, 'getInstancesStatus');
		return ecInstance.getInstancesStopped('tag', 'My-EC2', auth1)
		.then(function() {
			assert.equal(spy.calledWith('tag', 'My-EC2', 'stopped', auth1), true);
			ecInstance.getInstancesStatus.restore();
		});
	});

	it("getting data about started instances works", function() {
		spy = sinon.spy(ecInstance, 'getInstancesStatus');
		return ecInstance.getInstancesStarted('tag', 'My-EC2', auth1)
		.then(function() {
			assert.equal(spy.calledWith('tag', 'My-EC2', 'running', auth1), true);
		});
	});

	it("getting logs about an instance works", function() {
		return ecInstance.getLogs('tag', 'My-EC2', auth1)
		.then(function(data) {
			assert.equal(data, 'Timestamp: 1\ntest');
		});
	});

	it("does not retrieve logs if more than one instance is specified", function() {
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
			assert.equal(err, 'More than one instance specified.');
		});
	});

	it("rebooting instances works", function() {
		return ecInstance.reboot('tag', 'My-EC2', auth1)
		.then(function(data) {
			assert.equal(data, 'Success');
		});		
	});
});