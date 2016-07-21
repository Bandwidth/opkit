README v0.01 / 11 MAY 2016
[![Build Status](https://travis-ci.com/inetCatapult/opkit.svg?token=hbpefyJzUkgSojiEnqMS&branch=master)](https://travis-ci.com/inetCatapult/opkit)

# Opkit

## Introduction

Opkit is a devops bot framework for Slack. It aims to provide an easy-to-use and resource-light way to set up a bot, optimized for rapid deployment onto a cloud hosting provider. We've found that simple bots made using this framework run comfortably on even very small instances (like Heroku's hobby tier). It's optimized for use with AWS, and includes helpful methods that provide information on things like SQS queue sizes and Cloudwatch alarms.


It has many features which are useful for configuring the bot to control mission-critical interfaces, including sophisticated access control and automatic persistence to disk, MongoDB, Redis, and Postgres.

## Usage

### Installation

Opkit is an npm module. To install:

npm install opkit (--save)

You may need to run this command as root.

### Getting Started

There is an example script at examples/example.js in the repository. You'll need to set an environment variable for your slack token, which can be obtained through the Custom Integrations panel on Slack. (The example script expects the environment variable to be named `token`. Run it with `node example.js`.

### Configuration

The fundamental object that Opkit operates on is the command. Opkit expects an array of command objects to be passed in to the constructor. Each command object represents a script that ought to be run when a particular pattern is encountered and matched. By default, opkit reads each message coming in each channel it is invited to (or direct messages it recieves), so long as that message is prefixed with the bot's name (say, 'examplebot').

Suppose that you wanted to write a command to have Opkit respond each time it is greeted with an 'examplebot hello' message. That command would look like this:

```javascript

var sayHello = {
	name : 'hello',
	script : 'hello',
	syntax : ['hello', ['say', 'hello']],
	command : function(message, bot, auth, brain){
		bot.sendMessage("Hello to you, too!", message.channel);
	}
}

```

This command would cause the bot to respond to each message that says 'examplebot hello' or 'examplebot say hello'. The `name` field allows you to access the command at `bot.commands.hello`, if need be. `syntax` provides an array of possible syntaxes that can be used to call the command. Here, the bot will respond to both `hello` and `say hello`. 

The actual logic is contained in the function at 'command'. That function ought to take four arguments: 

`message` has the contents of the message as provided by Slack; three useful fields are `message.text`, which contains a string of message text, `message.channel`, which is the channel ID of the incoming message, and `message.user`, which is the user ID of the user sending the message. `message.args` contains the arguments provided to the command from the message; that is, it is an array of words that came after the command; it is useful if a command has multiple `syntax`es of varying length.

`bot` has the actual bot that called the script. In cases where there are multiple bots listening in the same channel, each will have different `sendMessage` commands (as well as different access to the Slack RTM API methods, all of which are accessible at bot.rtm.) 

`auth` is used with the optional access control. The bot constructor takes an optional `authFunction` parameter, which allows access control to be implemented. `authFunction` should return a promise that resolves to an array of strings; each string should be a role that is assigned to that particular user. A local access file or database can be queried; then, the command can check the `auth` argument to see if a user can has authorization to run that command. (Alternatively, providing a `roles` field in the command object will cause Opkit to restrict access to that command to only those users who have at least one of those roles.)

`brain` provides a place to store state variables. These variables are 'scoped' to the script; that is, all commands with the same script share a brain. If you put all of your new commands into the same script, they will all be able to view each others' contributions to the state, while presenting no risk of interfering with commands from other scripts. The brain is populated from the persister (the local filesystem, MongoDB, PostgreSQL, or Redis) before each command is run, and saved to the persister after each command is run. The maximum size of `brain` is 16MB on the Mongo persister or 512MB on the Redis persister; try a local FS or Postgres if you'd like to store more.

Once you've put your commands into an array, the next choice is that of your persister. Opkit currently offers four complete persisters, while also offering you the ability to write your own. `Opkit.FilePersister` saves to a folder on the filesystem in a human-readable JSON format, `Opkit.MongoPersister` saves to a MongoDB database, `Opkit.RedisPersister` saves to Redis, and `Opkit.PostgresPersister` saves to Postgres. The constructors for each persister take a folder, a Mongo URI, a Redis URL, or a Postgres URL, respectively. After building a persister, simply run the constructor and start the bot:

```javascript

var commands = [sayHello];
var Opkit = require('opkit');
var Persiter = new Opkit.FilePersister('~/bot-state');
var myBot = new Opkit.bot('mybot', commands, Persister);
myBot.start();
```
This bot will listen to all messages that begin with its name, so if you taught it the command above, messaging it `mybot hello` will elicit a response!

You'll need to ensure that your Slack API token is stored at the environment variable named 'token', though; for example:

`token=$YOUR_API_TOKEN_HERE node server.js`.

There is more thorough documentation available at the Javadoc page; documentation is automagically generated and posted to http://inetcatapult.github.io/opkit/index.html with each update. Look at our example scripts, too!

##Running Tests Locally

Simply run `npm test`.

##Contributing

See our [contributing guidelines](CONTRIBUTING.md).

## Contacts

Illirik Smirnov (ismirnov@bandwidth.com)

Ramkumar Rao (rrao@bandwidth.com)

## License

*The MIT License (MIT)*

Copyright (c) 2016 Bandwidth, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
