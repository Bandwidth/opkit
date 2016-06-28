var CLIENT_EVENTS = require('slack-client').CLIENT_EVENTS;
var RTM_EVENTS = require('slack-client').RTM_EVENTS;
var RTM_CLIENT_EVENTS = require('slack-client').CLIENT_EVENTS.RTM;
var RtmClient = require('slack-client').RtmClient;
var MemoryDataStore = require('slack-client').MemoryDataStore;
var Auth = require('./auth');
var winston = require('winston');
var Promise = require('bluebird');
var Natural = require('natural');
var tokenizer = new Natural.RegexpTokenizer({pattern : /\s/});
var _ = require('lodash');
/**
 * Constructor for an Opkit Bot.
 * @param {string} name: the word to 'listen' for. First word of commands
 * @param [Object] cmds: each object should look like          
 * @param [function(message, bot, auth)] cmds.command: Will be called when the command is run.
 * @param [String] names : The keywords that should be listened for.
 * @param [String] roles: An optional list of roles to control access for.
 *}
 * @param {function} authFunction : function(user) which returns a list of roles to match against commands.
 * @param {object} persister : object that has a .save and .recover method
 */

 /*
 	Persister:
 	- Should expose a .save that is function(brain, script)
 	- script is a string that uniquely names the 'portion' of the brain we are persisting
 	- Brain is a JS object that is 'stringifiable'; that is, serializable (no functions,
 		undefined values, or non-enumberable properties)


 	- Should expose a .recover that is function(script)
 	- Returns a promise that resolves to the JS object
 	*/


function OpkitBot(name, cmds, persister, authFunction) {
	var self = this;
	this.name = name;
	this.commands = { };	
	this.persister = persister;
	// Map each name of each command to that command.
	_.forEach(cmds, function(command){
		self.commands[command.name] = command;
	});
	// This initializes two arrays we're using to hold event handlers.
	this.handlers = [];
	this.oneoffHandlers = [];

	this.dataStore = new MemoryDataStore();
	this.rtm = new RtmClient(process.env.token, {dataStore : self.dataStore, logLevel : 'debug'});

/**
 * Adds a custom event handler.
 * @param {function} pattern: Returns 'true' when the handler ought to run.
 * @param {function} logic: What the handler ought to do.
 * @param {Number} life: Number of seconds before the handler times out. (Optional)
 * @param {function} onTimeout : Function to run on timeout. (Optional)
 */

	this.addHandler = function(pattern, logic, life, onTimeout){
		var newHandler = {
			pattern : pattern,
			logic : logic
		};
		this.handlers.push(newHandler);
		if (life){
			var handlers = this.handlers;
			setTimeout(function(){
				if (_.includes(handlers, newHandler)){
					_.pull(handlers, newHandler);
					if (onTimeout){
						onTimeout();
					}
				}
			}, life*1000);
		}
		return newHandler;
	};
/**
 * Adds a custom event handler. Handler removes itself when it runs.
 * @param {function} pattern: Returns 'true' when the handler ought to run.
 * @param {function} logic: What the handler ought to do.
 * @param {Number} life: Number of seconds before the handler times out. (Optional)
 * @param {function} onTimeout : Function to run on timeout. (Optional)
 */
	this.addOneOffHandler = function(pattern, logic, life, onTimeout){
		var newHandler = {
			pattern : pattern,
			logic : logic
		};
		this.oneoffHandlers.push(newHandler);
		if (life){
			var handlers = this.oneoffHandlers;
			setTimeout(function(){
				if (_.includes(handlers, newHandler)){
					_.pull(handlers, newHandler);
					if (onTimeout){
						onTimeout();
					}
				}
			}, life*1000);
		}
		return newHandler;
	};

	// Initialize the brain
	this.brain = {};
	_.forEach(this.commands, function(command){
		self.brain[command.script] = self.brain[command.script] || { };
	});
	// Sugar for persister's recover
	this.recover = function(script){
		return this.persister.recover(script);
	};

	// Default behavior is to resolve the promise, but to undefined.
	// This allows any function without a list of roles to run without erroring,
	// but provides 'access denied' if a function with a list of roles is called.
	this.authorizationFunction = authFunction || function(user){
		return Promise.resolve([]);
	};
/**
 * Starts the bot and persister.
 */
	// More sugar
	this.start = function(){
		return this.persister.start()
		.then(function() {
			self.rtm.start();
			return Promise.resolve(true);
		});
	};

	this.sendMessage = function(reply, channel){
		self.rtm.sendMessage(reply, channel);
	};


	// Not particularly performant. It'd be better to have some kind of a tree-based lookup here.
	// However, this is easy to grok and not the slowest thing in the world honestly
	this.messageParser = function(message, bot){
		// We do this each time in case the bot's commands change.
		var map = {};
		var syntaxes = [];
		_.forEach(bot.commands, function(command){
			command.syntax.forEach(function(syntax){
				if (typeof syntax === 'string'){
					map[[syntax]] = command; // if the syntax is a string,
					syntaxes.push([syntax]); // make it an array
				} else {
					map[syntax] = command;
					syntaxes.push(syntax);
				}
			});
		});
		// Sort by descending number of tokens to match. This way, we avoid matching
		// a syntax for, say, env before env reserve.
		syntaxes.sort(function(a, b){
			return b.length - a.length;
		});

		var winner;
		_.forEach(syntaxes,function(syntax){
			if (syntax.length < message.length){
				if (_.every(syntax, function(word, index, collection){ 
					return message[index + 1] === word;
				})){
					winner = syntax;
					return false;
				}
			}
		});
		if (winner){
			return Promise.resolve({
				command : map[winner],
				args : _.slice(message, winner.length+1)
			});	
		}
		// if we've gotten through all the syntaxes and none of them match, we failed to find
		// Here is where we implement "did you mean?"
		var currentBestSyntax;
		var record = -1;
		// We look at each possible command they could have meant to run.

		syntaxes.forEach(function(syntax){
			var distance = Natural.JaroWinklerDistance(
				syntax.join(' '),
				_.slice(message, 1, syntax.length).join(' '));
			if (distance > record){
				record = distance;
				currentBestSyntax = syntax;
			}
		});

		var reply = "Unfortunately, that command was not found. Did you mean " + bot.name;
		for (n=0; n<currentBestSyntax.length; n++){
			reply += " " + currentBestSyntax[n];
		}
		reply += "?";
		// We rejected the lookup, but still want to output the reply, as it could be helpful.
		return Promise.reject(reply);
	};

	// Main event handler.

	var logAsWarn = function(err){
		winston.log('warn', err);
	};

	this.onEventsMessage = function(message){
		return self.authorizationFunction(message.user)
		.then(function(auths){
			// Ensure each role appears at most once.
			auths = _.uniq(auths);
			var handled = false;
			for (var k=0; k<self.handlers.length; k++){
				currentHandler = self.handlers[k];
				if (currentHandler.pattern(message, self, auths)){
					return currentHandler.logic(message, self, auths)
					.catch(logAsWarn);				
				}
			}
			for (k=0; k<self.oneoffHandlers.length; k++){
				currentHandler = self.oneoffHandlers[k];
				if (currentHandler.pattern(message, self, auths)){
					_.pull(self.oneoffHandlers, currentHandler);
					return currentHandler.logic(message, self, auths)
					.catch(logAsWarn);
				}
			}
			//Event handler for messages not handled by a special handler.
			//This is being (excessively) commented for now and we can remove some.

			//First, we tokenize the message. This tokenizer removes punctuation
			//and handles whitespace how you want it
			var message_split = tokenizer.tokenize(message.text);
			//If the message is directed at opkit
			if (message_split[0] &&
				(message_split[0].toLowerCase() === self.name.toLowerCase())){
				if (typeof message_split[1] === 'undefined') {		
					self.sendMessage("Hello! Message me '" + self.name + 
						" help' to get started!", message.channel);
					return Promise.resolve();
				}
				// We need to determine which command, if any, matches the message's text.
				return self.messageParser(message_split, self)
				// If one does, we run the old role matcher.
				.then(function(data){
					var command = data.command;
					message.args = data.args;
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
							}
						}
					} else {
						access = true;
					}
					if (access){
						return self.persister.recover(command.script)
						.then(function(data){
							self.brain[command.script] = data;
							return command.command(message, self, auths, self.brain[command.script]);
						})
						.then(function(response){
							return self.persister.save(self.brain[command.script], command.script);
						})
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
						winston.log('warn', 'User ' + message.user + 
							' attempted to run command ' + message.command);
						return Promise.resolve();
					}
				})
				.catch(function(reply){
					self.sendMessage(reply, message.channel);
					return Promise.resolve();
				});
			}
		});
	};	

	this.rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED);
	this.rtm.on(RTM_EVENTS.MESSAGE, this.onEventsMessage);

}

module.exports = OpkitBot;
