var Bot = require("./bot");
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

	/** 
 * Calling this method will add the specified permission to the user's list of permissions.
 * @param {string} user - ID of user on slack.
 * @param {string} perm - Permission to be given to user.
 * @returns true if permission is successfully added, false if not.
 */
	this.addPermission = function(user, perm) {
		if (!permissions[user]) {
			permissions[user] = {};
		}
		
		if (permissions[user][perm]) {
			return false;
		}
		else {
			permissions[user][perm] = true;
			return true;
		}
	}; 
	
/** 
 * Calling this method will return the user's permissions.
 * @param {string} user - ID of user on slack.
 * @returns an object containing the user's permissions.
 */	
	this.getPermission = function(user) {
		return permissions[user];
	};

}

/**
 * Constructor for an Opkit Bot.
 * @param {string} name: the word to 'listen' for. First word of commands
 * @param {Object} commands: each key is a word to listen for; each value is a function
 * taking parameters message and bot.
 * @param {Object} state: to hold internal variables for the bot. 
 * @param {string} mode: 'debug' for verbose logging. Other values ignored.
 * 
 */
Opkit.prototype.makeBot = function(name, commands, state) {
	return new Bot(name, commands, state, this);
};



/** 
 * Calling this method creates a new configuration and store it in authList. The associated auth object
 * can be accessed by name.
 * @param {string} name - name of the configuration.
 * @param {Auth} auth - auth object associated with name.
 * @returns true if Auth was successfully created, false if an auth with that name already exists.
 */
Opkit.prototype.createAuth = function(name, auth) {
	if (this.authList[name]) {
		return false;
	}
	else {
		this.authList[name] = auth;
		this.currentAuth = auth;
		return true;
	}
};

/**
 * Calling this method returns a list of all configurations associated with the bot.
 * @returns an array of all configurations associated with the bot.
 */
Opkit.prototype.getAuths = function() {
	return Object.getOwnPropertyNames(this.authList);
};

/** 
 * Calling this method will switch the current configuration to the new one passed in.
 * @param {string} newConfigName - name of the configuration to switch to.
 * @returns true if the specified configuration exists, false if it does not.
 */
Opkit.prototype.chooseAuth = function(newConfigName) {
	if (this.authList[newConfigName]) {
		this.currentAuth = this.authList[newConfigName];
		this.configName = newConfigName;
		return true;
	}
	else {
		return false;
	}
};

/** 
 * Calling this method will update the region of the current auth.
 * @param {string} region - name of the region.
 */
Opkit.prototype.updateRegion = function(region) {
	this.currentAuth.updateRegion(region);
};

/** 
 * Calling this method will update the access key of the current auth.
 * @param {string} accessKeyID - access key for AWS account.
 */
Opkit.prototype.updateAccessKeyId = function(accessKeyID) {
	this.currentAuth.updateAccessKeyId(accessKeyID);
};

/** 
 * Calling this method will update the secret access key of the current auth.
 * @param {string} secretAccessKey - secret access key for AWS account.
 */
Opkit.prototype.updateSecretAccessKey = function(secretAccessKey) {
	this.currentAuth.updateSecretAccessKey(secretAccessKey);
};

/** 
 * Calling this method will update the shortName of the current auth.
 * @param {string} name - new short name of the Auth.
 */
Opkit.prototype.updateShortName = function(name) {
	this.currentAuth.updateShortName(name);
};

/** 
 * Calling this method will update the access key and secret access key of the current auth.
 * @param {string} accessKeyID - access key for AWS account.
 * @param {string} secretAccessKey - secret access key for AWS account.
 */
Opkit.prototype.updateAuthKeys = function(accessKeyID, secretAccessKey) {
	this.currentAuth.updateAuthKeys(accessKeyID, secretAccessKey);
};

/**
 * Calling this method will return the number of messages on the SQS queue of the specified name
 * of the queue using the current Auth object.
 * @param {string} name - name of SQS queue.
 * @returns a promise containing an integer representing number of messages on the SQS queue.
 */
Opkit.prototype.getSQSQueueSizeInt = function(name) {
	return this.sqs.getSQSQueueSizeInt(name, this.currentAuth);
};

/**
 * Calling this method will return the number of messages on the SQS queue that are not visible 
 * of the specified name of the queue using the current Auth object.
 * @param {string} name - name of SQS queue.
 * @returns a promise containing an integer representing number of messages not visible on the SQS queue.
 */
Opkit.prototype.getSQSQueueSizeNotVisibleInt = function(name) {
	return this.sqs.getSQSQueueSizeNotVisibleInt(name, this.currentAuth);
};

/**
 * Calling this method will return a list of queues using the prefix provided and the current
 * Auth object.
 * @param {string} queuePrefix - prefix of SQS queue.
 * @returns a promise containing an array of all SQS queues with the given prefix.
 */
Opkit.prototype.listQueues = function(queuePrefix) {
	return this.sqs.listQueues(queuePrefix, this.currentAuth);
};

/**
 * Queries Cloudwatch alarms that are currently in a particular state.
 * @param {string} state - A string containing the state you'd like to query for (e.g. 'ALARM')
 * @returns a Promise containing a JS object with all of the alarms currently in that state.
 */
Opkit.prototype.queryAlarmsByState = function(state) {
	return this.alarms.queryAlarmsByState(state, this.currentAuth);
};

/**
 * Queries Cloudwatch alarms that are currently in a particular state.
 * @param {string} state - A string containing the state you'd like to query for (e.g. 'ALARM')
 * @returns a string containing information about the namespace, name, and description of each alarm in the queried state.
 */
Opkit.prototype.queryAlarmsByStateReadably = function(state) {
	return this.alarms.queryAlarmsByStateReadably(state, this.currentAuth);
};

/**
 * Queries Cloudwatch alarms that are currently in a particular state.
 * @param {string} state - A string containing the state you'd like to query for (e.g. 'ALARM')
 * @returns a Promise containing the number of alarms in the state.
 */
Opkit.prototype.countAlarmsByState = function(state) {
	return this.alarms.countAlarmsByState(state, this.currentAuth);
};

/**
 * Queries Cloudwatch alarms.
 * @param {string} state - A string containing the state you'd like to query for (e.g. 'ALARM')
 * @returns a Promise containing a string with a health report, detailing the number of alarms in each state.
 */
Opkit.prototype.healthReportByState = function() {
	return this.alarms.healthReportByState(this.currentAuth);
};

/**
 * Queries Cloudwatch alarms that have particular names.
 * @param {Array} watchlist - An array containing the names of alarms you'd like to query for.
 * @returns a Promise containing a JS object with all of the alarms that have one of the names on the watchlist.
 */
Opkit.prototype.queryAlarmsByWatchlist = function(watchlist) {
	return this.alarms.queryAlarmsByWatchlist(watchlist, this.currentAuth);
};

/**
 * Queries Cloudwatch alarms that have particular names.
 * @param {Array} watchlist - An array containing the names of alarms you'd like to query for.
 * @returns a String containing information about all matching alarms.
 */
Opkit.prototype.queryAlarmsByWatchlistReadably = function(watchlist) {
	return this.alarms.queryAlarmsByWatchlistReadably(watchlist, this.currentAuth);
};

/**
 * Queries Cloudwatch alarms that have names that start with the prefix string.
 * @param {string} prefix - A prefix string. All alarms with names that begin with the prefix will be returned.
 * @returns a Promise containing a JS object with all of the alarms that have names that begin with the prefix.
 */
Opkit.prototype.queryAlarmsByPrefix = function(prefix) {
	return this.alarms.queryAlarmsByPrefix(prefix, this.currentAuth);
};

/**
 * Queries Cloudwatch alarms that have names that start with the prefix string.
 * @param {string} prefix - A prefix string. All alarms with names that begin with the prefix will be returned.
 * @returns a String containing information about all of the alarms that have names that begin with the prefix.
 */
Opkit.prototype.queryAlarmsByPrefixReadably = function(prefix) {
	return this.alarms.queryAlarmsByPrefixReadably(prefix, this.currentAuth);
};

/** The following code ensures that we can still access the 
Alarms, SQS, and Auth libraries without having to instantiate
Opkit objects */
Opkit.Alarms = require('./alarms');
Opkit.Auth = require('./auth');
Opkit.SQS = require('./sqs');
Opkit.Bot = require('./bot');
Opkit.EC2 = require('./ec2');

module.exports = Opkit;