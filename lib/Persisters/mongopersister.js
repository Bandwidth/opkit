var Promise = require('bluebird');
var MongoDB = require('mongodb-bluebird');

function mongoPersister(MONGODB_URI) {

	this.initialized = false;
	var self = this;

	/**
	 * Initialize a connection to the MongoDB.
	 * @returns A promise if the connection is successfully established.
	 */
	this.start = function() {
		if (!this.initialized) {
			return MongoDB.connect(MONGODB_URI)
			.then(function(returnedDB) {
				self.initialized = true;
				self.db = returnedDB;
				return Promise.resolve('Connection established.');
			});
		}
		return Promise.reject('Error: Persister already initialized.');
	};

	/**
	 * Save the passed state to the DB.
	 * @param {Object} brain - State to be saved in the DB.
	 * @param {String} script - Name of collection to save to in DB.
	 * @returns A promise resolving to an appropriate success message or an error message.
	 */
	this.save = function(brain, script) {
		if (this.initialized) {
			var collection = this.db.collection(script);
			return collection.remove({})
			.then(function() {
				return collection.insert(brain);
			});
		}
		return Promise.reject('Error: Persister not initialized.');
	};

	/**
	 * Retrieve data from the DB.
	 * @param {String} script - Name of collection to retrieve from in DB.
	 * @returns The most recent entry to the DB, as a JavaScript object.
	 */
	this.recover = function(script) {
		if (this.initialized) {
			var collection = this.db.collection(script);
			return collection.find({})
			.then(function(data) {
				data = data[0];
				if (data === undefined) {
					data = {};
				}
				return Promise.resolve(data);
			});
		} else {
			return Promise.reject('Error: Persister not initialized.');
		}
	};
}

module.exports = mongoPersister;