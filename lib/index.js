var Botkit = require('botkit');
var Alarms = require("./alarms");
var Auth = require("./auth");
var SQS = require("./sqs");

/** 
* Creates a new Opkit object.
* @constructor
*/
function Opkit() {
	this.authList = {}; //map of account names to Auth objects
	this.currentAuth = null; 
	this.alarms = new Alarms(); 
	this.sqs = new SQS();
	this.configName = ""; //current name of configuration
	
	var permissions = {}; //map of users to roles
	this.addPermission = function(user, perm) {
		if (!permissions[user]) {
			permissions[user] = [];
		}
		permissions[user].push(perm);
	}
	this.getPermission = function(user) {
		return permissions[user];
	}
}

/** 
* Returns a new Slackbot object.
* @method
*/
Opkit.prototype.makeBot = function() {
	return Botkit.slackbot({
		debug: true
	});
}

/** 
* Calling this method creates a new configuration and store it in authList. The associated auth object
* can be accessed by name.
* @method
* @param {string} name - name of the configuration.
* @param {Auth} auth - auth object associated with name.
*/
Opkit.prototype.makeConfiguration = function(name, auth) {
	this.authList[name] = auth;
}

/**
* Calling this method returns a list of all configurations associated with the bot.
* @method
* @returns an array of all configurations associated with the bot.
*/
Opkit.prototype.getConfigurations = function() {
	return Object.getOwnPropertyNames(this.authList);
}

/** 
* Calling this method will switch the current configuration to the new one passed in.
* @method
* @param {string} newConfigName - name of the configuration to switch to.
* @returns true if the specified configuration exists, false if it does not.
*/
Opkit.prototype.switchConfig = function(newConfigName) {
	if (this.authList[newConfigName]) {
		this.currentAuth = this.authList[newConfigName];
		this.configName = newConfigName;
		return true;
	}
	else {
		return false;
	}
}

/** 
* Calling this method will update the region of the current auth.
* @method
* @param {string} region - name of the region.
*/
Opkit.prototype.updateRegion = function(region) {
	this.currentAuth.updateRegion(region);
}

/** 
* Calling this method will update the access key of the current auth.
* @method
* @param {string} accessKeyID - access key for AWS account.
*/
Opkit.prototype.updateAccessKeyId = function(accessKeyID) {
	this.currentAuth.updateAccessKeyId(accessKeyID);
}

/** 
* Calling this method will update the secret access key of the current auth.
* @method
* @param {string} secretAccessKey - secret access key for AWS account.
*/
Opkit.prototype.updateSecretAccessKey = function(secretAccessKey) {
	this.currentAuth.updateSecretAccessKey(secretAccessKey);
}

/** 
* Calling this method will update the shortName of the current auth.
* @method
* @param {string} name - new short name of the Auth.
*/
Opkit.prototype.updateShortName = function(name) {
	this.currentAuth.updateShortName(name);
}

/** 
* Calling this method will update the access key and secret access key of the current auth.
* @method
* @param {string} accessKeyID - access key for AWS account.
* @param {string} secretAccessKey - secret access key for AWS account.
*/
Opkit.prototype.updateAuthKeys = function(accessKeyID, secretAccessKey) {
	this.currentAuth.updateAuthKeys(accessKeyID, secretAccessKey);
}

/**
* Calling this method will return the number of messages on the SQS queue of the specified name
* using the current Auth object.
* @method
* @param {string} name - name of SQS queue.
*/
Opkit.prototype.getSQSQueueSizeInt = function(name) {
	return this.sqs.getSQSQueueSizeInt(name, this.currentAuth);
}


Opkit.prototype.getSQSQueueSizeNotVisibleInt = function(name) {
	return this.sqs.getSQSQueueSizeNotVisibleInt(name, this.currentAuth);
}

/** The following code ensures that we can still access the 
Alarms, SQS, and Auth libraries without having to instantiate
Opkit objects */
Opkit.Alarms = require('./alarms');
Opkit.Auth = require('./auth');
Opkit.SQS = require('./sqs');

module.exports = Opkit;