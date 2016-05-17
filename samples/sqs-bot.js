/*
Alarms-Bot
An AWS SQS querying bot that uses Opkit.

Deploy info:
set token=YOUR SLACK TOKEN HERE
node THISFILE
*/

//initialize some stuff

var Opkit = require('../index');
var Botkit = require('botkit');
var auth = new Opkit.Auth();
var SQS = new Opkit.SQS();
// make sure we have a Slack token

if (!process.env.token) {
	console.log('Error: Specify token in environment');
	process.exit(1);
}

var controller = Botkit.slackbot({
// set this to false if you don't want a console full of text
	debug: true
});

// start up our new bot

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

controller.hears(['initialize'], ['direct_message'], function(bot,message) {
	bot.startConversation(message, askRegion);
});

askRegion = function(response, convo) {
	convo.ask("To what region would you like to connect?", function(response, convo) {
		convo.say("You're querying " + response.text + ".");
		auth.updateRegion(response.text)
		askPublicKey(response, convo);
		convo.next();
	});
}
askPublicKey = function(response, convo) {
	convo.ask("What is the Access Key ID?", function(response, convo) {
		convo.say("Got that. The Access Key ID is " + response.text + ".");
		auth.updateAccessKeyId(response.text)
		askPrivateKey(response, convo);
		convo.next();
	});
}
askPrivateKey = function(response, convo) { 
	convo.ask("What is the Private Key?", function(response, convo) {
		convo.say("Got that. The Private Key is " + response.text + ".");
		auth.updateSecretAccessKey(response.text)
		convo.next();
	});
}

controller.hears(['queuesize'], ['direct_message'], function(bot, message) {
	bot.startConversation(message, askURL);
});

askURL = function(response, convo) {
	convo.ask("What is the URL of the SQS Queue you would like to retrieve data about?", function(response, convo) {
		convo.say("OK. You want to retrieve queue data from this url: " + response.text + ".");
		SQS.getSQSQueueSizeInt(response.text.substring(1, response.text.length - 1), auth) 
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

controller.hears(['queuesizenotvisible'], ['direct_message'], function(bot, message) {
	bot.startConversation(message, askURLNotVisible);
});

askURLNotVisible = function(response, convo) {
	convo.ask("What is the URL of the SQS Queue you would like to retrieve data about?", function(response, convo) {
		convo.say("OK. You want to retrieve queue data from this url: " + response.text + ".");
		SQS.getSQSQueueSizeIntNotVisible(response.text.substring(1, response.text.length - 1), auth) 
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

controller.hears(['help'], ['direct_message'], function(bot, message) {
	bot.startConversation(message,function(err,convo) {
		convo.say('SQSBot Help');
		convo.say('Commands:');
		convo.say('intialize: setup AWS credentials config');
		convo.say('queuesize: retrieves number of messages on specified queue');
		convo.say('queuesizenotvisible: retrieves number of messages not visible on specified queue');
		convo.next();
	});
});