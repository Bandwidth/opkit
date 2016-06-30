var assert = require('chai').assert;
var sinon = require('sinon');
var fsp = require('fs-promise');
var Promise = require('bluebird');

describe('Default Persister', function() {

	var persister;
	var result;
	var defaultPersisterFunc;
	var readStub;

	before(function() {
		var writeStub = sinon.stub(fsp, 'writeFile', function(path, data) {
			return Promise.resolve('Saved.');
		});

		var ensureStub = sinon.stub(fsp, 'ensureFile', function(path) {
			return Promise.resolve(true);
		});

		readStub = sinon.stub(fsp, 'readFile', function(path, encoding) {
			return Promise.resolve('{"data":1}');
		});

		var validateStub = sinon.stub(fsp, 'emptyDir', function(path, encoding) {
			if (path !== './inaccessiblePath') {
				return Promise.resolve(true);
			}
			return Promise.reject(false);
		});

		var opkit = require('../index');
		defaultPersisterFunc = opkit.Persister;
	});

	afterEach(function() {
		result = undefined;
	});

	describe('Constructor', function() {
		before(function() {
			persister = new defaultPersisterFunc('./folderpath');
		});

		it('Successfully creates a persister object', function() {
			assert.isOk(persister);
		});
	});

	describe('Persister not started', function() {
		describe('Saving', function() {
			before(function() {
				return persister.save({obj : 2})
				.catch(function(err) {
					result = err;
				});
			});

			it('Does not let the user save if the persister has not been started', function() {
				assert.equal(result, 'Error: Persister not initialized.');
			});
		});

		describe('Recovering', function() {
			before(function() {
				return persister.recover()
				.catch(function(err) {
					result = err;
				});
			});

			it('Does not let the user recover if the persister has not been started', function() {
				assert.equal(result, 'Error: Persister not initialized.');
			});
		});
	});

	describe('Initialization', function() {
		before(function() {
			var otherPersister = new defaultPersisterFunc('./inaccessiblePath');
			return otherPersister.start()
			.catch(function(err) {
				result = err;
			});
		});

		it('Does not let the persister initialize if the user does not have sufficient permissions', function() {
			assert.equal(result, 'User does not have permissions to write to that folder.');
		});
	});

	describe('Successful initialization', function() {
		before(function() {
			return persister.start()
			.then(function(data) {
				result = data;
			});
		});

		it('The persister successfully initializes', function() {
			assert.equal(result, 'User has permissions to write to that file.');
		});
	});

	describe('The persister cannot be started multiple times', function() {
		before(function() {
			return persister.start()
			.catch(function(err) {
				result = err;
			});
		});

		it('Does not allow the persister to re-initialize', function() {
			assert.equal(result, 'Error: Persister already initialized.');
		});
	});

	describe('Save', function() {
		before(function() {
			return persister.save({obj: 1})
			.then(function(data) {
				result = data;
			});
		});

		it('Successfully attempts to save data', function() {
			assert.equal(result, 'Saved.');
		});
	});

	describe('Recover', function() {
		before(function() {
			return persister.recover()
			.then(function(data) {
				result = data;
			});
		});

		it('Successfully attempts to recover data', function() {
			assert.isOk(result);
		});
	});

	describe('Recover from a blank file', function() {
		before(function() {
			readStub.restore();
			readStub = sinon.stub(fsp, 'readFile', function(path, encoding) {
				return Promise.resolve('');
			});
			return persister.recover()
			.then(function(data) {
				result = data;
			});
		});

		it('Successfully handles reading a blank file', function() {
			assert.isOk(result);
		});
	});
});
