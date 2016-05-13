/*
OPKIT v0.0.1 2016-05-12
Illirik Smirnov (ismirnov@bandwidth.com)
Ram Rao (rrao@bandwidth.com)

A framework to help you build devops bots
(but only if you're deployed to AWS and talking in Slack)
*/

//Must include module.exports 

//var Botkit = require('botkit');
var AWS = require('aws-promised');
var cloudwatch = new AWS.cloudWatch({apiVersion: '2016-05-12'});
var sqs = new AWS.sqs({apiVersion: '2012-11-05'});
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
    AWS.config.update({
        region: targetRegion
    });
}

/*
	Function: getSQSQueueSizeInt
	
	Queries SQS queues using auth and url provided. 
	
	Parameters:
	
		url - URL of queue on AWS.
		callback - User written callback function to handle data 
		retrieved by AWS SQS queue.
		
	Returns:
	
		The number of messages in the queue (as an integer).
		
	See Also:
	
		<getSQSQueueSizeNotVisibleInt>, <retrieveSQSQueueData>
*/
function getSQSQueueSizeInt(url, callback){
	retrieveSQSQueueData(url, 'ApproximateNumberOfMessages', callback);
}

/*
	Function: getSQSQueueSizeNotVisibleInt
	
	Queries SQS queues using auth and url provided. 
	
	Parameters:
	
		url - URL of queue on AWS.
		callback - User written callback function to handle data 
		retrieved by AWS SQS queue.
		
	Returns:
	
		The number of messages which have been taken off of the queue,
		but have not finished processing (as an integer).
		
	See Also:
	
		<getSQSQueueSizeInt>, <retrieveSQSQueueData>
*/
function getSQSQueueSizeNotVisibleInt(url, callback) {
	retrieveSQSQueueData(url, 'ApproximateNumberOfMessagesNotVisible', callback);
}

/*
	Function: retrieveSQSQueueData
	
	Gets SQS queue data based on the provided parameters.
	
	Parameters:
	
		url - URL of of queue on AWS.
		str - Specified parameter to specify retrieved data (either
		ApproximateNumberOfMessages or ApproximateNumberOfMessagesNotVisible).
		callback - Callback function.
		
	Returns:
	
		Data about messages on the SQS queue.
		
	See Also:
	
		<sqsQueueParameterFormatter>, <getSQSQueueSizeInt>, <getSQSQueueSizeNotVisibleInt>
*/
function retrieveSQSQueueData(url, param, callback) {
	sqs.getQueueAttributes(sqsQueueParameterFormatter(url, param), function(err, data) {
		if (err) {
			callback(err, null);
		}
		else {
			var messages = data.Attributes[param];
			callback(null, messages);
		}
	props.region = targetRegion;
	updateAwsConfig();
	});
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
	Function: sqsQueueParameterFormatter
	
	Returns a valid parameter object to be used to 
	retrieve queue attributes.
	
	Parameters:
	
		url - URL of SQS queue.
		attribute - Specified attribute to retrieve.
		
	Returns:
	
		An object containing a QueueURL field and an attribute field.
*/
function sqsQueueParameterFormatter(url, attribute) {
	return {
		QueueUrl: url, 
		AttributeNames: [
			attribute,
		]
	};
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
