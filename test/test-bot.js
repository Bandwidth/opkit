var assert = require('chai').assert;
var Opkit = require('../index');
var sinon = require('sinon');
var Promise = require('bluebird');

var sendsTwelve = function(message, bot, auth){
	bot.sendMessage('12', message.channel);
	return Promise.resolve("Bot successfully sent the string literal '12'.");
};

var authorizationFunction = function(message, bot, auth){
	return Promise.resolve(['A', 'B', 'C']);
};

var sendsTwelveObject = {
	command : sendsTwelve,
	names : ['twelve', 'sendstwelve'],
}

var failsToSendTwelve = function(message, bot, auth){
	return Promise.reject("Bot couldn't send '12' for some reason.");
};

var bot;

describe('Bot', function(){
	describe('3-argument Constructor', function(){
		before(function(){
			bot = new Opkit.Bot(
				'opkit',
				[sendsTwelveObject],
				{ variable : 'variable'}
			);
		});
		it('should result in a properly initialized name and commands', function(){
			assert.equal(bot.name, 'opkit');
			assert.isOk(bot.commands.twelve);
			assert.isOk(bot.commands.sendstwelve);
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
				{ variable : 'variable'},
				authorizationFunction
			);
		});
		it('it should not override the provided authorizationFunction', function(){
			bot.authorizationFunction('user')
			.then(function(data){
				assert.equal(data.length, 3);
			});
		});		
	});
	describe('sendMessage', function(){
		before(function(){
			bot = new Opkit.Bot(
				'opkit',
				[sendsTwelveObject],
				{ variable : 'variable'},
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
				{ variable : 'variable'},
				authorizationFunction
			);
		});
		it('it should call bot.rtm.sendMessage', function(){
			bot.rtm.start = sinon.mock().once();
			bot.start();
			bot.rtm.start.verify();
		});
	});
	describe('onEventsMessage - uncontrolled functions', function(){
		before(function(){
			bot = new Opkit.Bot(
				'opkit',
				[sendsTwelveObject],
				{ variable : 'variable'},
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
			return bot.onEventsMessage({
				text : "opkit twelve",
				user : "user"
			})
			.then(function (data){
				bot.sendMessage.verify();
			});
		});
		it ("should work if the command is uncontrolled", function(){
			bot.sendMessage = sinon.mock().once();
			return bot.onEventsMessage({
				text : "opkit twelve",
				user : "user"
			})
			.then(function (data){
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
				{ variable : 'variable'},
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
			bot.authorizationFunction = function(message, bot, auth){
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
			bot.authorizationFunction = function(message, bot, auth){
				return Promise.resolve(['A', 'C', 'F']);
			};
			bot.sendMessage = sinon.mock().once();
			return bot.onEventsMessage({
				text : "opkit twelve",
				user : "user"
			})
			.catch(function (data){
				bot.sendMessage.verify();
			});		
		});
	});
});