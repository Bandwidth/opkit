var assert = require('chai').assert;
var opkit = require('../index');
var alarms = new opkit.Alarms();
var sinon = require('sinon');
var AWSMock = require('aws-sdk-mock');
var AWS = require('aws-promised');

var auth1 = new opkit.Auth();
auth1.updateRegion('narnia-1');
auth1.updateAuthKeys('shiny gold one', 'old rusty one');
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

var result;

describe('Alarms', function(){
	describe('#queryAlarmsByState()', function(){
		before(function() {
			result = undefined;
			alarms.queryAlarmsByState('OK', auth1)
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
			alarms.queryAlarmsByStateReadably('OK', auth1)
			.then(function (data){
				result = data;
			});
		});
		it('Should result in the correct human-readable string', function () {
			assert.equal(result, 'Namespace, AlarmName: AlarmDescription\n');
		})
	});
	describe('#countAlarmsByState', function(){
		before(function () {
			result = undefined;
			alarms.countAlarmsByState('OK', auth1)
			.then(function (data){
				result = data;
			});
		});
		it('Should result in the number of alarms in the particular search', function () {
			assert.equal(result, 1);
		});
	});
	describe('#healthReportByState', function(){
		before(function () {
			result = undefined;
			alarms.healthReportByState(auth1)
			.then(function (data){
				result = data;
			});
		});
		it('Should result in a correct health report', function () {
			assert.equal(result, "Number Of Alarms, By State: \n"+
			"There are "+'1'+" OK alarms, \n"+
			"          "+'0'+ " alarming alarms, and \n"+
			"          "+'0'+" alarms for which there is insufficient data.");
		});
	});
	describe('#queryAlarmsByWatchlist()', function(){
		before(function() {
			result = undefined;
			alarms.queryAlarmsByWatchlist(['AlarmName'], auth1)
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
			result = undefined;
			alarms.queryAlarmsByWatchlistReadably(['AlarmName'], auth1)
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
			result = undefined;
			alarms.queryAlarmsByPrefix('Alarm', auth1)
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
			result = undefined;
			alarms.queryAlarmsByPrefixReadably('Alarm', auth1)
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

});