var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Promise = require('bluebird');

function mongoPersister(schema, MONGODB_URI, collectionName) {

	this.initialized = false;

	/**
	 * Initialize a connection to the MongoDB. Also create a model based on the given collection name and schema.
	 * @returns A promise.
	 */
	this.start = function() {
		this.db = mongoose.createConnection(MONGODB_URI);
		this.model = this.db.model(collectionName, schema);
		this.initialized = true;
		return Promise.resolve("Connection created.");
	};

	/**
	 * Verify that the passed state conforms to the model schema.
	 * @param {Object} passedState - State to be saved in the DB.
	 * @returns A promise resolving to true or false.
	 */
	this.verify = function(passedState) {
		var modeledObject = new this.model(passedState);

		for (var property in passedState) {
			if (!modeledObject[property] ||
				modeledObject[property] !==
				passedState[property]) {
				return Promise.resolve(false);
			}
		}
		return Promise.resolve(true);
	};

	/**
	 * Save the passed state to the DB.
	 * @param {Object} passedState - State to be saved in the DB.
	 * @returns A promise resolving to an appropriate success message or an error message.
	 */
	this.save = function(passedState) {
		var self = this;

		if (this.initialized) {
			return this.verify(passedState)
			.then(function(data) {
				if (data) {
					//var passedProperties = Object.getOwnPropertyNames(passedState).sort();
					var objectToSave = {};
					for (var property in passedState) {
						objectToSave[property] = passedState[property];
					}

					var modeledObject = new self.model(objectToSave);

					return self.model.remove({})
					.then(function(data) {
						return modeledObject.save();
					});
				}
				else {
					return Promise.reject("Error: Object and schema do not match up.");
				}
			});
		}
		return Promise.reject('Error: Persister not initialized.');
	};

	/**
	 * Retrieve data from the DB.
	 * @returns The most recent entry to the DB, as a JavaScript object.
	 */
	this.retrieve = function() {
		if (this.initialized) {
			return this.model.find({}).exec()
			.then(function(data) {
				return Promise.resolve(data[0]);
			});
		}
		return Promise.reject('Error: Persister not initialized.');
	};
}

module.exports = mongoPersister;