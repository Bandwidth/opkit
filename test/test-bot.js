var assert = require('chai').assert;
var Opkit = require('../index');
var sinon = require('sinon');
var Promise = require('bluebird');
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
	names : ['twelve', 'basicallyTwelve'],
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
	describe('3-argument Constructor', function(){
		before(function(){
			bot = new Opkit.Bot(
				'opkit',
				[sendsTwelveObject, otherObject],
				mockPersister
			);
		});
		it('should result in a properly initialized name and commands', function(){
			assert.equal(bot.name, 'opkit');
			assert.isOk(bot.commands.twelve);
		});
		it('should provide a default authorization function', function(){
			bot.authorizationFunction('user')
			.then(function(data){
				assert.equal(data.length, 0);
			});
		});
	});
	describe('4-argument Constructor', function(){
		before(function(){
			bot = new Opkit.Bot(
				'opkit',
				[sendsTwelveObject],
				mockPersister,
				authorizationFunction
			);
		});
		it('it should not override the provided authorizationFunction', function(){
			bot.authorizationFunction('user')
			.then(function(data){
				assert.equal(data.length, 3);
			});
		});		
		it('should expose the recover method', function(){
			return bot.recover('package')
			.then(function(data){
				assert.isOk(data);
			});
		});
	});

	describe('Adding handlers', function(){
		beforeEach(function(){
			bot = new Opkit.Bot(
				'opkit',
				[sendsTwelveObject],
				mockPersister,
				authorizationFunction
			);
		});	
		it('should successfully add a special handler', function(){
			bot.addHandler(pattern, logic);
			assert.equal(bot.handlers.length, 1);
		});
		it('should successfully add a oneoff special handler', function(){
			bot.addOneOffHandler(pattern, logic);
			assert.equal(bot.oneoffHandlers.length, 1);
		});		
		it('should successfully add a special handler with lifetime', function(){
			bot.addHandler(pattern, logic, 2, sinon.stub());
			bot.addHandler(pattern, logic, 5);
			assert.equal(bot.handlers.length, 2);
			clock.tick(2500);
			assert.equal(bot.handlers.length, 1);		
			clock.tick(3000);	
			assert.equal(bot.handlers.length, 0);		
		});
		it('should successfully add a oneoff special handler', function(){
			bot.addOneOffHandler(pattern, logic, 2, sinon.stub());
			bot.addOneOffHandler(pattern, logic, 5);			
			assert.equal(bot.oneoffHandlers.length, 2);
			clock.tick(2500);
			assert.equal(bot.oneoffHandlers.length, 1);	
			clock.tick(3000);	
			assert.equal(bot.oneoffHandlers.length, 0);	
		})
	});

	describe('sendMessage', function(){
		before(function(){
			bot = new Opkit.Bot(
				'opkit',
				[sendsTwelveObject],
				mockPersister,
				authorizationFunction
			);
		});
		it('it should call bot.rtm.sendMessage', function(){
			bot.rtm.sendMessage = sinon.mock().once();
			bot.sendMessage('foo', 'bar');
			bot.rtm.sendMessage.verify();
		});
	});
	describe('start', function(){
		before(function(){
			bot = new Opkit.Bot(
				'opkit',
				[sendsTwelveObject],
				mockPersister,
				authorizationFunction
			);
		});
		it('it should call bot.rtm.start', function(){
			bot.rtm.start = sinon.mock().once();
			return bot.start()
			.then(function(){
				bot.rtm.start.verify();
			});
		});
	});
	describe('message parser', function(){
		before(function(){
			bot = new Opkit.Bot(
				'opkit',
				[sendsTwelveObject],
				mockPersister,
				authorizationFunction
			);
		});
		it('should return a match when an actual match occurs', function(){
			return bot.messageParser(['testbot', 'send', 'me', 'twelve'], bot)
			.then(function(data){
				assert.equal(data.command, sendsTwelveObject);
			});
		});
		it('should return a match with the correct args', function(){
			return bot.messageParser(['testbot', 'send', 'me', 'twelve' ,'please'], bot)
			.then(function(data){
				assert.equal(data.args[0], 'please');
				assert.equal(data.args.length, 1);
			});
		});		
		it('should not return a match when there is no match', function(){
			return bot.messageParser(['testbot', 'provide', 'me', 'twelve'], bot)
			.then(function (data){
				throw new Error();
			})
			.catch(function (){});
		});
	})

	describe('onEventsMessage - uncontrolled functions', function(){
		before(function(){
			bot = new Opkit.Bot(
				'opkit',
				[sendsTwelveObject],
				mockPersister,
				authorizationFunction
			);
		});  
		it("shouldn't respond to messages not addressed to it", function(){
			bot.sendMessage = sinon.mock().never();
			bot.onEventsMessage({
				text : "I really enjoyed that Nickelback concert-show.",
				user : "That guy we all know"
			});
			bot.sendMessage.verify();			
		}); 
		it ("should reject on a command it doesn't have", function(){
			bot.sendMessage = sinon.mock().once();
			bot.messageParser = sinon.mock().rejects();
			return bot.onEventsMessage({
				text : "opkit joke",
				user : "user"
			})
			.then(function (data){
				throw new Error();
			})
			.catch(function (){
				bot.sendMessage.verify();				
			});
		}); 
		it ("should work if it does have that command", function(){
			bot.sendMessage = sinon.mock().once();
			bot.messageParser = sinon.mock().resolves({
				command :sendsTwelveObject
			});
			return bot.onEventsMessage({
				text : "opkit twelve",
				user : "user"
			})
			.then(function (data){
				bot.sendMessage.verify();
			});
		}); 
		it ("should call a special handler if defined", function(){
			bot.addHandler(pattern, logic);
			bot.addHandler(otherPattern, otherLogic);
			bot.sendMessage = sinon.mock().twice();
			return bot.onEventsMessage({
				text : "boogie",
				user : "user"
			})
			.then(function (data){
				bot.sendMessage.verify();
			});		
		});
		it ("should call handlers' logic", function(){
			bot.sendMessage = sinon.mock().once();
			return bot.onEventsMessage({
				text : "boogie",
				user : "notUser"
			})
			.then(function (data){
				bot.sendMessage.verify();
			});		
		});
		it ("should call oneoff handlers once if defined", function(){
			bot = new Opkit.Bot(
				'opkit',
				[sendsTwelveObject],
				mockPersister,
				authorizationFunction
			);
			bot.addOneOffHandler(pattern, logic);
			bot.addOneOffHandler(otherPattern, otherLogic);
			bot.sendMessage = sinon.mock().twice();
			return bot.onEventsMessage({
				text : "boogie",
				user : "user"
			})
			.then(function (data){
				return bot.onEventsMessage({
					text : "boogie",
					user : "user"
				}).then(function(){
					bot.sendMessage.verify();
				});
			});		
		});
		it ("should call oneoff handlers' logic", function(){
			bot.addOneOffHandler(pattern, logic);
			bot.addOneOffHandler(otherPattern, otherLogic);
			bot.sendMessage = sinon.mock().exactly(1);
			return bot.onEventsMessage({
				text : "boogie",
				user : "notUser"
			})
			.then(function (data){
				bot.sendMessage.verify();
			});		
		});
		it('should send a hello message if just the name of the bot is entered', function() {		
 			bot.sendMessage = sinon.mock().once();		
 			return bot.onEventsMessage({		
 				text : "opkit",		
 				user : "user"		
 			})		
 			.then(function(data) { 		
 				bot.sendMessage.verify();		
 			});		
 		});
	});

	describe('onEventsMessage - controlled functions', function(){
		before(function(){
			sendsTwelveObject = {
				command : sendsTwelve,
				names : ['twelve', 'sendstwelve'],
				roles : [['A', 'B'], 'D']
			}
			bot = new Opkit.Bot(
				'opkit',
				[sendsTwelveObject],
				mockPersister,
				authorizationFunction
			);
		});
		it("shouldn't respond to messages not addressed to it", function(){
			bot.sendMessage = sinon.mock().never();
			bot.onEventsMessage({
				text : "I really enjoyed that Nickelback concert.",
				user : "That guy we all know"
			});
			bot.sendMessage.verify();			
		});
		it ("should reject on a command it doesn't have", function(){
			bot.sendMessage = sinon.mock().once();
			bot.messageParser = sinon.mock().rejects();
			return bot.onEventsMessage({
				text : "opkit joke",
				user : "user"
			})
			.then(function (data){
				throw new Error();
			})
			.catch(function (){
				bot.sendMessage.verify();				
			});
		});
		it ("should work if it does have that command - matching multiple roles", function(){
			bot.messageParser = sinon.mock().resolves({
				command : sendsTwelveObject,
				args : []
			});			
			bot.sendMessage = sinon.mock().once();
			return bot.onEventsMessage({
				text : "opkit twelve",
				user : "user"
			})
			.then(function (data){
				bot.sendMessage.verify();
			});
		});
		it ("should work if it does have that command - matching single role", function(){
			bot.messageParser = sinon.mock().resolves({
				command : sendsTwelveObject,
				args : []
			});			bot.authorizationFunction = function(message, bot, auth){
				return Promise.resolve(['A', 'C', 'D']);
			};
			bot.sendMessage = sinon.mock().once();
			return bot.onEventsMessage({
				text : "opkit twelve",
				user : "user"
			})
			.then(function (data){
				bot.sendMessage.verify();
			});
		});
		it ("should work if the command fails (rejects promise)", function(){
			bot.messageParser = sinon.mock().resolves({
				command : sendsTwelveObject,
				args : []
			});
			bot.authorizationFunction = function(message, bot, auth){
				return Promise.resolve(['A', 'C', 'D']);
			};
			bot.sendMessage = sinon.mock().never();
			bot.commands.twelve.command = function(message, bot, auth){
				return Promise.reject("Bot failed to send the string literal '12'.");
			};
			return bot.onEventsMessage({
				text : "opkit twelve",
				user : "user"
			})
			.then(function (data){
				bot.sendMessage.verify();
			});
		}); 
		it ("should reject if access is denied", function(){
			bot.messageParser = sinon.mock().resolves({
				command : sendsTwelveObject,
				args : []
			});
			bot.authorizationFunction = function(message, bot, auth){
				return Promise.resolve(['A', 'E', 'F']);
			};
			bot.sendMessage = sinon.mock().once();
			return bot.onEventsMessage({
				text : "opkit twelve",
				user : "user",
				channel : 'English'
			})
			.catch(function (data){
				bot.sendMessage.verify();
			});		
		}); 
	});
});