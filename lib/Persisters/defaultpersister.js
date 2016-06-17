var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));

/**
 * Default persister factory method. Returns a persister object.
 * @param {Schema} filepath - Filepath for where to save the data.
 * @param {Object} persisterPluginObject - For users who have written their own persister object.
 */
function defaultPersisterFactory(filepath, persisterPluginObject) {
	return new Promise(function(resolve, reject) { 

		if (persisterPluginObject) {
			resolve(persisterPluginObject);
		}

		var persister = {};
		var self = persister;

		if (!filepath) {
			filepath = 'datastore.txt';
		}

		/**
		 * Save the passed state to the file.
		 * @param {Object} passedState - State to be saved in the file.
		 * @returns A promise resolving to an appropriate success message or an error message.
		 */
		persister.save = function(passedState) {
			return fs.writeFileAsync(filepath, JSON.stringify(passedState));
		};

		/**
		 * Retrieve data from the file.
		 * @returns The most recent entry to the file, as a JavaScript object.
		 */
		persister.retrieve = function() {
			return fs.readFileAsync(filepath, 'utf8')
			.then(function(data) { 
				return Promise.resolve(JSON.parse(data));
			})
		};

		resolve(persister);
	});
}

module.exports = defaultPersisterFactory;