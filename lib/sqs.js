/** @namespace SQS
*/
"use strict"
var AWS = require('aws-promised');

function SQS(){
	
};

/**
 * Queries SQS queues. Returns a promise containing number of messages in queue.
 * @param {string} name - Name of SQS queue on AWS.
 * @param {Auth} auth - The Auth object to be used for the AWS query.
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
};

/**
 * Queries SQS queues. Returns a promise containing number of messages which have been taken off of the queue,
		but have not finished processing.
 * @param {string} name - Name of SQS queue on AWS.
 * @param {Auth} auth - The Auth object to be used for the AWS query.
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
};

/**
 * Returns a promise containing a list of SQS URLs with an associated account given a prefix.
 * @param {string} queuePrefix - The prefix of the SQS Queues desired. "" for all queues.
 * @param {Auth} auth = The Auth object to be used for the AWS query.
 */

SQS.prototype.listQueues = function(queuePrefix, auth) {
	var sqs = new AWS.sqs(auth.props);
	return sqs.listQueuesPromised({QueueNamePrefix: queuePrefix})
	.then(function(data) {
		return data.QueueUrls;
	});
};

module.exports = SQS;