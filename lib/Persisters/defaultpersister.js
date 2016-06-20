var Promise = require('bluebird');
var fsp = require('fs-promise');

function getPersister(filepath) {

	var persister = {};
	persister.initialized = false;

	if (!filepath) {
		return Promise.reject("No filepath specified.");
	}

	/**
	 * Check to see if the specified file path is available.
	 * @returns A promise appropriately resolving or rejecting.
	 */
	persister.start = function() {
		var self = this;
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
		return Promise.resolve(false);
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

	return Promise.resolve(persister);
}

module.exports = getPersister;