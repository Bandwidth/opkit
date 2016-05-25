var assert = require('chai').assert;
var opkit = require('../index');
var opkitObject = new opkit();
var sinon = require('sinon');
var bot; 

var returnsTwelve = function(message, bot, auth){
	return 12;
};

var sendsTwelve = function(message, bot, auth){
	bot.sendMessage('12');
};

describe('Bot', function(){
	describe('Constructor', function(){
		before(function(){
			bot = opkitObject.makeBot('mister', 
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
		it ("should present a userHasAuthorizationTo function that returns true by default", function(){
			assert.isOk(bot.commands.userHasAuthorizationTo('1', '2'));
		});
		it ("should present a userHasAuthorizationTo function that returns true if\n"+
			"only some environment variables are set", function(){
			process.env.amazonId = '12';			
			assert.isOk(bot.commands.userHasAuthorizationTo('1', '2'));
			process.env.amazonSecret = '12';
			assert.isOk(bot.commands.userHasAuthorizationTo('1', '2'));
		});
		it ("should present a userHasAuthorizatioNTo function that returns an auth\n"+
			"if all environment variables are set", function(){
			process.env.amazonRegion = '12';
			assert.equal(bot.commands.userHasAuthorizationTo('1', '2').props.accessKeyId, '12');			
		});
	});
	describe('Constructor', function(){
		before(function(){
			bot = opkitObject.makeBot('mister', 
				{
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
			bot = opkitObject.makeBot('mister', 
				{
					userHasAuthorizationTo : returnsTwelve
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
			bot = opkitObject.makeBot('mister', 
				{
					userHasAuthorizationTo : returnsTwelve
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
			bot = opkitObject.makeBot('mister', 
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
				text : "ma'am please"
			});
			mock.expects("sendMessage").never().throws();	
			mock.restore();		
		});
		it("shouldn't respond to messages for which it has no function", function(){
			var mock = sinon.mock(bot.rtm);
			bot.onEventsMessage({
				text : "mister please"
			});
			mock.expects("sendMessage").never().throws();			
			mock.restore();
		});	
		it("should respond to messages for which it has a function", function(){
			var mock = sinon.mock(bot.rtm);
			bot.onEventsMessage({
				text : "mister sendsTwelve"
			});
			mock.expects("sendMessage").once().withArgs("12").throws();			
			mock.restore();
		});
		it("should deny access for unauthorized users", function(){
			var mock = sinon.mock(bot.rtm);
			bot.commands.userHasAuthorizationTo = function(user, command){
				return false;
			};
			bot.onEventsMessage({
				text : "mister sendsTwelve"
			});
			mock.expects("sendMessage").once().withArgs("Access denied.").throws();			
			mock.restore();			
		});
	});
});