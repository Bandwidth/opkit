var Opkit = new require('../index');
var opkit = new Opkit();
var Bot = Opkit.Bot
console.log(Bot);
var BOT_NAME = 'samplebot';

var state = {
	numberOfMessages : 0
};

var commands = { 
	status : function(message, bot, auth){
		bot.state.numberOfMessages = bot.state.numberOfMessages + 1;
		if (auth.props){
			bot.sendMessage(self.opkit.Alarms.queryAlarmsByStateReadably(auth), message.channel);
		} else {
			bot.sendMessage("You haven't got AWS keys defined as environment variables!\n"+
							"Ensure that your AWS keys are in the following places:\n"+
							"amazonId : Access Key ID\n"+
							"amazonSecret : Secret Access Key\n"+
							"amazonRegion : Region (e.g. 'us-east-1').", message.channel);
		}
	},
	joke : function(message, bot){
		bot.state.numberOfMessages = bot.state.numberOfMessages + 1;
		bot.sendMessage("A burrito is a sleeping bag for ground beef.", message.channel);
	},
	count : function(message, bot){
		bot.state.numberOfMessages = bot.state.numberOfMessages + 1;
		bot.sendMessage("You've sent me " + bot.state.numberOfMessages + " messages, including that one.",
			message.channel);
	}
};

bot = opkit.makeBot(BOT_NAME, commands, state);
bot.start();