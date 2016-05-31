/** @namespace EC2
*/
var AWS = require('aws-promised');

function EC2(){
	
}

/**
 * Starts EC2 instances with the specified tag.
 * @param {string} tagName - Name tag (Examples: Name, Environment, etc).
 * @param {string} value - Actual value of tag (Example: opkit-test-johndoe)
 * @param {Auth} auth - The Auth object to be used for the AWS query.
 */
EC2.prototype.start = function(tagName, value, auth) {

	var ec2 = new AWS.ec2(auth.props); 
	var instancesArray;

	return this.getInstanceID(tagName, value, auth)
	.then(function(data) {
		instancesArray = data;
		return ec2.startInstancesPromised({InstanceIds: data});
	})
	.then(function(data) {
		return ec2.waitForPromised('instanceRunning', {InstanceIds: instancesArray});
	})
	.then(function(data) {
		return data;
	});
};

/**
 * Starts EC2 instances with the specified name.
 * @param {string} value - Actual value of tag (Example: opkit-test-johndoe)
 * @param {Auth} auth - The Auth object to be used for the AWS query.
 */
EC2.prototype.startByName = function(value, auth) {
	return this.start("Name", value, auth);
};

/**
 * Stops EC2 instances with the specified tag.
 * @param {string} tagName - Name tag (Examples: Name, Environment, etc).
 * @param {string} value - Actual value of tag (Example: opkit-test-johndoe)
 * @param {Auth} auth - The Auth object to be used for the AWS query.
 */
EC2.prototype.stop = function(tagName, value, auth) {

	var ec2 = new AWS.ec2(auth.props);
	var instancesArray;

	return this.getInstanceID(tagName, value, auth)
	.then(function(data) {
		instancesArray = data;
		return ec2.stopInstancesPromised({InstanceIds: data});
	})
	.then(function(data) {
		return ec2.waitForPromised('instanceStopped', {InstanceIds: instancesArray});
	})
	.then(function(data) {
		return data;
	});
};

/**
 * Stops EC2 instances with the specified name.
 * @param {string} value - Actual value of tag (Example: opkit-test-johndoe)
 * @param {Auth} auth - The Auth object to be used for the AWS query.
 */
EC2.prototype.stopByName = function(value, auth) {
	return this.stop("Name", value, auth);
};

/**
 * Get instance IDs of specified EC2 instances.
 * @param {string} tagName - Name tag (Examples: Name, Environment, etc).
 * @param {string} value - Actual value of tag (Example: opkit-test-johndoe)
 * @returns Array of instance IDs of the specified EC2 instances.
 */
EC2.prototype.getInstanceID = function(tagName, value, auth) {

	var ec2 = new AWS.ec2(auth.props);

	return ec2.describeInstancesPromised(
		{
			Filters: [ 	
				{
					Name : 'tag:' + tagName,
					Values : [
						value
					]
				}
			]
		}
	)
	.then(function(data) {
		var instanceArray = [];

		for (var reservationIndex = 0; reservationIndex < data.Reservations.length; reservationIndex++) {
			for (var instanceIndex = 0; instanceIndex < data.Reservations[reservationIndex].Instances.length; instanceIndex++) {
				instanceArray.push(data.Reservations[reservationIndex].Instances[instanceIndex].InstanceId);
			}
			instanceIndex = 0;
		}
		return instanceArray;
	});
};

module.exports = EC2;