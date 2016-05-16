var AWS = require('aws-promised');

function SQS(){
	
}

/*
	Function: getSQSQueueSizeInt
	
	Queries SQS queues using auth and url provided. 
	
	Parameters:
	
		url - URL of queue on AWS.
		auth - The Auth object that contains the authorizations that
		ought to be used.
		callback - User written callback function to handle data 
		retrieved by AWS SQS queue.
		
	Returns:
	
		The number of messages in the queue (as an integer).
		
	See Also:
	
		<getSQSQueueSizeNotVisibleInt>, <retrieveSQSQueueData>
*/


SQS.prototype.getSQSQueueSizeInt = function(url, auth, callback){
	var sqs = new AWS.sqs(auth.props);
	this.retrieveSQSQueueData(url, 'ApproximateNumberOfMessages', auth, callback);
}

/*
	Function: getSQSQueueSizeNotVisibleInt
	
	Queries SQS queues using auth and url provided. 
	
	Parameters:
	
		url - URL of queue on AWS.
		auth - The Auth object that contains the authorizations that
		ought to be used.
		callback - User written callback function to handle data 
		retrieved by AWS SQS queue.
		
	Returns:
	
		The number of messages which have been taken off of the queue,
		but have not finished processing (as an integer).
		
	See Also:
	
		<getSQSQueueSizeInt>, <retrieveSQSQueueData>
*/
SQS.prototype.getSQSQueueSizeNotVisibleInt = function(url, auth, callback) {
	var sqs = new AWS.sqs(auth.props);
	this.retrieveSQSQueueData(url, 'ApproximateNumberOfMessagesNotVisible', auth, callback);
}

/*
	Function: retrieveSQSQueueData
	
	Gets SQS queue data based on the provided parameters.
	
	Parameters:
	
		url - URL of of queue on AWS.
		str - Specified parameter to specify retrieved data (either
		ApproximateNumberOfMessages or ApproximateNumberOfMessagesNotVisible).
		auth - The Auth object that contains the authorizations that
		ought to be used.
		callback - Callback function.
		
	Returns:
	
		Data about messages on the SQS queue.
		
	See Also:
	
		<sqsQueueParameterFormatter>, <getSQSQueueSizeInt>, <getSQSQueueSizeNotVisibleInt>
*/
SQS.prototype.retrieveSQSQueueData = function(url, param, auth, callback) {
	var sqs = new AWS.sqs(auth.props);
	sqs.getQueueAttributes(this.sqsQueueParameterFormatter(url, param), function(err, data) {
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
	return {
		QueueUrl: url, 
		AttributeNames: [
			attribute,
		]
	};
}
module.exports = SQS;