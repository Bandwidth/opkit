var Promise = require('bluebird');
var MongoDB = require('mongodb-bluebird');

function mongoPersister(MONGODB_URI) {

	this.initialized = false;
	var self = this;

	/**
	 * Initialize a connection to the MongoDB.
	 * @returns A promise.
	 */
	this.start = function() {
		return MongoDB.connect(MONGODB_URI)
		.then(function(returnedDB) {
			self.initialized = true;
			self.db = returnedDB;
			return Promise.resolve('Connection established.');
		});
	};

	/**
	 * Save the passed state to the DB.
	 * @param {Object} passedState - State to be saved in the DB.
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
				return data;
			});
		} else {
			return Promise.reject('Error: Persister not initialized.');
		}
	};
}

module.exports = mongoPersister;