/*
OPKIT v0.0.1 2016-05-12
Illirik Smirnov (ismirnov@bandwidth.com)
Ram Rao (rrao@bandwidth.com)

A framework to help you build devops bots
(but only if you're deployed to AWS and talking in Slack)
*/

var Botkit = require('botkit');
var AWS = require('aws-sdk');
var cloudwatch = new AWS.CloudWatch({apiVersion: '2016-05-12'});

//Function to update AWS Config and recreate the cloudwatch object
function updateAwsConfig(props){
	AWS.config.update(props);
	cloudwatch = new AWS.CloudWatch({apiVersion: '2016-05-12'});
}

//Functions that allow you to update the authorization keys (both at a time or each at once)
//Each update also recreates the singleton object cloudwatch
function updateAuthKeys(accessKeyId, secretAccessKey){
	updateAwsConfig({
		accessKeyId: accessKeyId,
		secretAccessKey: secretAccessKey
	});
}

function updateAccessKeyId(accessKeyId){
	updateAwsConfig({
		accessKeyId: accessKeyId
	});
}

function updateSecretAccessKey(secretAccessKey){
	updateAwsConfig({
		secretAccessKey: secretAccessKey
	});
}

//Functions that allow you to update the AWS region from which you are querying
function updateRegion(targetRegion){
	updateAwsConfig({
		region: targetRegion
	});
}


/* All query functions take a callback as a parameter.
   That callback returns one of (err, data). The error
   field contains the error as presented by Amazon. */


//Queries CloudWatch alarms using the auth and region given.
//Returns a JSON of the alarms that match the state if request successful.
//Returns the error given by Amazon if the query fails for whatever reason.
//State can be OK, INSUFFICIENT_DATA, or ALARM.
function queryAlarmsByState(state, callback){
	cloudwatch.describeAlarms({StateValue: state }, function (err, data) {
		if (err){
		   console.log(err, err.stack); 
		   callback(err, null);
		} 
		else {
			callback(null, data)
		}
	});
}

//Same as above, but returns a newline-separated string of alarms if successful.
function queryAlarmsByStateReadably(state, callback){
	cloudwatch.describeAlarms({StateValue: state }, function (err, data) {
		if (err){
		   console.log(err, err.stack); 
		   callback(err, null)
		} 
		else {
			var returnMe = '';
			var alarms = data.MetricAlarms ;
			for (k=0; k<alarms.length; k++){
				returnMe = returnMe + alarms[k].Namespace +', ' + 
				alarms[k].MetricName + ': ' + alarms[k].AlarmDescription + "\n";
			}
			callback(null, returnMe);
		}
	});
}

//Queries CloudWatch alarms using the auth and region given.
//Returns the number of the alarms that match the state if request successful.
//Returns the error given by Amazon if the query fails for whatever reason.
//State can be OK, INSUFFICIENT_DATA, or ALARM.
function countAlarmsByState(state, callback){
	cloudwatch.describeAlarms({StateValue: state }, function (err, data) {
		if (err){
		   console.log(err, err.stack); 
		   callback(err, null);
		} 
		else {
			var alarms = data.MetricAlarms;
			callback(null, alarms.length);
		}
	});
}

//Queries CloudWatch alarms using the auth and region given.
//Returns a human-readable health report as a newline-separated string.
//This health report includes information about the number of alarms in each state.

function healthReportByState(callback){
	cloudwatch.describeAlarms({ }, function (err, data) {
		if (err){
		   console.log(err, err.stack); 
		   callback(err, null);
		} 
		else {
			var alarms = data.MetricAlarms;
			var numOK=0, numInsufficient=0, numAlarm=0;
			for (k=0; k<alarms.length; k++){
				if (alarms[k].StateValue.valueOf() == 'ALARM'){
					numAlarm++;
				}
				else if (alarms[k].StateValue.valueOf() == 'OK'){
					numOK++;
				}
				else{
					numInsufficient++;
				}
			}
			callback(null, "Number Of Alarms, By State: \n"+
				"There are "+numOK+" OK alarms, \n"+
				"          "+numAlarm+ " alarming alarms, and \n"+
				"          "+numInsufficient+" alarms for which there is insufficient data.");
		}
	});
}

