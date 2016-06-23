var Opkit = new require('../index');
var Bot = Opkit.Bot;
var Alamrs = Opkit.Alarms;
var BOT_NAME = 'samplebot';
var persister = new Opkit.Persister('./state');
var commands = [];

var health = {
	name : 'health',
	script : 'sample',
	syntax: ['status', 'health'],
	command : function(message, bot, auth, brain){
		brain.numberOfMessages = brain.numberOfMessages + 1 || 1;
		if (process.env.amazonId && process.env.amazonSecret){
			return Alarms.healthReportByState(
				new Opkit.Auth(process.env.amazonId,
				process.env.amazonSecret, 'us-east-1'))
			.then(function(data){
				bot.sendMessage(data.replace(/(.*)([:])/mg, 
					function(match) { return '*' + match + '*'; }), message.channel);
				return Promise.resolve('User ' + bot.dataStore.getUserById(message.user).name + 
					' queried for a health report.');
			});
		} else {
			bot.sendMessage("You haven't got AWS keys defined as environment variables!\n"+
							"Ensure that your AWS keys are in the following places:\n"+
							"amazonId : Access Key ID\n"+
							"amazonSecret : Secret Access Key\n"+
							"amazonRegion : Region (e.g. 'us-east-1').", message.channel);
			return Promise.resolve('User ' + bot.dataStore.getUserById(message.user).name + 
				' queried for a health report.');
		}
	}
}

var joke = {
	name : 'joke',
	script : 'sample',
	syntax : ['joke'],
	command : function(message, bot, auth, brain){
		bot.sendMessage("A burrito is a sleeping bag for ground beef.", message.channel);
	}
}

var count = {
	name : 'count',
	script : 'count',
	syntax : ['count'],
	command : function(message, bot, auth, brain){
		brain.numberOfMessages = brain.numberOfMessages + 1 || 1;
		bot.sendMessage(brain.numberOfMessages + '!',
			message.channel);
	}
};

commands.push(health);
commands.push(joke);
commands.push(count);
bot = new Bot(BOT_NAME, commands, persister);
bot.start();