var AWS = require('aws-promised');

function Alarms(){
}

/*
   Function: queryAlarmsByState
   Queries CloudWatch alarms using the auth and region given.
   Is promised.
   Returned promise contains the alarms that match the given state or the Amazon error.
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
   Returned promise contains the alarms that match the given state, in a neat human-readable table ready to be printed by your bot (or the Amazon error as a JS object).
   State can be one of OK, INSUFFICIENT_DATA, or ALARM.
*/

Alarms.prototype.queryAlarmsByStateReadably = function(state, auth){
	return this.queryAlarmsByState(state, auth)
	.then(function(data){
		var returnMe = '';
		var alarms = data.MetricAlarms ;
		for (var k=0; k<alarms.length; k++){
			returnMe += alarms[k].Namespace +', ' + 
			alarms[k].MetricName + ': ' +
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

module.exports = Alarms;