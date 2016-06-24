var assert = require('chai').assert;
var sinon = require('sinon');
var fsp = require('fs-promise');
var Promise = require('bluebird');
var result;

var writeStub = sinon.stub(fsp, 'writeFile', function(path, data) {
	return Promise.resolve('Saved.');
});

var ensureStub = sinon.stub(fsp, 'ensureFile', function(path) {
	return Promise.resolve(true);
});

var readStub = sinon.stub(fsp, 'readFile', function(path, encoding) {
	return Promise.resolve('{"data":1}');
});

var validateStub = sinon.stub(fsp, 'emptyDir', function(path, encoding) {
	if (path !== './inaccessiblePath') {
		return Promise.resolve(true);
	}
	return Promise.reject(false);
});

var opkit = require('../index');
var defaultPersisterFunc = opkit.Persister;

describe('Default Persister', function() {
	var persister;

	beforeEach(function() {
		result = undefined;
	});

	it('Successfully creates a persister object', function() {
		persister = new defaultPersisterFunc('./folderpath')
		assert.isOk(persister);
	});
	it('Does not let the user save if the persister has not been started', function() {
		return persister.save({obj : 2})
		.catch(function(err) {
			assert.equal(err, 'Error: Persister not initialized.');
		});
	});
	it('Does not let the user recover if the persister has not been started', function() {
		return persister.recover()
		.catch(function(err) {
			assert.equal(err, 'Error: Persister not initialized.');
		});
	});
	it('Does not let the persister initialize if the user does not have sufficient permissions', function() {
		var otherPersister = new defaultPersisterFunc('./inaccessiblePath');
		return otherPersister.start()
		.catch(function(err) {
			assert.equal(err, 'User does not have permissions to write to that folder.');
		});
	})
	it('The persister successfully initializes', function() {
		return persister.start()
		.then(function(data) {
			assert.equal(data, 'User has permissions to write to that file.')
		});
	});
	it('The persister cannot be initialized multiple times', function() {
		return persister.start()
		.catch(function(err) {
			assert.equal(err, 'Error: Persister already initialized.');
		});
	});
	it('Successfully attempts to save data', function() {
		return persister.save({obj: 1})
		.then(function(data) {
			assert.equal(data, 'Saved.');
		});
	});
	it('Successfully attempts to recover data', function() {
		return persister.recover()
		.then(function(data) {
			assert.isOk(data);
		});
	});
	it('Successfully handles reading a blank file', function() {
		readStub.restore();
		readStub = sinon.stub(fsp, 'readFile', function(path, encoding) {
			return Promise.resolve('');
		});
		return persister.recover()
		.then(function(data) {
			assert.isOk(data);
		});
	});
});
