var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var _ = require('lodash');
var Promise = require('bluebird');

function mongoPersisterFactory(schema, MONGODB_URI, collectionName) {
	return new Promise(function(resolve, reject) { 
		var persister = {};
		var self = persister;

		persister.start = function() {
			this.db = mongoose.createConnection(MONGODB_URI);
			schema.timestamp = Number;
			this.model = this.db.model(collectionName, schema);
			return Promise.resolve("Connection created.");
		}

		persister.verify = function(passedState) {
			var modeledObject = new this.model(passedState);

			var passedProperties = Object.getOwnPropertyNames(passedState).sort();
			for (var property in passedProperties) {
				if (!modeledObject[passedProperties[property]] ||
					!modeledObject[passedProperties[property]] ===
					passedState[passedProperties[property]]) {
						return Promise.resolve(false);
				}
			}
			return Promise.resolve(true);
		}

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
		}

		persister.retrieve = function() {
			return this.model.find({}).sort('-timestamp').exec()
			.then(function(data) {
				return Promise.resolve(data[0]);
			})
			.catch(function(data) {
				return Promise.resolve("Error: Error retrieving data.");
			});
		}

		resolve(persister);
	});
};

module.exports = mongoPersisterFactory;