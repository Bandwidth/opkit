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
	
		<getSQSQueueSizeNotVisibleInt>
*/

SQS.prototype.getSQSQueueSizeInt = function(name, auth) {
	var self = this;
	
	var sqs = new AWS.sqs(auth.props);
	return sqs.getQueueUrlPromised({QueueName: name})
	.then(function(data) {
		return sqs.getQueueAttributesPromised({
			QueueUrl: data.QueueUrl,
			AttributeNames: [
				'ApproximateNumberOfMessages',
			]
		});
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
	
		<getSQSQueueSizeInt>
*/
SQS.prototype.getSQSQueueSizeNotVisibleInt = function(name, auth) {
	var self = this;
	
	var sqs = new AWS.sqs(auth.props);
	return sqs.getQueueUrlPromised({QueueName: name})
	.then(function(data) {
		return sqs.getQueueAttributesPromised({
			QueueUrl: data.QueueUrl,
			AttributeNames: [
				'ApproximateNumberOfMessagesNotVisible',
			]
		});
	})
	.then(function (data) {
		return data.Attributes.ApproximateNumberOfMessagesNotVisible;
	});
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

module.exports = SQS;