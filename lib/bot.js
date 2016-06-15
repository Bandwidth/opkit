var CLIENT_EVENTS = require('slack-client').CLIENT_EVENTS;
var RTM_EVENTS = require('slack-client').RTM_EVENTS;
var RTM_CLIENT_EVENTS = require('slack-client').CLIENT_EVENTS.RTM;
var RtmClient = require('slack-client').RtmClient;
var MemoryDataStore = require('slack-client').MemoryDataStore;
var Auth = require('./auth');
var winston = require('winston');
var Promise = require('bluebird');
var Natural = require('natural');
var tokenizer = new Natural.WordTokenizer();
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


	// Not particularly performant. It'd be better to have some kind of a tree-based lookup here.
	// However, this is easy to grok and not the slowest thing in the world honestly
	this.messageParser = function(messagesplit, bot){
		// We do this each time in case the bot's commands change.
		var map = {};
		var syntaxes = [];
		var currentSyntax;
		for (var k in bot.commands){
			var command = bot.commands[k];
			for (var s in command.syntax){
				currentSyntax = command.syntax[s];
				if (typeof currentSyntax === 'string'){
					currentSyntax = [currentSyntax]; // let's make sure we're dealing with an array
				}
				map[currentSyntax] = command;
				syntaxes.push(currentSyntax);
				// We map each acceptable syntax to the command it matches.
				// We also add it to the list of syntaxes we need to match.
			}
		}
		// A command with multiple names would cause reduplication of effort here
		syntaxes = _.uniq(syntaxes);
		// Sort by descending number of tokens to match. This way, we avoid matching
		// a syntax for, say, env before env reserve.
		syntaxes.sort(function(a, b){
			return b.length - a.length;
		});
		for (var m=0; m<syntaxes.length; m++){
			currentSyntax = syntaxes[m]; // the current syntax we are parsing
			var matches = false;
			// check each syntax element for a match
			if (currentSyntax.length < messagesplit.length){
				matches = true;
				for (var n=0; n<currentSyntax.length; n++){
					// the 0th element in messagesplit is opkit
					if (currentSyntax[n].toLowerCase() !== messagesplit[n+1].toLowerCase()){
						// if one element doesn't match, we're done here
						matches = false;
					}
				}
			}
			if (matches){
				// we then run the role matching thing on this command
				return Promise.resolve(map[currentSyntax]);
			}
		}
		// if we've gotten through all the syntaxes and none of them match, we failed to find
		return Promise.reject();
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

				//Event handler for messages not handled by a special handler.
				//This is being (excessively) commented for now and we can remove some.

				//First, we tokenize the message. This tokenizer removes punctuation
				//and handles whitespace how you want it
				var message_split = tokenizer.tokenize(message.text);
				//If the message is directed at opkit
				if (message_split[0] &&
					(message_split[0].toLowerCase() === self.name.toLowerCase())){
					if (typeof message_split[1] === 'undefined') {		
 						self.sendMessage("Hello! Message me '" + self.name + " help' to get started!", message.channel);
 						return Promise.resolve();
 					}
					// We need to determine which command, if any, matches the message's text.
					return self.messageParser(message_split, self)
					// If one does, we run the old role matcher.
					.then(function(command){
						var access = false;
						if (command.roles){
							for (var role in command.roles){
								// Synctactic sugar
								var roleToTest = command.roles[role];
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
							return command.command(message, self, auths)
							.then(function(response){
								winston.log('info', response);
								return Promise.resolve();
							})
							.catch(function(err){
								winston.log('warn', err);
								return Promise.resolve();
							});
						} else {
							self.sendMessage("Access denied. " +
							"See administrator if you feel you should have access.", message.channel);
							winston.log('warn', 'User ' + message.user + ' attempted to run command ' + message.command);
							return Promise.resolve();
						}
					})
					.catch(function(){
						console.log('getting here');
						self.sendMessage("That's not a command I've been taught.", message.channel);
						return Promise.resolve();
					});
				}
			}
		});
	};	

	this.rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED);
	this.rtm.on(RTM_EVENTS.MESSAGE, this.onEventsMessage);

}

module.exports = OpkitBot;
