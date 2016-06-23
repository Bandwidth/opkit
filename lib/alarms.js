/**@namespace Alarms	*/

var AWS = require('aws-promised');
var Promise = require('bluebird');
function Alarms(){
}

/**
 * Queries Cloudwatch alarms that are currently in a particular state.
 * Returns a Promise containing a JS object with all of the alarms currently in that state.
 * @param {string} state - A string containing the state you'd like to query for (e.g. 'ALARM')
 * @param {Auth} auth - An auth object made using the keys and region you'd like to use..
 */

Alarms.prototype.queryAlarmsByState = function(state, auth){
	var cloudwatch = new AWS.cloudWatch(auth.props);
	return cloudwatch.describeAlarmsPromised({StateValue: state });
};
/**
 * Queries Cloudwatch alarms that are currently in a particular state.
 * Returns a Promise that resolves to a string containing information about each alarm in the queried state.
 * @param {string} state - A string containing the state you'd like to query for (e.g. 'ALARM')
 * @param {Auth} auth - An auth object made using the keys and region you'd like to use..
 */

Alarms.prototype.queryAlarmsByStateReadably = function(state, auth){
	return this.queryAlarmsByState(state, auth)
	.then(function(data){
		var returnMe = '';
		var alarms = data.MetricAlarms ;
		for (var k=0; k<alarms.length; k++){
			returnMe += '*'+alarms[k].Namespace +'*: ' + 
			alarms[k].AlarmDescription + "\n";
		}
		return Promise.resolve(returnMe);
	});
};

/**
 * Queries Cloudwatch alarms that are currently in a particular state.
 * Returns a Promise containing the number of alarms in the state.
 * @param {string} state - A string containing the state you'd like to query for (e.g. 'ALARM')
 * @param {Auth} auth - An auth object made using the keys and region you'd like to use..
 */
Alarms.prototype.countAlarmsByState = function(state, auth){
	return this.queryAlarmsByState(state, auth)
	.then(function(data){
		var alarms = data.MetricAlarms;
		return alarms.length;
	});
};

/**
 * Queries Cloudwatch alarms.
 * Returns a Promise containing a string with a health report, detailing the number of alarms in each state.
 * @param {string} state - A string containing the state you'd like to query for (e.g. 'ALARM')
 * @param {Auth} auth - An auth object made using the keys and region you'd like to use..
 */

Alarms.prototype.healthReportByState = function(auth){
	var cloudwatch = new AWS.cloudWatch(auth.props);	
	return cloudwatch.describeAlarmsPromised({})
	.then(function(data){
		var alarms = data.MetricAlarms;
		var numOK=0, numInsufficient=0, numAlarm=0;
		console.log(alarms.length);
		for (var k=0; k<alarms.length; k++){
			if (alarms[k].StateValue === 'ALARM'){
				numAlarm++;
			}
			else if (alarms[k].StateValue === 'OK'){
				numOK++;
			}
			else{
				numInsufficient++;
			}
		}
		return Promise.resolve("*Number Of Alarms, By State:* \n"+
			"There are *"+numOK+"* OK alarms, \n"+
			"          *"+numAlarm+ "* alarming alarms, and \n"+
			"          *"+numInsufficient+"* alarms for which there is insufficient data.");
	});
};

/**
 * Queries Cloudwatch alarms that have particular names.
 * Returns a Promise containing a JS object with all of the alarms that have one of the names on the watchlist.
 * @param {Array} watchlist - An array containing the names of alarms you'd like to query for.
 * @param {Auth} auth - An auth object made using the keys and region you'd like to use..
 */
Alarms.prototype.queryAlarmsByWatchlist = function(watchlist, auth){
	var cloudwatch = new AWS.cloudWatch(auth.props);
	return cloudwatch.describeAlarmsPromised({AlarmNames: watchlist});
};

/**
 * Queries Cloudwatch alarms that have particular names.
 * Returns a promise resolving to a string containing information about all matching alarms.
 * @param {Array} watchlist - An array containing the names of alarms you'd like to query for.
 * @param {Auth} auth - An auth object made using the keys and region you'd like to use..
 */
Alarms.prototype.queryAlarmsByWatchlistReadably = function(watchlist, auth){
	return this.queryAlarmsByWatchlist(watchlist, auth)
	.then(function(data){
		var returnMe = '';
		var alarms = data.MetricAlarms ;
		for (var k=0; k<alarms.length; k++){
			returnMe += '*' +alarms[k].Namespace +'*: ' + 
			alarms[k].AlarmDescription + " (" +
			alarms[k].StateValue + ")\n";
		}
		return Promise.resolve(returnMe);
	});
};

/**
 * Queries Cloudwatch alarms that have names that start with the prefix string.
 * Returns a Promise containing a JS object with all of the alarms that have names that begin with the prefix.
 * @param {string} prefix - A prefix string. All alarms with names that begin with the prefix will be returned.
 * @param {Auth} auth - An auth object made using the keys and region you'd like to use..
 */

Alarms.prototype.queryAlarmsByPrefix = function(prefix, auth){
	var cloudwatch = new AWS.cloudWatch(auth.props);
	return cloudwatch.describeAlarmsPromised({AlarmNamePrefix: prefix});
};

/**
 * Queries Cloudwatch alarms that have names that start with the prefix string.
 * Returns a String containing information about all of the alarms that have names that begin with the prefix.
 * @param {string} prefix - A prefix string. All alarms with names that begin with the prefix will be returned.
 * @param {Auth} auth - An auth object made using the keys and region you'd like to use..
 */

Alarms.prototype.queryAlarmsByPrefixReadably = function(prefix, auth){
	return this.queryAlarmsByPrefix(prefix, auth)
	.then(function(data){
		var returnMe = '';
		var alarms = data.MetricAlarms ;
		for (var k=0; k<alarms.length; k++){
			returnMe += '*' +alarms[k].Namespace +'*: ' + 
			alarms[k].AlarmDescription + " (" +
			alarms[k].StateValue + ")\n";
		}
		return Promise.resolve(returnMe);
	});
};

module.exports = Alarms;