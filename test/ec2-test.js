var assert = require('chai').assert;
var opkit = require('../index');
var ecInstance = new opkit.EC2();
var sinon = require('sinon');
require('sinon-as-promised');
var AWS = require('aws-promised');

describe('EC2', function() {

	var auth1;
	var result;
	var spy;

	before(function() {
		auth1 = new opkit.Auth();
		auth1.updateRegion('narnia-1');
		auth1.updateAuthKeys('shiny gold one', 'old rusty one');

		sinon.stub(AWS, 'ec2', function(auth) {
			this.startInstancesPromised = function(params) {
				return Promise.resolve(true);
			};
			this.stopInstancesPromised = function(params) {
				return Promise.resolve(true);
			};
			this.describeInstancesPromised = function(params) {
				var data = {};
				data.Reservations = [{Instances : [{InstanceId : 'ExampleId', 
										Tags : [{Key : 'Name', Value : 'Tag'}], State : {Name : 'Testing'}}]}];
				return Promise.resolve(data);
			};
			this.waitForPromised = function(params) {
				return Promise.resolve("Success");
			};
		});
	});

	afterEach(function() {
		result = undefined;
		spy = undefined;
	});

	after(function() {
		AWS.ec2.restore();
	});

	describe("starting and stopping instaces", function() {
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
	});

	describe('Identifying EC2 instances', function() {
		describe("getInstanceID", function() {
			before(function() {
				AWS.ec2.restore();
				sinon.stub(AWS, 'ec2', function(auth) {
					this.describeInstancesPromised = function(params) {
						var data = {};
						data.Reservations = [{Instances : [{InstanceId : 'ExampleId', 
												Tags : [{Key : 'Name', Value : 'Tag'}], State : {Name : 'Testing'}}]}];
						return Promise.resolve(data);
					};
				});
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
				AWS.ec2.restore();
				sinon.stub(AWS, 'ec2', function(auth) {
					this.describeInstancesPromised = function(params) {
						var data = {};
						data.Reservations = [{Instances : [{InstanceId : 'ExampleId', 
												Tags : [{Key : 'NotName', Value : 'Tag'}], State : {Name : 'Testing'}}]}];
						return Promise.resolve(data);
					};
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
	});

	describe('Identifying instances by status', function() {
		describe("getInstancesStatus", function() {
			before(function() {
				AWS.ec2.restore();
				sinon.stub(AWS, 'ec2', function(auth) {
					this.describeInstancesPromised = function(params) {
						var data = {};
						data.Reservations = [{Instances : [{InstanceId : 'ExampleId', 
												Tags : [{Key : 'NotName', Value : 'Tag'}], State : {Name : 'Testing'}}]}];
						return Promise.resolve(data);
					};
				});
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
	});

	describe("Retrieving EC2 Logs", function() {
		describe("getLogs", function() {
			before(function() {
				AWS.ec2.restore();
				sinon.stub(AWS, 'ec2', function(auth) {
					this.getConsoleOutputPromised = function(params) {
						return Promise.resolve({Timestamp : 1, Output : 'dGVzdA=='});
					};
					this.describeInstancesPromised = function(params) {
						var data = {};
						data.Reservations = [{Instances : [{InstanceId : 'ExampleId', 
												Tags : [{Key : 'NotName', Value : 'Tag'}], State : {Name : 'Testing'}}]}];
						return Promise.resolve(data);
					};
				});
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
				AWS.ec2.restore();
				sinon.stub(AWS, 'ec2', function(auth) {
					this.describeInstancesPromised = function(params) {
						var data = {};
						data.Reservations = [{Instances : [{InstanceId : 'ExampleId', 
															Tags : [{Key : 'NotName', Value : 'Tag'}], State : {Name : 'Testing'}},
															{InstanceId : 'OtherId', 
																Tags : [{Key : 'OtherName', Value : 'Tag'}], State : {Name : 'Testing'}}]}];
						return Promise.resolve(data);
					};
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
				AWS.ec2.restore();
				sinon.stub(AWS, 'ec2', function(auth) {
					this.describeInstancesPromised = function(params) {
						return Promise.resolve({});
					};
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
	});

	describe("reboot", function() {
		before(function() {
			AWS.ec2.restore();
			sinon.stub(AWS, 'ec2', function(auth) {
				this.startInstancesPromised = function(params) {
					return Promise.resolve(true);
				};
				this.stopInstancesPromised = function(params) {
					return Promise.resolve(true);
				};
				this.describeInstancesPromised = function(params) {
					return Promise.resolve({});
				};
				this.waitForPromised = function(params) {
					return Promise.resolve("Success");
				};
			});
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