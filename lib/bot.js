var CLIENT_EVENTS = require('slack-client').CLIENT_EVENTS;
var RTM_EVENTS = require('slack-client').RTM_EVENTS;
var RTM_CLIENT_EVENTS = require('slack-client').CLIENT_EVENTS.RTM;
var RtmClient = require('slack-client').RtmClient;
var MemoryDataStore = require('slack-client').MemoryDataStore;
var Auth = require('./auth');
var winston = require('winston');
var Promise = require('bluebird');
var _ = require('lodash');
/**
 * Constructor for an Opkit Bot.
 * @param {string} name: the word to 'listen' for. First word of commands
 * @param [Object] cmds: each object should look like          
 * @param [function(message, bot, auth)] cmds.command: Will be called when the command is run.
 * @param [String] names : The keywords that should be listened for.
 * @param [String] roles: An optional list of roles. If present, whenever the command is run, the authorizationFunction is run, and the lists of roles compared.
 *}
 * @param {Object} state: to hold internal variables for the bot. 
 * @param {function} authFunction : function(user) which returns a list of roles to match against commands.
 */

function OpkitBot(name, cmds, state, authFunction) {
	this.name = name;
	this.commands = { };
	// For performance and code readability, we map each name of each command to that command.
	for (var command in cmds){
		for (var cname in cmds[command].names){
			this.commands[cmds[command].names[cname]] = cmds[command];
		}
	}
	// Default behavior is to resolve the promise, but to undefined.
	// This allows any function without a list of roles to run without erroring,
	// but provides 'access denied' if a function with a list of roles is called.
	if (authFunction){
		this.authorizationFunction = authFunction;
	} else {
		this.authorizationFunction = function(user){
			return Promise.resolve([]);
		};
	}
	// Some more housekeeping, carried over from old Opkit.
	this.state = state;
	var self = this;
	this.dataStore = new MemoryDataStore();
	this.rtm = new RtmClient(process.env.token, {dataStore : self.dataStore, logLevel : 'debug'});

	this.start = function(){
		self.rtm.start();
	};
	this.sendMessage = function(reply, channel){
		self.rtm.sendMessage(reply, channel);
	};

	// Main event handler.

	this.onEventsMessage = function(message){
		var message_split = message.text.split(' ');
		if (message_split[0] === self.name){
			// If the name is keyed to something
			if (self.commands.hasOwnProperty(message_split[1])){
				// Query the database/access control list/oracle bones for a list of a user's roles
				return self.authorizationFunction(message.user)
				.then(function(auths){
					// Ensure each role appears at most once.
					auths = _.uniq(auths);
					// This logic is somewhat complicated.
					// We iterate over the list of roles specified for each command, which might contain sublists:
					// [A, [B, C], D]
					var access = false;
					if (self.commands[message_split[1]].roles){
						for (var role in self.commands[message_split[1]].roles){
							// Synctactic sugar
							var roleToTest = self.commands[message_split[1]].roles[role];
							// This could be either a string or an array of strings.
							// If it's just a string, we'll make an array with it as the only element.
							if ((typeof roleToTest) === 'string'){
								roleToTest = [roleToTest];
							}
							// If they fulfill the roles, let them in. 
							if (_.intersection(roleToTest, auths).length === roleToTest.length){
								access = true;
								//maybe put a break here?
							}
						}
					} else {
						access = true;
					}
					if (access){
						return self.commands[message_split[1]].command(message, self, auths)
						.then(function(response){
							winston.log('info', response);
							return Promise.resolve();
						});
					} else {
						return Promise.reject();
					}
				})
				.catch(function(err){
					self.sendMessage("Access denied." +
					"See administrator if you feel you should have access.", message.channel);
					winston.log('warn', err);
					return Promise.reject();
				});
			} else {
				self.sendMessage("That's not a command I've been taught.", message.channel);
				return Promise.reject();
			}
		}
	};	

	this.rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED);
	this.rtm.on(RTM_EVENTS.MESSAGE, this.onEventsMessage);

}

module.exports = OpkitBot;
