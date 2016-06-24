var Opkit = {};
Opkit.Alarms = require('./alarms');
Opkit.Auth = require('./auth');
Opkit.SQS = require('./sqs');
Opkit.Bot = require('./bot');
Opkit.EC2 = require('./ec2');
Opkit.Persister = require('./Persisters/defaultpersister');
Opkit.MongoPersister = require('./Persisters/mongopersister');
Opkit.RedisPersister = require('./Persisters/redispersister');
Opkit.PostgresPersister = require('./Persisters/postgrespersister');

module.exports = Opkit;
