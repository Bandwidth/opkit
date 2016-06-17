var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var _ = require('lodash');
var Promise = require('bluebird');

/**
 * Mongo persister factory method. Returns a mongo persister object.
 * @param {Schema} schema - The specified mongoose schema to use.
 * @param {String} MONGODB_URI - URI of MongoDB.
 * @param {String} collectionName - Name of collection on MongoDB.
 */
function mongoPersisterFactory(schema, MONGODB_URI, collectionName) {
	return new Promise(function(resolve, reject) { 
		var persister = {};
		var self = persister;

		/**
		 * Initialize a connection to the MongoDB. Also create a model based on the given collection name and schema.
		 * @returns A promise.
		 */
		persister.start = function() {
			this.db = mongoose.createConnection(MONGODB_URI);
			schema.timestamp = Number;
			this.model = this.db.model(collectionName, schema);
			return Promise.resolve("Connection created.");
		};

		/**
		 * Verify that the passed state conforms to the model schema.
		 * @param {Object} passedState - State to be saved in the DB.
		 * @returns A promise resolving to true or false.
		 */
		persister.verify = function(passedState) {
			var modeledObject = new this.model(passedState);

			var passedProperties = Object.getOwnPropertyNames(passedState).sort();
			for (var property in passedProperties) {
				if (!modeledObject[passedProperties[property]] ||
					modeledObject[passedProperties[property]] !==
					passedState[passedProperties[property]]) {
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
		persister.save = function(passedState) {
			return this.verify(passedState)
			.then(function(data) {
				if (data) {
					var passedProperties = Object.getOwnPropertyNames(passedState).sort();
					var objectToSave = {};
					for (var property in passedProperties) {
						objectToSave[passedProperties[property]] = passedState[passedProperties[property]];
					}

					objectToSave.timestamp = (new Date()).getTime();
					var modeledObject = new self.model(objectToSave);

					return modeledObject.save();
				}
				else {
					return Promise.reject("Error: Object and schema do not match up.");
				}
			});
		};

		/**
		 * Retrieve data from the DB.
		 * @returns The most recent entry to the DB, as a JavaScript object.
		 */
		persister.retrieve = function() {
			console.log(this.model);
			return this.model.find({}).sort('-timestamp').exec()
			.then(function(data) {
				return Promise.resolve(data[0]);
			});
		}

		resolve(persister);
	});
}

module.exports = mongoPersisterFactory;