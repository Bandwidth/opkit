/** @namespace EC2
*/
var AWS = require('aws-promised');

function EC2(){
	
}

/**
 * Starts a specified EC2 instance.
 * @param {string} tag - Name of instance.
 * @param {Auth} auth - The Auth object to be used for the AWS query.
 * @returns a JavaScript object containing data about the instance.
 */
EC2.prototype.start = function(tag, auth) {

	var ec2 = new AWS.ec2(auth.props); 

	return this.getInstanceID(tag, auth)
	.then(function(data) {
		return ec2.startInstancesPromised({InstanceIds: [data]});
	})
	.then(function(data) {
		return data;
	});
};

/**
 * Stops a specified EC2 instance.
 * @param {string} tag - Name of instance.
 * @param {Auth} auth - The Auth object to be used for the AWS query.
 * @returns a JavaScript object containing data about the instance.
 */
EC2.prototype.stop = function(tag, auth) {

	var ec2 = new AWS.ec2(auth.props);

	return this.getInstanceID(tag, auth)
	.then(function(data) {
		return ec2.stopInstancesPromised({InstanceIds: [data]});
	})
	.then(function(data) {
		return data;
	});
};

/**
 * Get the instance ID of an EC2 instance with the specified tag.
 * @param {string} tag - Name of instance.
 * @param {Auth} auth - The Auth object to be used for the AWS query.
 * @returns Instance ID of the specified EC2 instance.
 * NOTE: This function assumes that there are unique names for each instance
 */
EC2.prototype.getInstanceID = function(tag, auth) {

	var ec2 = new AWS.ec2(auth.props);

	return ec2.describeInstancesPromised(
		{
			Filters: [ 	
				{
					Name : 'tag-value',
					Values : [
						tag
					]
				}
			]
		}
	)
	.then(function(data) {
		return data.Reservations[0].Instances[0].InstanceId;
	});
};

module.exports = EC2;