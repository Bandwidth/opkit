var Promise = require('bluebird');
var fsp = require('fs-promise');

/**
 * Default persister factory method. Returns a persister object.
 * @param {Schema} filepath - Filepath for where to save the data.
 * @param {Object} persisterPluginObject - For users who have written their own persister object.
 */
function defaultPersisterFactory(filepath) {
	return new Promise(function(resolve, reject) { 

		var persister = {};
		var self = persister;
		persister.initialized = false;

		if (!filepath) {
			reject("No filepath specified.");
		}

		/**
		 * Check to see if the specified file path is available.
		 * @returns A promise appropriately resolving or rejecting.
		 */
		persister.start = function() {
			return fsp.access(filepath, fsp.F_OK)
			.then(function() {
				return Promise.reject('File already exists.');
			})
			.catch(function(err) {
				self.initialized = true;
				return Promise.resolve('No problems accessing filepath.');
			});
		};

		/**
		 * Verify that the passed state is a valid JavaScript Object.
		 * @param {Object} passedState - State to be saved in the file.
		 * @returns A promise resolving to true or false.
		 */
		persister.verify = function(passedState) {
			if (passedState !== null && typeof(passedState) === 'object') {
				return Promise.resolve(true);
			}
			else return Promise.resolve(false);
		};

		/**
		 * Save the passed state to the file.
		 * @param {Object} passedState - State to be saved in the file.
		 * @returns A promise resolving to an appropriate success message or an error message.
		 */
		persister.save = function(passedState) {
			if (this.initialized) {
				return this.verify(passedState)
				.then(function(data) {
					if (data) {
						return fsp.writeFile(filepath, JSON.stringify(passedState));
					} else {
						return Promise.reject('Error: Not a valid object.');
					}
				});
			} 
			return Promise.reject('Error: Persister not initialized.');
		};

		/**
		 * Retrieve data from the file.
		 * @returns The most recent entry to the file, as a JavaScript object.
		 */
		persister.retrieve = function() {
			if (this.initialized) {
				return fsp.readFile(filepath, 'utf8')
				.then(function(data) { 
					return Promise.resolve(JSON.parse(data));
				});
			}
			return Promise.reject('Error: Persister not initialized.');
		};

		resolve(persister);
	});
}

module.exports = defaultPersisterFactory;