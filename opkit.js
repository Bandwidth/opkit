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
	
		<getSQSQueueSizeInt>, <retrieveSQSQueueData>
*/
function getSQSQueueSizeData(url){
	retrieveSQSQueueData(arguments, 'ApproximateNumberOfMessages', false);
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
	
		<getSQSQueueSizeData>, <retrieveSQSQueueData>
*/
function getSQSQueueSizeInt(url){
	retrieveSQSQueueData(arguments, 'ApproximateNumberOfMessages', true);
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
	
		<getSQSQueueSizeNotVisibleInt>, <retrieveSQSQueueData>
*/
function getSQSQueueSizeNotVisibleData(url) {
	retrieveSQSQueueData(arguments, 'ApproximateNumberOfMessagesNotVisible', false);
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
	
		<getSQSQueueSizeNotVisibleData>, <retrieveSQSQueueData>
*/
function getSQSQueueSizeNotVisibleInt(url) {
	retrieveSQSQueueData(arguments, 'ApproximateNumberOfMessagesNotVisible', true);
}

/*
	Function: retrieveSQSQueueData
	
	Gets SQS queue data based on the provided parameters.
	
	Parameters:
	
		args - Arguments passed into the method (url).
		str - Specified attribute to fetch data for (either 
		ApproximateNumberOfMessages or ApproximateNumberOfMessagesNotVisible)
		bool - Denotes whehter the data should be returned as a 
		string or integer (true for integer, false for string)
		
	Returns:
	
		Data about messages on the SQS queue.
		
	See Also:
	
		<sqsQueueURLBuilder>, <sqsQueueParameterFormatter>, <printSQSQueueData>
*/
function retrieveSQSQueueData(args, str, bool) {
	url = sqsQueueURLBuilder(args);
	var params = sqsQueueParameterFormatter(url, str);
	sqs.getQueueAttributes(params, function(err, data) {
			printSQSQueueData(err,data,bool,params.AttributeNames[0]);
	});
}

/*
	Function: printSQSQueueData
	
	Prints out data retrieved by querying queue.
	
	Parameters:
	
		err - Error field returned by AWS query (null for successful query).
		data - Data returned by AWS query (null for unsuccessful query).
		bool - Boolean indicator of whether to return as an int (true = return as int).
		attribute - Specified attribute to return (either ApproximateNumberOfMessages or ApproximateNumberOfMessagesNotVisible)
		
	Returns:
	
		Data returned by AWS query
*/
function printSQSQueueData(err, data, bool, attribute) {
	if (err) {
		console.log(err, err.stack);
	}	  
	else  {
		if (bool)
		{
			if (attribute === 'ApproximateNumberOfMessages') {
				var messages = data.Attributes.ApproximateNumberOfMessages;
			}
			else {
				var messages = data.Attributes.ApproximateNumberOfMessagesNotVisible;
			}
			var returnMe = '';
			returnMe += messages;
			var integer = parseInt(returnMe);
			console.log(integer);
		}
		else {
			console.log(data);
		}
	}
}  

/*
	Function: sqsQueueURLBuilder
	
	Returns an AWS queue URL.
	
	Parameters:
	
		args - Arguments passed into any given SQS queue query listed above.
		
	Returns:
	
		A valid AWS queue URL using the specified parameters.
*/
function sqsQueueURLBuilder(args)
{
	if (args.length === 3) {
		return 'https://sqs.' + args[0] + '.amazonaws.com/' + args[1] + '/' + args[2];
	}
	else {
		return args[0];
	}
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
