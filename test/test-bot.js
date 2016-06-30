var assert = require('chai').assert;
var Opkit = require('../index');
var sinon = require('sinon');
var Promise = require('bluebird');
var _ = require('lodash');
require('sinon-as-promised')(Promise);

var pattern = function(message, bot, auths){
	return (message.text === 'boogie');
};
var logic = function(message, bot, auths){
	bot.sendMessage('You know I can boogie down', message.channel);
	if (message.user === 'user') {
		bot.sendMessage('Specially for you', message.channel);		
	} else {
		return Promise.reject();	
	} 
	return Promise.resolve();
};

var otherPattern = function(message, bot, auths){
	return (message.text === 'opkit twelve');
};
var otherLogic = function(message, bot, auths){
	bot.sendMessage('Twelve, from the special handler', message.channel);
	if (message.user === 'user') {
		return Promise.resolve();
	} else {
		return Promise.reject();	
	} 
};

var sendsTwelve = function(message, bot, auth){
	bot.sendMessage('12', message.channel);
	return Promise.resolve("Bot successfully sent the string literal '12'.");
};

var authorizationFunction = function(message, bot, auth){
	return Promise.resolve(['A', 'B', 'C']);
};

var sendsTwelveObject = {
	command : sendsTwelve,
	name : 'twelve',
	syntax : [	['give', 'me', 'twelve'],
				['send', 'me', 'twelve'],
				['send', 'twelve'],
				['give', 'me', 'a', 'number'],
				'twelve'],
	package : 'numbers'
}

var otherObject = {
	command : sendsTwelve,
	name : 'totesnotTwelve',
	syntax : ['give', 'me', 'totesnotTwelve'],
	package : 'numbers'
}

var mockPersister = {
	save : function(brain, package){
		return Promise.resolve(true);
	},
	recover : function(package){
		return Promise.resolve({
			data : 'some_data'
		});
	},
	start : function(){
		return Promise.resolve(true);
	}
}

var failsToSendTwelve = function(message, bot, auth){
	return Promise.reject("Bot couldn't send '12' for some reason.");
};

var bot;

var clock = sinon.useFakeTimers();

describe('Bot', function(){
	describe('#Constructor without params', function(){
		before(function(){
			bot = new Opkit.Bot(
				'opkit',
				[sendsTwelveObject, otherObject],
				mockPersister
			);
		});
		it('should result in a properly initialized name', function(){
			assert.equal(bot.name, 'opkit');
		});
		it('should result in a properly initialized command', function(){
			assert.isOk(bot.commands.twelve);
		});
		it('should provide a default authorization function', function(){
			assert.isOk(bot.authorizationFunction);
		});
		it('should provide the correct default authorization function', function(){
			return bot.authorizationFunction('user')
			.then(function(data){
				assert.equal(data.length, 0);
			});
		});
		it('should expose the recover method', function(){
			return bot.recover('package')
			.then(function(data){
				assert.isOk(data);
			});
		});
	});
	describe('#Constructor with authorization function', function(){
		before(function(){
			bot = new Opkit.Bot(
				'opkit',
				[sendsTwelveObject],
				mockPersister,{
					authFunction : authorizationFunction
				}
			);
		});
		it('should not override the provided authorizationFunction', function(){
			bot.authorizationFunction('user')
			.then(function(data){
				assert.equal(data.length, 3);
			});
		});		
	});
	describe('#Constructor with log level DEBUG', function(){
		before(function(){
			bot = new Opkit.Bot(
				'opkit',
				[sendsTwelveObject],
				mockPersister,{
					logLevel : 'DEBUG'
				}
			);
		});
		it('should set the correct log level', function(){
			assert.equal(bot.logLevel, 'DEBUG');
		});		
	});
	describe('#Constructor with log level PROD', function(){
		before(function(){
			bot = new Opkit.Bot(
				'opkit',
				[sendsTwelveObject],
				mockPersister,{
					logLevel : 'PROD'
				}
			);
		});
		it('should set the correct log level', function(){
			assert.equal(bot.logLevel, 'PROD');
		});		
	});
	describe('#Constructor with log level TEST', function(){
		before(function(){
			bot = new Opkit.Bot(
				'opkit',
				[sendsTwelveObject],
				mockPersister,{
					logLevel : 'TEST'
				}
			);
		});
		it('should set the correct log level', function(){
			assert.equal(bot.logLevel, 'TEST');
		});		
	});

	describe('#Adding handlers', function(){
		var stubCallback;
		var calledHandlerCallback;
		before(function(){
			bot = new Opkit.Bot(
				'opkit',
				[sendsTwelveObject],
				mockPersister,
				{
					authFunction : authorizationFunction,
					logLevel : 'TEST'
				}
			);
			stubCallback = sinon.stub();
			calledHandlerCallback = sinon.stub();
			// These handlers should survive the 2,500 msec.
			bot.addHandler(pattern, logic);
			bot.addOneOffHandler(pattern, logic);
			// These handlers should not. After 2,500 msec, stubCallback should have been called twice.
			bot.addHandler(pattern, logic, 2, stubCallback);
			bot.addOneOffHandler(pattern, logic, 2, stubCallback);
			bot.addHandler(pattern, logic, 2);
			bot.addOneOffHandler(pattern, logic, 2);
			// These handlers are no longer stored in their arrays, so they shouldn't time out.
			// calledHandlerCallback should not be called.
			var calledHandler = bot.addHandler(pattern, logic, 2, calledHandlerCallback);
			var otherCalledHandler = bot.addOneOffHandler(pattern, logic, 2, calledHandlerCallback);
			_.pull(bot.handlers, calledHandler);
			_.pull(bot.oneoffHandlers, otherCalledHandler);
		});	
		it('should successfully add recurring handlers', function(){
			assert.equal(bot.handlers.length, 3);
		});
		it('should successfully add oneoff handlers', function(){
			assert.equal(bot.oneoffHandlers.length, 3);
		});		
		it('should timeout recurring handlers', function(){
			clock.tick(2500);
			assert.equal(bot.handlers.length, 1);
		});
		it('should timeout oneoff handlers', function(){
			assert.equal(bot.oneoffHandlers.length, 1);
		});		
		it('should call the onTimeout callbacks', function(){
			assert(stubCallback.calledTwice);
		});
		it('should not call the onTimeout callbacks of pulled handlers', function(){
			assert(!calledHandlerCallback.called);
		});		
	});

	describe('#sendMessage', function(){
		before(function(){
			bot = new Opkit.Bot(
				'opkit',
				[sendsTwelveObject],
				mockPersister,
				{
					authFunction : authorizationFunction,
					logLevel : 'TEST'
				}
			);
			bot.rtm.sendMessage = sinon.mock().once();
			bot.sendMessage('foo', 'bar');
		});
		it('it should call bot.rtm.sendMessage', function(){
			bot.rtm.sendMessage.verify();
		});
	});
	describe('#start', function(){
		before(function(){
			bot = new Opkit.Bot(
				'opkit',
				[sendsTwelveObject],
				mockPersister,
				{
					authFunction : authorizationFunction,
					logLevel : 'TEST'
				}
			);
			bot.rtm.start = sinon.mock().once();
			bot.start();
		});
		it('it should call bot.rtm.start', function(){
			bot.rtm.start.verify();
		});
	});
	describe('#message parser', function(){
		beforeEach(function(){
			bot = new Opkit.Bot(
				'opkit',
				[sendsTwelveObject],
				mockPersister,
				{
					authFunction : authorizationFunction,
					logLevel : 'TEST'
				}
			);	
		});
		describe('#case of match without params', function () {
			var result;
			before(function(){
				return bot.messageParser(['testbot', 'send', 'me', 'twelve'], bot)
				.then(function(data){
					result = data;
				});
			});

			it('should return a match', function(){
				assert.equal(result.command, sendsTwelveObject);
			});
		});
		describe('#case of match with params', function () {
			var result;

			before(function(){
				return bot.messageParser(['testbot', 'send', 'me', 'twelve' ,'please'], bot)
				.then(function(data){
					result = data;
				});
			});

			it('should return a match', function(){
				assert.equal(result.command, sendsTwelveObject);
			});

			it('should return the correct args', function(){
				assert.deepEqual(result.args, ['please']);
			});
		});
		describe('#case with no match', function(){
			var result;
			
			before(function(){
				return bot.messageParser(['testbot', 'provide', 'me', 'thirteen'], bot)
				.then(function(){
					result = 'Match';
				})
				.catch(function(){
					result = 'No match';
				});
			});

			it('should not return a match when there is no match', function(){
				assert.equal(result, 'No match');
			});
		});
	});

	describe('#onEventsMessage - uncontrolled functions', function(){
		before(function(){
			bot = new Opkit.Bot(
				'opkit',
				[sendsTwelveObject],
				mockPersister,
				{
					authFunction : authorizationFunction,
					logLevel : 'TEST'
				}
			);
		});  
		describe('#case where message is not addressed to Opkit', function(){
			before(function(){
				bot.sendMessage = sinon.mock().never();
				bot.onEventsMessage({
					text : "I really enjoyed that Nickelback concert-show.",
					user : "That guy we all know"
				});				
			});
			it("shouldn't respond to messages not addressed to it", function(){
				bot.sendMessage.verify();					
			})
		});		
		describe("#case where Opkit doesn't have that command", function(){
			var success;
			before(function(){
				bot.sendMessage = sinon.mock().once();
				bot.messageParser = sinon.mock().rejects();
				return bot.onEventsMessage({
					text : "opkit joke",
					user : "user"
				});
			});
			it("shouldn't respond to messages not addressed to it", function(){
				bot.sendMessage.verify();		
			});
		});	
		describe("#case where Opkit has that command", function(){
			before(function(){
				bot.sendMessage = sinon.mock().once();
				bot.messageParser = sinon.mock().resolves({
					command :sendsTwelveObject
				});
				return bot.onEventsMessage({
					text : "opkit twelve",
					user : "user"
				});
			});
			it("shouldn't respond to messages not addressed to it", function(){
				bot.sendMessage.verify();
			});
		});			
		describe('#case where there is some special handler', function(){
			var handlerLogic, otherHandlerLogic;
			before(function(){
				handlerLogic = sinon.stub().resolves();
				otherHandlerLogic = sinon.stub().resolves();
				bot.addHandler(sinon.stub().returns(false), otherHandlerLogic);
				bot.addHandler(sinon.stub().returns(true), handlerLogic);
				return bot.onEventsMessage({
					text : "boogie",
					user : "user"
				});
			});
			it("should call the handler that matches", function(){
				assert(handlerLogic.calledOnce);
			});
			it("shouldn't call a handler that doesn't match", function(){
				assert(!otherHandlerLogic.called);
			});
		});
		describe('#case where there is some oneoff handler', function(){
			var handlerLogic, otherHandlerLogic;
			before(function(){
				bot.handlers = [];
				handlerLogic = sinon.stub().resolves();
				otherHandlerLogic = sinon.stub().resolves();
				bot.addOneOffHandler(sinon.stub().returns(false), otherHandlerLogic);
				bot.addOneOffHandler(sinon.stub().returns(true), handlerLogic);
				return bot.onEventsMessage({
					text : "boogie",
					user : "user"
				});
			});
			it("should call the handler that matches once", function(){
				assert(handlerLogic.calledOnce);
			});
			it("shouldn't call a handler that doesn't match", function(){
				assert(!otherHandlerLogic.called);
			});
		});
		describe("#case where just the bot's name is sent", function(){
			before(function(){
				bot.oneoffHandlers = [];
	 			bot.sendMessage = sinon.mock().once();		
	 			return bot.onEventsMessage({		
	 				text : "opkit",		
	 				user : "user"		
	 			});
			});
			it('should send a hello message if just the name of the bot is entered', function() {		
	 			bot.sendMessage.verify();		
	 		});
		});
	});

	describe('#onEventsMessage - controlled functions', function(){
		before(function(){
			sendsTwelveObject = {
				command : sendsTwelve,
				name : 'twelve',
				roles : [['A', 'B'], 'D']
			}
			bot = new Opkit.Bot(
				'opkit',
				[sendsTwelveObject],
				mockPersister,
				{
					authFunction : authorizationFunction,
					logLevel : 'TEST'
				}
			);
		});
		describe('#case where a user has one role', function(){
			var result;
			before(function(){
				bot.messageParser = sinon.mock().resolves({
					command : sendsTwelveObject,
					args : []
				});			
				return bot.onEventsMessage({
					text : "opkit twelve",
					user : "user"
				})
				.then(function(){
					result = true;
				})
				.catch(function(){
					result = false;
				});
			});
			it('should match with one role', function(){
				assert(result);
			});
		});
		describe('#case where a user has multiple roles', function(){
			var result;
			before(function(){
				bot.messageParser = sinon.mock().resolves({
					command : sendsTwelveObject,
					args : []
				});			
				bot.authorizationFunction = function(message, bot, auth){
					return Promise.resolve(['A', 'C', 'D']);
				};
				return bot.onEventsMessage({
					text : "opkit twelve",
					user : "user"
				})
				.then(function(){
					result = true;
				})
				.catch(function(){
					result = false;
				});
			});
			it('should match', function(){
				assert(result);
			});
		});
		describe('#case where access is denied', function(){
			var result;
			before(function(){
				bot.messageParser = sinon.mock().resolves({
					command : sendsTwelveObject,
					args : []
				});			
				bot.authorizationFunction = function(message, bot, auth){
					return Promise.resolve(['A', 'E', 'F']);
				};
				return bot.onEventsMessage({
					text : "opkit twelve",
					user : "user"
				})
				.then(function(){
					result = true;
				})
				.catch(function(){
					result = false;
				});
			});
			it('should still resolve', function(){
				assert(result);			
			});
		});
		describe("#case where the command rejects promise", function(){
			var result;
			before(function(){
				bot.messageParser = sinon.mock().resolves({
					command : sendsTwelveObject,
					args : []
				});
				bot.authorizationFunction = function(message, bot, auth){
					return Promise.resolve(['A', 'C', 'D']);
				};
				bot.commands.twelve.command = function(message, bot, auth){
					return Promise.reject("Bot failed to send the string literal '12'.");
				};
				return bot.onEventsMessage({
					text : "opkit twelve",
					user : "user"
				}).then(function(){
					result = true;
				})
				.catch(function(){
					result = false;
				});
			});
			it('should still resolve', function(){
				assert(result);							
			})
		}); 
	});
});