README v0.01 / 11 MAY 2016
[![Build Status](https://travis-ci.com/inetCatapult/opkit.svg?token=hbpefyJzUkgSojiEnqMS&branch=master)](https://travis-ci.com/inetCatapult/opkit)

# Opkit

## Introduction

Opkit is a devops bot framework for Slack. It aims to provide an easy-to-use and resource-light way to set up a bot, optimized for rapid deployment onto a cloud hosting provider. We've found that simple bots made using this framework run comfortably on even very small instances (like Heroku's hobby tier). It's optimized for use with AWS, and includes helpful methods that provide information on things like SQS queue sizes and Cloudwatch alarms. 

## Usage

### Installation

Opkit is an npm module. To install:

npm install opkit (--save)

You may need to run this command as root.

### Configuration

Constructing a bot couldn't be easier! All you need to do is define two objects: one that holds your bot's methods, and one that holds your bot's internal state, or variables it will need to access. The names of your bot's methods are the command words that your bot will respond to. For example,

```javascript

var commands = {
	hello : function(message, bot){
		bot.sendMessage("Hello to you, too!", message.channel);
	}
}

```

will cause the bot to repond to messages that begin with 'hello' in that channel. Each method call passes in the `bot` object so you can access its `state` or its Slack `dataStore`, which provides useful methods, for example, to convert between User IDs and names, or to provide lists of channels in the organization.

Once you've put your commands and state into their respective objects, just construct the bot and start it up!

```javascript

var commands = { ... };
var state = { ... };
var Opkit = require('opkit');
var myBot = Opkit.makeBot('mybot', commands, state);
mybot.start();
```
This bot will listen to all messages that begin with its name, so if you taught it the command above, messaging it `mybot hello` will elicit a response!

You'll need to ensure that your Slack API token is stored at the environment variable named 'token', though; for example:

`token=$YOUR_API_TOKEN_HERE node server.js`.

There is more thorough documentation available at the Javadoc page; documentation is automagically generated and posted to http://inetcatapult.github.io/opkit/index.html with each update. Look at our example scripts, too!

## Contacts

Illirik Smirnov (ismirnov@bandwidth.com)

Ramkumar Rao (rrao@bandwidth.com)

## License

This project is licensed under the MIT License. For more details, visit: https://opensource.org/licenses/MIT
