var AWS = require('aws-promised');

function SQS(){
	
}

/*
	Function: getSQSQueueSizeInt
	
	Queries SQS queues using auth and name of queue provided. 
	
	Parameters:
	
		name - Name of SQS queue on AWS.
		auth - The Auth object that contains the authorizations that
		ought to be used.
		
	Returns:
	
		A promise containing the number of messages in the queue 
		(as an integer).
		
	See Also:
	
		<getSQSQueueSizeNotVisibleInt>, <retrieveSQSQueueData>
*/

SQS.prototype.getSQSQueueSizeInt = function(name, auth) {
	var self = this;
	
	var sqs = new AWS.sqs(auth.props);
	return sqs.getQueueUrlPromised({QueueName: name})
	.then(function(data) {
		return self.retrieveSQSQueueData(data.QueueUrl, 'ApproximateNumberOfMessages', auth);
	})
	.then(function(data) {
		return data.Attributes.ApproximateNumberOfMessages;
	});
}

/*
	Function: getSQSQueueSizeNotVisibleInt
	
	Queries SQS queues using auth and url provided. 
	
	Parameters:
	
		url - URL of queue on AWS.
		auth - The Auth object that contains the authorizations that
		ought to be used.
		
	Returns:
	
		A promise containing the number of messages which have been taken off of the queue,
		but have not finished processing (as an integer).
		
	See Also:
	
		<getSQSQueueSizeInt>, <retrieveSQSQueueData>
*/
SQS.prototype.getSQSQueueSizeNotVisibleInt = function(name, auth) {
	var self = this;
	
	var sqs = new AWS.sqs(auth.props);
	return sqs.getQueueUrlPromised({QueueName: name})
	.then(function(data) {
		return self.retrieveSQSQueueData(data.QueueUrl, 'ApproximateNumberOfMessagesNotVisible', auth);
	})
	.then(function (data) {
		return data.Attributes.ApproximateNumberOfMessagesNotVisible;
	});
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
		
	Returns:
	
		A promise containing data about messages on the SQS queue.
		
	See Also:
	
		<sqsQueueParameterFormatter>, <getSQSQueueSizeInt>, <getSQSQueueSizeNotVisibleInt>
*/
SQS.prototype.retrieveSQSQueueData = function(url, param, auth) {
	var sqs = new AWS.sqs(auth.props);
	return sqs.getQueueAttributesPromised(this.sqsQueueParameterFormatter(url, param));
}

/*
	Function: listQueues
	
	Gets a list of SQS URLs with an associated account given a prefix.
	
	Parameters:
	
		queuePrefix - The prefix of the SQS Queues ("" for all queues).
		auth - The Auth object that contains the authorizations that
		ought to be used.
		
	Returns:
	
		A promise containing an array of SQS Queue URLS.
*/
SQS.prototype.listQueues = function(queuePrefix, auth) {
	var sqs = new AWS.sqs(auth.props);
	return sqs.listQueuesPromised({QueueNamePrefix: queuePrefix})
	.then(function(data) {
		return data.QueueUrls;
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