var assert = require('chai').assert;
var Opkit = require('../index');
var sinon = require('sinon');
var Promise = require('bluebird');
var bot; 

var returnsTwelve = function(message, bot, auth){
	return 12;
};

var sendsTwelve = function(message, bot, auth){
	bot.sendMessage('12', message.channel);
	return Promise.resolve("Bot successfully sent the string literal '12'.");
};

var userHasAuthorizationTo = function(message, bot, auth){
	return Promise.resolve(true);
};

var failsToSendTwelve = function(message, bot, auth){
	return Promise.reject("Bot couldn't send '12' for some reason.");
};

describe('Bot', function(){
	describe('Constructor', function(){
		before(function(){
			bot = new Opkit.Bot('mister', 
				{
					twelve : returnsTwelve
				},
				{
					variable : 0
			});

		});
		it('should create a bot with the correct name', function(){
			assert.equal(bot.name, 'mister');
		});
		it('should create a bot with the correct function', function(){
			assert.equal(bot.commands.twelve(), 12);
		});
		it ("should present a userHasAuthorizationTo function that resolves to true by default", function(){
			bot.commands.userHasAuthorizationTo('1', '2')
			.then(function(response){
				assert.isOk(response);
			})
			.catch(function(err){
				throw new Error();
			});
		});
		it ("should present a userHasAuthorizationTo function that resolves to true if\n"+
			"only some environment variables are set", function(){
			process.env.amazonId = '12';	
			bot.commands.userHasAuthorizationTo('1', '2')
			.then(function(response){
				assert.isOk(response);
			})
			.catch(function(err){
				throw new Error();
			});
			process.env.amazonSecret = '12';
			bot.commands.userHasAuthorizationTo('1', '2')
			.then(function(response){
				assert.isOk(response);
			})
			.catch(function(err){
				throw new Error();
			});
		});
		it ("should present a userHasAuthorizationTo function that returns an auth\n"+
			"if all environment variables are set", function(){
			process.env.amazonRegion = '12';
			bot.commands.userHasAuthorizationTo('1', '2')
			.then(function(response){
				assert.equal(response.props.region, '12');
			})
			.catch(function(err){
				throw new Error();
			});
		});
	});
	describe('Constructor', function(){
		before(function(){
			bot = new Opkit.Bot('mister', 
				{
					twelve : returnsTwelve,
					userHasAuthorizationTo : returnsTwelve
				},
				{
					variable : 0
			});	
		});
		it("shouldn't override extant userHasAuthorizationTo function", function(){
			assert.equal(bot.commands.userHasAuthorizationTo('1', '2'), 12)
		});
	});
	describe('start', function(){
		before(function(){
			bot = new Opkit.Bot('mister', 
				{
					twelve : returnsTwelve
				},
				{
					variable : 0
			});	
		});
		it("should call rtm.start() when bot.start() is called", function(){
			bot.start();
			var mock = sinon.mock(bot.rtm);
			mock.expects("start").once().throws();
			mock.restore();
		});
	});
	describe('sendMessage', function(){
		before(function(){
			bot = new Opkit.Bot('mister', 
				{
					twelve : returnsTwelve
				},
				{
					variable : 0
			});	
		});
		it("should call rtm.sendMessage() when bot.sendMessage() is called", function(){
			var mock = sinon.mock(bot.rtm);
			bot.sendMessage();
			mock.expects("sendMessage").once().throws();
			mock.restore();
		});
	});
	describe('onEventsMessage', function(){
		before(function(){
			bot = new Opkit.Bot('mister', 
				{
					sendsTwelve : sendsTwelve
				},
				{
					variable : 0
			});			
		});
		it("shouldn't respond to messages not addressed to it", function(){
			var mock = sinon.mock(bot.rtm);
			bot.onEventsMessage({
				text : "ma'am please",
				user : "steve McQueen"
			});
			mock.expects("sendMessage").never().throws();	
			mock.restore();		
		});
		it("shouldn't respond to messages for which it has no function", function(){
			var mock = sinon.mock(bot.rtm);
			bot.onEventsMessage({
				text : "mister please",
				user : "steve McQueen"
			});
			mock.expects("sendMessage").never().throws();			
			mock.restore();
		});	
		it("should respond to messages for which it has a function", function(){
			var mock = sinon.mock(bot.rtm);
			bot.onEventsMessage({
				text : "mister sendsTwelve",
				user : "steve McQueen"
			});
			mock.expects("sendMessage").once().withArgs("12").throws();			
			mock.restore();
		});
		it("should deny access for unauthorized users", function(){
			var mock = sinon.mock(bot.rtm);
			bot.commands.userHasAuthorizationTo = function(user, command){
				return Promise.reject('Access denied.');

			};
			bot.dataStore = {
				getUserById : function(user){
					return {
						name : user
					};
				}
			};
			bot.onEventsMessage({
				text : "mister sendsTwelve",
				user : "steve McQueen"
			});
			mock.expects("sendMessage").once().withArgs("Access denied.").throws();			
			mock.restore();			
		});
		it("should error if the userHasAuthorizationTo errors", function(){
			var mock = sinon.mock(bot.rtm);
			bot.commands.userHasAuthorizationTo = function(user, command){
				return Promise.reject("db broke");
			};
			bot.onEventsMessage({
				text : "mister sendsTwelve",
				user : "steve McQueen"
			});
			mock.expects("sendMessage").once()
			.withArgs("Error connecting to database.").throws();			
			mock.restore();			
		});
		it("should catch errors thrown by the commands it calls", function(){
			var mock = sinon.mock(bot.rtm);
			bot.commands.userHasAuthorizationTo = function(user, command){
				return Promise.resolve(true);
			};
			bot.commands.sendsTwelve = function(message, bot, auth){
				return Promise.reject('Bot broke something.');
			};
			bot.onEventsMessage({
				text : "mister sendsTwelve",
				user : "steve McQueen"
			});
			mock.expects("sendMessage")
			.once().
			withArgs("There was an error processing that command.")
			.throws();			
			mock.restore();			
		});
	});
});