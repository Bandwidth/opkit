var AWS = require('aws-promised');

function Alarms(){
}

/*
	Function: queryAlarmsByState
	Queries Cloudwatch alarms using the auth object given.
	Is promised.
	Returned promise contains the alarms that match the given state
	or the Amazon error.
	State can be one of OK, INSUFFICIENT_DATA, or ALARM.
*/
Alarms.prototype.queryAlarmsByState = function(state, auth){
	var cloudwatch = new AWS.cloudWatch(auth.props);
	return cloudwatch.describeAlarmsPromised({StateValue: state });
}

/*
	Function: queryAlarmsByStateReadably
	Queries CloudWatch alarms using the auth and region given.
	Is promised.
	Returned promise contains the alarms that match the given state,
	in a neat human-readable table ready to be printed by your bot 
	(or the Amazon error as a JS object).
	State can be one of OK, INSUFFICIENT_DATA, or ALARM.
*/

Alarms.prototype.queryAlarmsByStateReadably = function(state, auth){
	return this.queryAlarmsByState(state, auth)
	.then(function(data){
		var returnMe = '';
		var alarms = data.MetricAlarms ;
		for (var k=0; k<alarms.length; k++){
			returnMe += alarms[k].Namespace +', ' + 
			(alarms[k].AlarmName ? alarms[k].AlarmName : alarms[k].MetricName) + ': ' +
			alarms[k].AlarmDescription + "\n";
		}
		return returnMe;
	});
}

/*
	Function: countAlarmsByState
	Queries CloudWatch alarms using the auth and region given.
	Is promised.
	Returned promise contains the number of alarms that match the given state (or the Amazon error as a JS object).
	State can be one of OK, INSUFFICIENT_DATA, or ALARM.
*/

Alarms.prototype.countAlarmsByState = function(state, auth){
	return this.queryAlarmsByState(state, auth)
	.then(function(data){
		var alarms = data.MetricAlarms;
		return alarms.length;
	});
}

/*
	Function: healthReportByState
	Queries CloudWatch alarms using the auth and region given.
	Is promised.
	Returned promise contains the count of alarms in each state, in a neat human-readable table ready to be printed by your bot (or the Amazon error as a JS object).
	State can be one of OK, INSUFFICIENT_DATA, or ALARM.
*/

Alarms.prototype.healthReportByState = function(auth){
	var cloudwatch = new AWS.cloudWatch(auth.props);	
	return cloudwatch.describeAlarmsPromised({})
	.then(function(data){
		var alarms = data.MetricAlarms;
		var numOK=0, numInsufficient=0, numAlarm=0;
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
		return "Number Of Alarms, By State: \n"+
			"There are "+numOK+" OK alarms, \n"+
			"          "+numAlarm+ " alarming alarms, and \n"+
			"          "+numInsufficient+" alarms for which there is insufficient data.";
	});
}

/*
	Function: queryAlarmsByWatchlist
	Queries Cloudwatch alarms using the auth object given.
	Is promised.
	watchlist: An array of Strings containing names of alarms.
	All alarms on that list, accessible using that auth, will 
	be returned in the Promise. (or the Amazon error as a JS object)
*/ 
Alarms.prototype.queryAlarmsByWatchlist = function(watchlist, auth){
	var cloudwatch = new AWS.cloudWatch(auth.props);
	return cloudwatch.describeAlarmsPromised({AlarmNames: watchlist});
}

/*
	Function: queryAlarmsByWatchlistReadably
	Queries Cloudwatch alarms using the auth object given.
	Is promised.
	watchlist: An array of Strings containing names of alarms.
	All alarms on that list, accessible using that auth, will 
	be returned in the Promise, formatted as a string suitable
	to be said by the bot. (or the Amazon error as a JS object).
*/ 
Alarms.prototype.queryAlarmsByWatchlistReadably = function(watchlist, auth){
	return this.queryAlarmsByWatchlist(watchlist, auth)
	.then(function(data){
		var returnMe = '';
		var alarms = data.MetricAlarms ;
		for (var k=0; k<alarms.length; k++){
			returnMe += alarms[k].Namespace +', ' + 
			alarms[k].AlarmName + ': ' +
			alarms[k].AlarmDescription + " (" +
			alarms[k].StateValue + ")\n";
		}
		return returnMe;
	});
}

/*
	Function: queryAlarmsByPrefix
	Queries Cloudwatch alarms using the auth object given.
	Is promised.
	prefix: A prefix string.
	All alarms that are accessible using that auth and have names that
	begin with the prefix will be returned in the promise.
	(or the Amazon error as a JS object)
*/ 

Alarms.prototype.queryAlarmsByPrefix = function(prefix, auth){
	var cloudwatch = new AWS.cloudWatch(auth.props);
	return cloudwatch.describeAlarmsPromised({AlarmNamePrefix: prefix});
}

/*
	Function: queryAlarmsByPrefixReadably
	Queries Cloudwatch alarms using the auth object given.
	Is promised.
	prefix: A prefix string.
	All alarms that are accessible using that auth and have names that
	begin with the prefix will be returned in the promise, formatted as a 
	string suitable to be said by the bot. 
	(or the Amazon error as a JS object)
*/ 

Alarms.prototype.queryAlarmsByPrefixReadably = function(prefix, auth){
	return this.queryAlarmsByPrefix(prefix, auth)
	.then(function(data){
		var returnMe = '';
		var alarms = data.MetricAlarms ;
		for (var k=0; k<alarms.length; k++){
			returnMe += alarms[k].Namespace +', ' + 
			alarms[k].AlarmName + ': ' +
			alarms[k].AlarmDescription + " (" +
			alarms[k].StateValue + ")\n";
		}
		return returnMe;
	});
}

module.exports = Alarms;