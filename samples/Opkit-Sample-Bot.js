/*
Opkit-Sample-Bot
An AWS Querying bot that uses Opkit.

Deploy info:
set token=YOUR SLACK TOKEN HERE
node THISFILE
*/
"use strict";

var Opkit = require('../index');
var mod = new Opkit();

if (!process.env.token) {
	console.log('Error: Specify token in environment');
	process.exit(1);
}

var controller = mod.makeBot();

controller.spawn({
	token: process.env.token
}).startRTM(function(err) {
	if (err) {
		throw new Error(err);
	}
});

controller.hears(['hello','hi'],['direct_message','direct_mention','mention'],function(bot,message) {
	bot.reply(message,"Hello. Message me initialize to configure me.");
});

controller.hears(['ping'],['direct_message'], function(bot,message) {
	bot.reply(message, 'pong');
});

/*** SETUP CONFIG ***/
controller.hears(['initialize'], ['direct_message','direct_mention','mention'], function(bot,message) {
	bot.startConversation(message, newAuthorization);
});

function newAuthorization(response, convo) {
	convo.say("You are about to setup a new configuration.");
	convo.say("You will be able to switch between your configurations later.");
	convo.say("This configuration will automatically become your current configuration.");
	convo.ask("Please provide a name for your configuration: ", function(response, convo) {
		convo.say("Name of configuration: " + response.text + ".");
		mod.configName = response.text;
		askRegion(response, convo);
		convo.next();
	});
}

function askRegion(response, convo) {
	convo.ask("To what region would you like to connect?", function(response, convo) {
		convo.say("You're querying " + response.text + ".");
		mod.currentAuth = new Opkit.Auth();
		mod.updateRegion(response.text);
		askPublicKey(response, convo);
		convo.next();
	});
}

function askPublicKey(response, convo) {
	convo.ask("What is the Access Key ID?", function(response, convo) {
		convo.say("Got that. The Access Key ID is " + response.text + ".");
		mod.updateAccessKeyId(response.text);
		askPrivateKey(response, convo);
		convo.next();
	});
}

function askPrivateKey(response, convo) { 
	convo.ask("What is the Private Key?", function(response, convo) {
		convo.say("Got that. The Private Key is " + response.text + ".");
		mod.updateSecretAccessKey(response.text);
		mod.makeConfiguration(mod.configName, mod.currentAuth);
		setupPermission(response, convo);
		convo.next();
	});
}

function setupPermission(response, convo) {
	convo.say("You will be given Read-Only permissions.");
	mod.addPermission(response.user, "READONLY");
	convo.next();
}

/***Switch the current configuration***/
controller.hears(['switchConfigurations'],['direct_message','direct_mention','mention'],function(bot,message) {
	bot.startConversation(message, function(response, convo) {
		convo.ask("What configuration would you like to switch to?", function(response, convo) {
			if (mod.switchConfig(response.text)) {
				convo.say("Now in configuration: " + mod.configName + ".");
			}
			else {
				convo.say("Error. No such configuration exists.");
			}
			convo.next();
		});
	});
});

/***Get the user's permission***/
controller.hears(['myPermissions'],['direct_message','direct_mention','mention'],function(bot,message) {
	bot.reply(message,"Your current permission: " + mod.getPermission(message.user).toString() + ".");
});

/***Print the current configuration***/
controller.hears(['printCurrentConfiguration'],['direct_message','direct_mention','mention'],function(bot,message) {
	bot.reply(message,"Current configuration: " + mod.configName + ".");
});

/***Print all configurations***/
controller.hears(['allConfigurations'],['direct_message','direct_mention','mention'],function(bot,message) {
	bot.reply(message,"List of configs: " + mod.getConfigurations().toString() + ".");
});

/***Get data about queue size of a specified SQS queue***/ 
controller.hears(['queuesize'], ['direct_message','direct_mention','mention'], function(bot, message) {
	bot.startConversation(message, askURL);
});

function askURL(response, convo) {
	convo.ask("What is the name of the SQS Queue you would like to retrieve data about?", function(response, convo) {
		convo.say("OK. You want to retrieve queue data from this queue: " + response.text + ".");
		mod.getSQSQueueSizeInt(response.text) 
		.then(function(data) {
			convo.say("Number of messages on queue: " + data + ".");
			convo.next();
		}, function(data) {
			convo.say("There's been an error retrieving your data. Please"
			+ " check your credentials and try again.");
			convo.next();
		});
	});
}