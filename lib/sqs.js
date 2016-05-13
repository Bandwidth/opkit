var AWS = require('aws-promised');
var Auth = require('./auth.js');
var sqs = new AWS.sqs({apiVersion: '2016-05-12'});

function SQS(){

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
SQS.prototype.getSQSQueueSizeInt = function(url, callback){
	sqs = new AWS.sqs(Auth.props);
	this.retrieveSQSQueueData(url, 'ApproximateNumberOfMessages', callback);
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
SQS.prototype.getSQSQueueSizeNotVisibleInt = function(url, callback) {
	sqs = new AWS.sqs(Auth.props);
	this.retrieveSQSQueueData(url, 'ApproximateNumberOfMessagesNotVisible', callback);
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
SQS.prototype.retrieveSQSQueueData = function(url, param, callback) {
	sqs = new AWS.sqs(Auth.props);
	sqs.getQueueAttributes(sqsQueueParameterFormatter(url, param), function(err, data) {
		if (err) {
			callback(err, null);
		}
		else {
			var messages = data.Attributes[param];
			callback(null, messages);
		}
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
SQS.prototype.sqsQueueParameterFormatter = function(url, attribute) {
	sqs = new AWS.sqs(Auth.props);
	return {
		QueueUrl: url, 
		AttributeNames: [
			attribute,
		]
	};
}
module.exports = SQS;