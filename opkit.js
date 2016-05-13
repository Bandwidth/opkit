/*
OPKIT v0.0.1 2016-05-12
Illirik Smirnov (ismirnov@bandwidth.com)
Ram Rao (rrao@bandwidth.com)

A framework to help you build devops bots
(but only if you're deployed to AWS and talking in Slack)
*/

//var Botkit = require('botkit');
var AWS = require('aws-promised');
var cloudwatch = new AWS.cloudWatch({apiVersion: '2016-05-12'});
var props = {
	apiVersion : '2016-05-12'
};
function updateAwsConfig(){
	cloudwatch = new AWS.cloudWatch(props);
}

/*
   Function: updateAuthKeys
   Updates the access and secret keys by creating a new cloudwatch object. Updating keys replaces the previous keys for all future queries. 
*/
function updateAuthKeys(accessKeyId, secretAccessKey){
	props.accessKeyId = accessKeyId;
	props.secretAccessKey = secretAccessKey;
	updateAwsConfig();
}
/*
   Function: updateAccessKeyId
   Updates the accessKeyId by creating a new cloudwatch object. Updating keys replaces the previous keys for all future queries. If you are updating both keys, use the function updateAuthKeys instead; it's faster than calling this and updateSecretAccessKey.
*/
function updateAccessKeyId(accessKeyId){
	props.accessKeyId = accessKeyId;
	updateAwsConfig();
}
/*
   Function: updateSecretAccessKey
   Updates the secretAccessKey by creating a new cloudwatch object. Updating keys replaces the previous keys for all future queries. If you are updating both keys, use the function updateAuthKeys instead; it's faster than calling this and updateAccessKeyId.
*/
function updateSecretAccessKey(secretAccessKey){
	props.secretAccessKey = secretAccessKey;
	updateAwsConfig();
}

/*
   Function: updateRegion
   Updates the region (e.g. us-east-1) by creating a new cloudwatch object. Updating the region replaces the previous region for all future queries.
*/
function updateRegion(targetRegion){
	props.region = targetRegion;
	updateAwsConfig();
}

/*
   Function: queryAlarmsByState
   Queries CloudWatch alarms using the auth and region given.
   Is promised.
   Returned promise contains the alarms that match the given state or the Amazon error.
   State can be one of OK, INSUFFICIENT_DATA, or ALARM.
*/

function queryAlarmsByState(state){
	return cloudwatch.describeAlarmsPromised({StateValue: state });
}

/*
   Function: queryAlarmsByStateReadably
   Queries CloudWatch alarms using the auth and region given.
   Is promised.
   Returned promise contains the alarms that match the given state, in a neat human-readable table ready to be printed by your bot (or the Amazon error as a JS object).
   State can be one of OK, INSUFFICIENT_DATA, or ALARM.
*/

function queryAlarmsByStateReadably(state){
	return queryAlarmsByState(state)
	.then(function(data){
		var returnMe = '';
		var alarms = data.MetricAlarms ;
		for (var k=0; k<alarms.length; k++){
			returnMe += alarms[k].Namespace +', ' + 
			alarms[k].MetricName + ': ' + alarms[k].AlarmDescription + "\n";
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
function countAlarmsByState(state){
	return queryAlarmsByState(state)
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
function healthReportByState(){
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
         About: License

    Copyright (c) 2016 bandwidth.com, Inc.

    Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
      */