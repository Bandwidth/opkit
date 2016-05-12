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

/*
	Function: getSQSQueueSizeData
	
	Queries SQS queues using auth and url provided. If 3 parameters are
	entered instead, the program will develop a URL assuming that the 
	arguments were entered in the order: region endpoint, account number,
	name of queue.
	
	Parameters:
	
		url - URL of queue on AWS.
		
	Returns:
	
		The number of messages in the queue.
		
	See Also:
	
		<getSQSQueueSizeInt>
*/
function getSQSQueueSizeData(url){
	
	if (arguments.length === 3) {
		url = sqsQueueURLBuilder(arguments[0], arguments[1], arguments[2]);
	}
	
	var params = sqsQueueParameterFormatter(url, 'ApproximateNumberOfMessages');
	
		sqs.getQueueAttributes(params, function(err, data) {
			printSQSQueueData(err,data);
	});
}

/*
	Function: getSQSQueueSizeInt
	
	Queries SQS queues using auth and url provided. If 3 parameters are
	entered instead, the program will develop a URL assuming that the 
	arguments were entered in the order: region endpoint, account number,
	name of queue.
	
	Parameters:
	
		url - URL of queue on AWS.
		
	Returns:
	
		The number of messages in the queue (as an integer).
		
	See Also:
	
		<getSQSQueueSizeData>
*/
function getSQSQueueSizeInt(url){
	
	if (arguments.length === 3) {
		url = sqsQueueURLBuilder(arguments[0], arguments[1], arguments[2]);
	}
	
	var params = sqsQueueParameterFormatter(url, 'ApproximateNumberOfMessages');
	
		sqs.getQueueAttributes(params, function(err, data) {
		if (err) {
			console.log(err, err.stack);
		}	  
		else  {
			var messages = data.Attributes.ApproximateNumberOfMessages;
			sqsQueueMessageParser(messages);
		}
	});
}

/*
	Function: getSQSQueueSizeNotVisibleData
	
	Queries SQS queues using auth and url provided. If 3 parameters are
	entered instead, the program will develop a URL assuming that the 
	arguments were entered in the order: region endpoint, account number,
	name of queue.
	
	Parameters:
	
		url - URL of queue on AWS.
		
	Returns:
	
		The number of messages which have been taken off of the queue,
		but have not finished processing.
		
	See Also:
	
		<getSQSQueueSizeNotVisibleInt>
*/
function getSQSQueueSizeNotVisibleData(url) {
	
	if (arguments.length === 3) {
		url = sqsQueueURLBuilder(arguments[0], arguments[1], arguments[2]);
	}

	var params = sqsQueueParameterFormatter(url, 'ApproximateNumberOfMessagesNotVisible');
	
		sqs.getQueueAttributes(params, function(err, data) {
			printSQSQueueData(err,data);
	});
}

/*
	Function: getSQSQueueSizeNotVisibleInt
	
	Queries SQS queues using auth and url provided. If 3 parameters are
	entered instead, the program will develop a URL assuming that the 
	arguments were entered in the order: region endpoint, account number,
	name of queue.
	
	Parameters:
	
		url - URL of queue on AWS.
		
	Returns:
	
		The number of messages which have been taken off of the queue,
		but have not finished processing (as an integer).
		
	See Also:
	
		<getSQSQueueSizeNotVisibleData>
*/
function getSQSQueueSizeNotVisibleInt(url) {
	
	if (arguments.length === 3) {
		url = sqsQueueURLBuilder(arguments[0], arguments[1], arguments[2]);
	}

	var params = sqsQueueParameterFormatter(url, 'ApproximateNumberOfMessagesNotVisible');

		sqs.getQueueAttributes(params, function(err, data) {
		if (err) {
			console.log(err, err.stack);
		}	  
		else  {
			var messages = data.Attributes.ApproximateNumberOfMessagesNotVisible;
			sqsQueueMessageParser(messages);
		}
	});
}

/*
	Function: printSQSQueueData
	
	Prints out data retrieved by querying queue.
	
	Parameters:
	
		err - error field returned by AWS query (null for successful query).
		data - data returned by AWS query (null for unsuccessful query).
		
	Returns:
	
		Data returned by AWS query
*/
function printSQSQueueData(err, data) {
	if (err) {
		console.log(err, err.stack);
	}	  
	else  {
		console.log(data);
	}
} 

/*
	Function: sqsQueueMessageParser
	
	Prints out data retrieved by querying queue as an integer.
	
	Parameters:
	
		str - Data retrieved from SQS query
		
	Returns:
	
		Data returned by AWS query as an integer.
*/
function sqsQueueMessageParser(str) {
	var returnMe = '';
	returnMe += str;
	var integer = parseInt(returnMe);
	console.log(returnMe);
}

/*
	Function: sqsQueueURLBuilder
	
	Returns an AWS queue URL.
	
	Parameters:
	
		str1 - Region endpoint.
		str2 - AWS account number.
		str3 - Name of queue.
		
	Returns:
	
		A valid AWS queue URL using the specified parameters.
*/
function sqsQueueURLBuilder(str1, str2, str3) {
	return 'https://sqs.' + str1 + '.amazonaws.com/' + str2 + '/' + str3;
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
