var Botkit = require('botkit');

function Bot() {
	
}

/*
	Function: makeBot
	
	Returns a Botkit slack bot object. 
*/
Bot.prototype.makeBot = function() {
	return Botkit.slackbot({
	debug: true
	});
}

module.exports = Bot;