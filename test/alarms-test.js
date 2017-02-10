var assert = require('chai').assert;
var opkit = require('../index');
var alarms = new opkit.Alarms();
var sinon = require('sinon');
require('sinon-as-promised');
var Promise = require('bluebird');
var auth1 = new opkit.Auth();
var AWS = require('aws-promised');

var result;

describe('Alarms', function(){

	before(function() {
		auth1.updateRegion('narnia-1');
		auth1.updateAuthKeys('shiny gold one', 'old rusty one');
		sinon.stub(AWS, 'cloudWatch', function(auth) {
			this.describeAlarmsPromised = function(params) {
				return Promise.resolve({
					MetricAlarms: [{
						StateValue : 'OK',
						MetricName : 'MetricName',
						AlarmDescription: 'AlarmDescription',
						Namespace : 'Namespace',
						AlarmName : 'AlarmName'
					}]
				});
			}
		});
	});

	after(function() {
		AWS.cloudWatch.restore();
	});

	afterEach(function() {
		result = undefined;
	});

	describe('#queryAlarmsByState()', function(){
		before(function() {
			return alarms.queryAlarmsByState('OK', auth1)
			.then(function (data){
				result = data.MetricAlarms[0].StateValue;
			});
		});		
		it('Should result in an object with StateValue same as state given', function () {
			assert.equal(result, 'OK');
		});
	});
	describe('#queryAlarmsByStateReadably', function(){
		before(function () {
			return alarms.queryAlarmsByStateReadably('OK', auth1)
			.then(function (data){
				result = data;
			});
		});
		it('Should result in the correct human-readable string', function () {
			assert.isOk(result);
		});
	});
	describe('#countAlarmsByState', function(){
		before(function () {
			return alarms.countAlarmsByState('OK', auth1)
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
			return alarms.queryAlarmsByWatchlist(['AlarmName'], auth1)
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
			return alarms.queryAlarmsByWatchlistReadably(['AlarmName'], auth1)
			.then(function (data){
				result = data;
			});
		});		
		it('Should result in a neat string with the correct AlarmName', function () {
			assert.equal(result, '*OK*: AlarmName\n');
		});
	});
	describe('#queryAlarmsByPrefix()', function(){
		before(function() {
			return alarms.queryAlarmsByPrefix('Alarm', auth1)
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
			return alarms.queryAlarmsByPrefixReadably('Alarm', auth1)
			.then(function (data){
				result = data;
			});
		});		
		it('Should result in a neat string with the correct AlarmName', function () {
			assert.equal(result, '*OK*: AlarmName\n');
		});
	});
	describe('#getAllAlarms with an ignore list', function(){
		before(function() {
			return alarms.getAllAlarms(auth1, {}, ['AlarmName'])
			.then(function (data){
				result = data;
			})
		});
		it('Should retrieve no results', function () {
			assert.isOk(result);
		});
	});
	describe('#getAllAlarms ignore a non-existent alarm', function(){
		before(function() {
			return alarms.getAllAlarms(auth1, {}, ['SomeOtherAlarm'])
			.then(function (data){
				result = data;
			});
		});
		it('Should retrieve no results', function () {
			assert.isOk(result);
		});
	});
	describe('#healthReportByState', function(){

		before(function () {
			AWS.cloudWatch.restore();
			sinon.stub(AWS, 'cloudWatch', function(auth) {
				this.describeAlarmsPromised = function(params) {
					return Promise.resolve({
						MetricAlarms: [{
							StateValue : 'OK',
							MetricName : 'MetricName',
							AlarmDescription: 'AlarmDescription',
							Namespace : 'Namespace',
							AlarmName : 'AlarmNamey'
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
				}
			});
			return alarms.healthReportByState(auth1)
			.then(function (data){
				result = data;
			});
		});
		it('Should result in a correct health report', function () {
			assert.equal(result, "*Number Of Alarms, By State:* \n"+
			"OK: *"+'1'+"*\n"+
			"Alarm: *"+'1'+ "*\n"+
			"Insufficient Data: *"+'1'+"*");
		});
	});
	describe('Alarms Paginated Response', function() {

		before(function() {
			AWS.cloudWatch.restore();
			sinon.stub(AWS, 'cloudWatch', function(auth) {
				this.describeAlarmsPromised = function(params) {
					if (!params.NextToken) {
						return Promise.resolve({
							MetricAlarms: [{
								StateValue : 'OK',
								MetricName : 'MetricName',
								AlarmDescription: 'AlarmDescription',
								Namespace : 'Namespace',
								AlarmName : 'AlarmName'
							}],
							NextToken : 'next'
						});
					} else {
						return Promise.resolve({
							MetricAlarms: [{
								StateValue : 'OK',
								MetricName : 'MetricName2',
								AlarmDescription: 'AlarmDescription2',
								Namespace : 'Namespace2',
								AlarmName : 'AlarmName2'
							}],
						});
					}
				}
			});
			return alarms.getAllAlarms(auth1)
			.then(function(data) {
				result = data;
			});
		});

		it('Should properly retrieve the alarms', function() {
			assert.isOk(result);
		});
	});
	describe('Alarms getMetricStatistics', function() {
		before(function() {
			AWS.cloudWatch.restore();
			sinon.stub(AWS, 'cloudWatch', function(auth) {
				this.getMetricStatisticsPromised = function(params) {
					return Promise.resolve([{Timestamp : 'time', Sum : 2, Unit : 'none'}])
				}
			});
			return alarms.getMetricStatistics(auth1, {Namespace : 'Namespace',
														MetricName : 'Metric',
														Period : 60,
														Statistics : ['Statistics']}, 10, 1)
			.then(function(data) {
				result = data;
			});
		});

		it('Should properly retrieve statistics', function() {
			assert.isOk(result);
		});
	});
	describe('Alarms getMetricStatisticsSingle', function() {
		before(function() {
			AWS.cloudWatch.restore();
			sinon.stub(AWS, 'cloudWatch', function(auth) {
				this.getMetricStatisticsPromised = function(params) {
					return Promise.resolve([{Timestamp : 'time', Sum : 2, Unit : 'none'}])
				}
			});
			return alarms.getMetricStatisticsSingle(auth1, {Namespace : 'Namespace',
														MetricName : 'Metric',
														Period : 60,
														Statistics : ['Statistics']})
			.then(function(data) {
				result = data;
			});
		});

		it('Should properly retrieve statistics', function() {
			assert.isOk(result);
		});
	});
});
