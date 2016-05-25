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
				AWSMock.restore('CloudWatch', 'describeAlarms');
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
				AWSMock.restore('CloudWatch', 'describeAlarms');
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
				AWSMock.restore('CloudWatch', 'describeAlarms');
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
		
		describe('#queryAlarmsByWatchlist()', function(){
			before(function() {
				AWSMock.restore('CloudWatch', 'describeAlarms');
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
				result = undefined;
				return opkitObject.queryAlarmsByWatchlist(['AlarmName'])
				.then(function (data){
					result = data.MetricAlarms[0].AlarmName;
				});
			});		
			it('Should result in an object with AlarmName on the watchlist', function () {
				assert.equal(result, 'AlarmName');
			});
		});
		
		describe('#queryAlarmsByWatchlistReadably()', function(){
			before(function() {
				AWSMock.restore('CloudWatch', 'describeAlarms');
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
				result = undefined;
				return opkitObject.queryAlarmsByWatchlistReadably(['AlarmName'])
				.then(function (data){
					result = data;
				});
			});		
			it('Should result in a neat string with the correct AlarmName', function () {
				assert.equal(result, 'Namespace' +', ' + 
				'AlarmName' + ': ' +
				'AlarmDescription' + " (" +
				'OK' + ")\n");
			});
		});
		
		describe('#queryAlarmsByPrefix()', function(){
			before(function() {
				AWSMock.restore('CloudWatch', 'describeAlarms');
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
				result = undefined;
				return opkitObject.queryAlarmsByPrefix('Alarm')
				.then(function (data){
					result = data.MetricAlarms[0].AlarmName;
				});
			});		
			it('Should result in an object with AlarmName that starts with prefix', function () {
				assert.equal(result, 'AlarmName');
			});
		});
		
		describe('#queryAlarmsByPrefixReadably()', function(){
			before(function() {
				AWSMock.restore('CloudWatch', 'describeAlarms');
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
				result = undefined;
				return opkitObject.queryAlarmsByPrefixReadably('Alarm')
				.then(function (data){
					result = data;
				});
			});		
			it('Should result in a neat string with the correct AlarmName', function () {
				assert.equal(result, 'Namespace' +', ' + 
				'AlarmName' + ': ' +
				'AlarmDescription' + " (" +
				'OK' + ")\n");
			});
		});
		
		describe('#healthReportByState', function(){
			before(function () {
				AWSMock.restore('CloudWatch', 'describeAlarms');
				AWSMock.mock('CloudWatch', 'describeAlarms', function(params, callback){
					callback(null, {
						MetricAlarms: [{
							StateValue : 'OK',
							MetricName : 'MetricName',
							AlarmDescription: 'AlarmDescription',
							Namespace : 'Namespace',
							AlarmName : 'AlarmName'
						}
							,
						{
							StateValue : 'INSUFFICIENT_DATA',
							MetricName : 'MetricName',
							AlarmDescription: 'AlarmDescription',
							Namespace : 'Namespace',
							AlarmName : 'AlarmName'
						}
							,
						{
							StateValue : 'ALARM',
							MetricName : 'MetricName',
							AlarmDescription: 'AlarmDescription',
							Namespace : 'Namespace',
							AlarmName : 'AlarmName'
						}]
					});
				});
				result = undefined;
				return opkitObject.healthReportByState()
				.then(function (data){
					result = data;
				});
			});
			it('Should result in a correct health report', function () {
				assert.equal(result, "Number Of Alarms, By State: \n"+
				"There are "+'1'+" OK alarms, \n"+
				"          "+'1'+ " alarming alarms, and \n"+
				"          "+'1'+" alarms for which there is insufficient data.");
			});
		});
	});
	describe('Auth', function() {
		describe('#updateRegion()', function () {
			it('should update the region in that particular object', function () {
				var auth2 = new opkit.Auth();
				opkitObject.createAuth("name", auth2);
				opkitObject.updateRegion("us-east-1");
				assert.equal("us-east-1", auth2.props.region);
				opkitObject.updateRegion("hell");
				assert.equal("hell", auth2.props.region);
			});
		});
		
		describe('#updateAuthKeys()', function () {
			it('should update the keys in that particular object', function () {
				var auth2 = new opkit.Auth();
				opkitObject.createAuth("new", auth2);
				opkitObject.updateAuthKeys("skeleton", "otherSkeleton");
				assert.equal("skeleton", auth2.props.accessKeyId);
				assert.equal("otherSkeleton", auth2.props.secretAccessKey);
				opkitObject.updateAuthKeys("thirdSkeleton", "blue");
				assert.equal("thirdSkeleton", auth2.props.accessKeyId);
				assert.equal("blue", auth2.props.secretAccessKey);
			});
		});
		
		describe('#updateAccessKeyId()', function () {
			it('should update the access key ID', function () {
				var auth2 = new opkit.Auth();
				opkitObject.createAuth("newer", auth2);
				opkitObject.updateAccessKeyId("s");
				assert.equal("s", auth2.props.accessKeyId);
				opkitObject.updateAccessKeyId("t");
				assert.equal("t", auth2.props.accessKeyId);
			});
		});
		
		describe('#updateSecretAccessKey()', function () {
			it('should update the secret access key in that particular object', function () {
				var auth2 = new opkit.Auth();
				opkitObject.createAuth("newest", auth2);
				opkitObject.updateSecretAccessKey("green");
				assert.equal("green", auth2.props.secretAccessKey);
				opkitObject.updateSecretAccessKey("lockpick");
				assert.equal("lockpick", auth2.props.secretAccessKey);
			});
		});
		
		describe('#updateShortName', function () {
			it('should update the short name in that particular object', function () {
				var auth2 = new opkit.Auth();
				opkitObject.createAuth("lastone?", auth2);
				opkitObject.updateShortName("s");
				assert.equal("s", auth2.shortName);
				opkitObject.updateShortName("lockpick");
				assert.equal("lockpick", auth2.shortName);
			});
		});
	});
	
	describe('Opkit specific testing', function() {
		describe('#addPermission', function() {
			it('should correctly handle permissions', function() {
				result = undefined;
				result = opkitObject.addPermission("user", "Read");
				assert.equal(result, true);
				opkitObject.addPermission("user", "Write");
				result = opkitObject.addPermission("user", "Read");
				assert.equal(result, false);
			});
		});
		describe('#getPermission', function() {
			it('should correctly return a permission', function() {
				result = undefined;
				result = opkitObject.getPermission("user");
				assert.equal(result["Read"], result["Write"], true);
			});
		});
		describe('#createAuth', function() {
			it('should correctly create Auth objects', function() {
				result = undefined;
				var auth2 = new opkit.Auth();
				result = opkitObject.createAuth("bee", auth2);
				assert.equal(result,true);
				result = opkitObject.createAuth("bee", auth2);
				assert.equal(result, false);
			});
		});
		describe('#getAuths', function() {
			it('should correctly return Auths', function() {
				opkitObject = new opkit();
				var auth2 = new opkit.Auth();
				opkitObject.createAuth("blue", auth2);
				assert.equal(opkitObject.getAuths().toString(),"blue");
			});
		});
		describe('#chooseAuth', function() {
			it('should correctly switch between Auths', function() {
				result = undefined;
				result = opkitObject.chooseAuth("blue");
				assert.equal(result, true);
				result = opkitObject.chooseAuth("red");
				assert.equal(result, false);
			});
		});
	});
});