/*
OPKIT v0.0.1 2016-05-12
Illirik Smirnov (ismirnov@bandwidth.com)
Ram Rao (rrao@bandwidth.com)

A framework to help you build devops bots
(but only if you're deployed to AWS and talking in Slack)
*/

var Botkit = require('botkit');
var AWS = require('aws-sdk');
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

//Functions that allow you to update the authorization keys (both at a time or each at once)
function updateAuthKeys(accessKeyId, secretAccessKey){
    AWS.config.update({
        accessKeyId: accessKeyId, 
        secretAccessKey: secretAccessKey
    });
}

function updateAccessKeyId(accessKeyId){
    AWS.config.update({
        accessKeyId: accessKeyId
    });
}

function updateSecretAccessKey(secretAccessKey){
    AWS.config.update({
        secretAccessKey: secretAccessKey
    });
}

//Functions that allow you to update the AWS region from which you are querying
function updateRegion(targetRegion){
    AWS.config.update({
        region: targetRegion
    });
}

//Queries SQS queues using auth and url provided.
//Returns the number of messages in the queue if request is successful.
//Returns the error given by Amazon if the query fails for whatever reason.
function getSQSQueueSizeData(url){

	var params = {
		QueueUrl: url, 
		AttributeNames: [
			'ApproximateNumberOfMessages',
		]
	};
	
	sqs.getQueueAttributes(params, function(err, data) {
	if (err) {
		console.log(err, err.stack);
	}	  
	else  {
			console.log(data);
	}
	});
}

//Same as above, but returns an integer value rather than data.
function getSQSQueueSizeInt(url){

	var params = {
		QueueUrl: url, 
		AttributeNames: [
			'ApproximateNumberOfMessages',
		]
	};
	
	sqs.getQueueAttributes(params, function(err, data) {
	if (err) {
		console.log(err, err.stack);
	}	  
	else  {
			console.log(data);
	}
	});
}

//Queries SQS queues using auth and url provided.
//Returns the number of messages not visible (i.e messages taken off the queue that have not 
//finished processing) in the queue if request is successful.
//Returns the error given by Amazon if the query fails for whatever reason.
function getSQSQueueSizeNotVisibleData(url) {

	var params = {
	QueueUrl: url, 
	AttributeNames: [
		'ApproximateNumberOfMessagesNotVisible',
	]
	};
	
	sqs.getQueueAttributes(params, function(err, data) {
	if (err) {
		console.log(err, err.stack);
	}	  
	else  {
		console.log(data);
	}
	});
}

//Same as above, but returns an integer value rather than data.
function getSQSQueueSizeNotVisibleInt(url) {

	var params = {
	QueueUrl: url,
	AttributeNames: [
		'ApproximateNumberOfMessagesNotVisible',
	]
};

	sqs.getQueueAttributes(params, function(err, data) {
	if (err) {
		console.log(err, err.stack);
	}	  
	else  {
		var returnMe = '';
		var messages = data.Attributes.ApproximateNumberOfMessagesNotVisible;
		returnMe += messages;
		var integer = parseInt(returnMe);
		console.log(returnMe);
	}
	});
}
