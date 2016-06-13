/** @namespace EC2
*/
var AWS = require('aws-promised');
var _ = require('lodash');
var Promise = require('bluebird');

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
 * @param {Auth} auth - The Auth object to be used for the AWS query.
 * @returns Promise resolving to an array of instance IDs of the specified EC2 instances.
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

		var reservations = data.Reservations;
		for (var reservation in reservations) {
			var instances = reservations[reservation].Instances;
			for (var instance in instances) {
				instanceArray.push(instances[instance].InstanceId);
			}
		}
		return Promise.resolve(instanceArray);
	});
};

/**
 * Get info about specified EC2 instances.
 * @param {string} tagName - Name tag (Examples: Name, Environment, etc).
 * @param {string} value - Actual value of tag (Example: opkit-test-johndoe)
 * @param {Auth} auth - The Auth object to be used for the AWS query.
 * @returns Promise resolving to an array containing info about the specified EC2 instances.
 */
EC2.prototype.listInstances = function(tagName, value, auth) {

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
		return dataFormatter(data);
	});
};

/**
 * Get info about specified EC2 instances which are stopped.
 * @param {string} tagName - Name tag (Examples: Name, Environment, etc).
 * @param {string} value - Actual value of tag (Example: opkit-test-johndoe)
 * @param {Auth} auth - The Auth object to be used for the AWS query.
 * @returns Promise resolving to an array containing info about the specified EC2 instances.
 */
EC2.prototype.getInstancesStopped = function(tagName, value, auth) {
	return this.getInstancesStatus(tagName, value, 'stopped', auth);
};

/**
 * Get info about specified EC2 instances which are running.
 * @param {string} tagName - Name tag (Examples: Name, Environment, etc).
 * @param {string} value - Actual value of tag (Example: opkit-test-johndoe)
 * @param {Auth} auth - The Auth object to be used for the AWS query.
 * @returns Promise resolving to an array containing info about the specified EC2 instances.
 */
EC2.prototype.getInstancesStarted = function(tagName, value, auth) {
	return this.getInstancesStatus(tagName, value, 'running', auth);
};

/**
 * Get info about specified EC2 instances in a specified state.
 * @param {string} tagName - Name tag (Examples: Name, Environment, etc).
 * @param {string} value - Actual value of tag (Example: opkit-test-johndoe)
 * @param {state} - State of instances (running, stopped, etc.)
 * @param {Auth} auth - The Auth object to be used for the AWS query.
 * @returns Promise resolving to an array containing info about the specified EC2 instances.
 */
EC2.prototype.getInstancesStatus = function(tagName, value, state, auth) {

	var ec2 = new AWS.ec2(auth.props);

	return ec2.describeInstancesPromised(
		{
			Filters: [ 	
				{
					Name : 'tag:' + tagName,
					Values : [
						value
					]
				},
				{
					Name : 'instance-state-name',
					Values : [
						state
					]
				}
			]
		}
	)
	.then(function(data) {
		return dataFormatter(data);
	});
};

/**
 * Helper function to format data returned by AWS EC2 queries.
 */
function dataFormatter(data) {
	var instanceInfoArray = [];
	var instanceInfoObject = {};

	var reservations = data.Reservations;
	for (var reservation in reservations) {
		var instances = reservations[reservation].Instances;
		for (var instance in instances) {
			var tags = instances[instance].Tags;
			for (var tag in tags) {
				if (tags[tag].Key === 'Name') {
					instanceInfoObject = _.assign(instanceInfoObject,
					{Name: tags[tag].Value});
				}
			}
			instanceInfoObject = _.assign(instanceInfoObject,
				{State: instances[instance].State.Name},
				{id: instances[instance].InstanceId});
			instanceInfoArray.push(instanceInfoObject);
			instanceInfoObject = {};
		}
	}
	return Promise.resolve(instanceInfoArray);
}

module.exports = EC2;