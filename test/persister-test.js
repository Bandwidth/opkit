var assert = require('chai').assert;
var sinon = require('sinon');
var MongoDB = require('mongodb-bluebird');
var fsp = require('fs-promise');
var Promise = require('bluebird');
var result;

var mongoStub = sinon.stub(MongoDB, 'connect', function() {
	return Promise.resolve({
		collection : function() {
			return {
				remove : function() {
					return Promise.resolve('Removed.');
				},
				insert : function() {
					return Promise.resolve('Inserted.');
				},
				find : function(args) {
					return Promise.resolve([1]);
				}
			};
		}
	});
});

var writeStub = sinon.stub(fsp, 'writeFile', function(path, data) {
	return Promise.resolve('Saved.');
});

var readStub = sinon.stub(fsp, 'readFile', function(path, encoding) {
	return Promise.resolve('{"data":1}');
});

var validateStub = sinon.stub(fsp, 'open', function(path, encoding) {
	console.log(path);
	if (path !== 'existingpathsomeFile.dat') {
		return Promise.resolve(true);
	}
	return Promise.reject(false);
});

var opkit = require('../index');
var defaultPersisterFunc = opkit.Persister;
var mongoPersisterFunc = opkit.MongoPersister;

describe('Persisters', function() {

	beforeEach(function() {
		result = undefined;
	});

	describe('Default Persister', function() {
		var persister;

		it('Successfully creates a persister object', function() {
			persister = new defaultPersisterFunc('/folderpath/')
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
			var otherPersister = new defaultPersisterFunc('existingpath');
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
	});

	describe('Mongo Persister', function() {
		var persister;
		describe('Calling the Constructor', function() { 
			it('Successfully returns a persister object', function() {
				persister = new mongoPersisterFunc('notauri');
				assert.isOk(persister);
			});
		});
		describe('Persister not started', function() {
			it('Does not let the user save if the persister has not been started', function() {
				return persister.save({bool : 32}, 'somecollection')
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
		});
		describe('Saving Data', function() {
			it('Successfully attempts to save data', function() {
				return persister.start()
				.then(function() { 
					return persister.save({bool : 1})
				})
				.then(function(data) {
					assert.equal(data, 'Saved.');
				});
			});
		});
		describe('Retrieving Data', function() {
			it('Successfully recovers data', function() {
				return persister.recover()
				.then(function(data) {
					assert.equal(data, 1);
				});
			});
		});
		describe('If no data is available an empty object is returned', function() {
			it('Returns an empty JavaScript object', function() {
				persister.db.collection = function() {
					return {
						find : function() {
							return Promise.resolve([]);
						}
					};
				};
				return persister.recover('no collection')
				.then(function(data) {
					console.log(data);
					assert.isOk(data);
				});
			});
		});
	});
});