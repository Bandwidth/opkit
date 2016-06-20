var Promise = require('bluebird');
var fsp = require('fs-promise');

/**
 * Default persister factory method. Returns a persister object.
 * @param {Schema} filepath - Directory to store the data
 * @param {Object} persisterPluginObject - For users who have written their own persister object.
 */

function defaultPersister(filepath) {

	var self = this;
	this.initialized = false;
	this.filepath = filepath;

	/**
	 * Check to see if the specified file path is available.
	 * @returns A promise appropriately resolving or rejecting.
	 */
	this.start = function() {
		return fsp.open(this.filepath + 'someFile.dat', 'wx+')
		.then(function() {
			self.initialized = true;
			return Promise.resolve('User has permissions to write to that file.');
		})
		.catch(function(err) {
			return Promise.reject('User does not have permissions to write to that folder.');
		});
	};

	/**
	 * Verify that the passed state is a valid JavaScript Object.
	 * @param {Object} passedState - State to be saved in the file.
	 * @returns A promise resolving to true or false.
	 */
	this.verify = function(passedState) {
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
	this.save = function(brain, package) {
		if (this.initialized) {
			return this.verify(brain)
			.then(function(data) {
				if (data) {
					return fsp.writeFile(this.filepath + package + '.dat', JSON.stringify(brain));
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
	this.retrieve = function(package) {
		if (this.initialized) {
			return fsp.readFile(this.filepath + package + '.dat', 'utf8')
			.then(function(data) { 
				return Promise.resolve(JSON.parse(data));
			});
		}
		return Promise.reject('Error: Persister not initialized.');
	};

}

module.exports = defaultPersister;