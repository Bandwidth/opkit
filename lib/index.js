var Botkit = require('botkit');
var Alarms = require("./alarms")
var	Auth = require("./auth")
var	SQS = require("./sqs")

function Opkit() {
	this.authList = new Map(); //map of account names to Auth objects
	this.currentAuth = null; //currentAuths
	this.alarms = new Alarms(); 
	this.sqs = new SQS();
	this.configName = ""; //temporary variable for store configuration names
	
	var permissions = new Map(); //map of users to roles
	this.addPermission = function(user, perm) {
		permissions.set(user,perm);
	}
	this.getPermission = function(user) {
		return permissions.get(user);
	}
}

Opkit.prototype.makeBot = function() {
	return Botkit.slackbot({
	debug: true
	});
}

Opkit.prototype.switchConfig = function(newConfig) {
	if (this.configName === newConfig) {
		return "You are already in this configuration."
	}
	else if (this.authList.has(newConfig)) {
		this.currentAuth = this.authList.get(newConfig);
		this.configName = newConfig;
		return "Success. Configuration switched.";
	}
	else {
		return "Sorry, that configuration does not exist.";
	}
}

Opkit.prototype.updateRegion = function(region) {
	this.currentAuth.updateRegion(region);
}

Opkit.prototype.updateAccessKeyId = function(accessKeyID) {
	this.currentAuth.updateAccessKeyId(accessKeyID);
}

Opkit.prototype.updateSecretAccessKey = function(secretAccessKey) {
	this.currentAuth.updateSecretAccessKey(secretAccessKey);
}

Opkit.prototype.makeConfiguration = function(name, auth) {
	this.authList.set(name, auth);
}

Opkit.Alarms = require('./alarms');
Opkit.Auth = require('./auth');
Opkit.SQS = require('./sqs');


module.exports = Opkit;