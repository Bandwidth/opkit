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
	for (var cobject in cmds){
		var current_command = cmds[cobject];
		for (var k in current_command.names){
			this.commands[current_command.names[k]] = current_command;
		}
	}
	// This initializes two arrays we're using to hold event handlers.
	this.handlers = [];
	this.oneoffHandlers = [];
	this.addHandler = function(pattern, logic){
		var newHandler = {
			pattern : pattern,
			logic : logic
		};
		this.handlers.push(newHandler);
		return Promise.resolve();
	};
	this.addOneOffHandler = function(pattern, logic){
		var newHandler = {
			pattern : pattern,
			logic : logic
		};
		this.oneoffHandlers.push(newHandler);
		return Promise.resolve();
	};


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
		return self.authorizationFunction(message.user)
		.then(function(auths){
			// Ensure each role appears at most once.
			auths = _.uniq(auths);
			var handled = false;
			_.forEach(self.handlers, function(currentHandler, index, array){
				if (currentHandler.pattern(message, self, auths)){
					handled = true;
					currentHandler.logic(message, self, auths)
					.then(function(){})
					.catch(function(err){
						winston.log('warn', err);
					});				
				}
			});
			var handlersToRemove = [];
			_.forEach(self.oneoffHandlers, function(currentHandler, index, array){
				if (currentHandler.pattern(message, self, auths)){
					handled = true;
					handlersToRemove.push(currentHandler);
					currentHandler.logic(message, self, auths)
					.then(function(){})
					.catch(function(err){
						winston.log('warn', err);
					});
				}
			});
			_.forEach(handlersToRemove, function(currentHandler, index, array){
				_.pull(self.oneoffHandlers, currentHandler);
			});
			if (handled){
				return Promise.resolve();
			} else {
				var message_split = message.text.split(' ');
				message_split[1] = message_split[1].replace('-', '');
				message_split[1] = message_split[1].replace('_', '');
				message_split[1] = message_split[1].toLowerCase();
				if (message_split[0].toLowerCase() === self.name.toLowerCase()){
					// If the name is keyed to something
					if (self.commands.hasOwnProperty(message_split[1])){
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
							})
							.catch(function(err){
								winston.log('warn', err);
								return Promise.resolve();
							});
						} else {
							return Promise.reject();
						}
					} else {
						self.sendMessage("That's not a command I've been taught.", message.channel);
						return Promise.resolve();
					}
				}
			}
		})
		.catch(function(err){
			self.sendMessage("Access denied." +
			"See administrator if you feel you should have access.", message.channel);
			winston.log('warn', err);
			return Promise.resolve();
		});
	};	

	this.rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED);
	this.rtm.on(RTM_EVENTS.MESSAGE, this.onEventsMessage);

}

module.exports = OpkitBot;
