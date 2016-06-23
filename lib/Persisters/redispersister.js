var Promise = require('bluebird');
var redis = Promise.promisifyAll(require('redis'));

function redisPersister(REDIS_URL) {

	this.initialized = false;
	var self = this;

	/**
	 * Initialize a connection to Redis.
	 * @returns A promise if the connection is successfully established.
	 */
	this.start = function() {
		if (!this.initialized) {
			this.client = redis.createClient(REDIS_URL);
			this.client.onAsync("error")
			.catch(function(err) {
				self.client.end(false);
			});
			this.initialized = true;
			return Promise.resolve('Connected.');
		}
		return Promise.reject('Error: Persister already initialized.');
	};

	/**
	 * Save the passed state to Redis.
	 * @param {Object} brain - State to be saved in Redis.
	 * @param {String} script - Name of key to save to in Redis.
	 * @returns A promise resolving to an appropriate success message or an error message.
	 */
	this.save = function(brain, script) {
		if (this.initialized) {
			return this.client.delAsync(script)
			.then(function() {
				return self.client.hsetAsync(script, JSON.stringify(brain), redis.print);
			});
		}
		return Promise.reject('Error: Persister not initialized.');
	};

	/**
	 * Retrieve data from Redis.
	 * @param {String} script - Name of key to retrieve data from in Redis.
	 * @returns The most recent entry to Redis, as a JavaScript object.
	 */
	this.recover = function(script) {
		if (this.initialized) {
			return this.client.hkeysAsync(script)
			.then(function(data) {
				if (data[0]) {
					data = JSON.parse(data[0]);
					return Promise.resolve(data);
				}
				return Promise.resolve({});
			});
		}
		return Promise.reject('Error: Persister not initialized.');
	};
}

module.exports = redisPersister;