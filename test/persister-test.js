var assert = require('chai').assert;
var sinon = require('sinon');
var MongoDB = require('mongodb-bluebird');
var redis = require('redis');
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

var redisStub = sinon.stub(redis, 'createClient', function() {
	return {
		delAsync : function() {
			return Promise.resolve('Deleted.');
		},
		hsetAsync : function() {
			return Promise.resolve('Saved.');
		},
		hkeysAsync : function() {
			return Promise.resolve([1]);
		}
	};
})

var opkit = require('../index');
var defaultPersisterFunc = opkit.Persister;
var mongoPersisterFunc = opkit.MongoPersister;
var redisPersisterFunc = opkit.RedisPersister;

describe('Persisters', function() {

	beforeEach(function() {
		result = undefined;
	});

	describe('Default Persister', function() {
		var persister;

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
					assert.equal(data, 'Inserted.');
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
					assert.isOk(data);
				});
			});
		});
	});
	describe('Redis Persister', function() {
		var persister;
		describe('Calling the Constructor', function() {
			it('Successfully returns a new persister object', function() {
				persister = new redisPersisterFunc('notaurl');
				assert.isOk(persister);
			});
		});
		describe('Persister not started', function() {
			it('Should not let the user save data', function() {
				return persister.save({bool: 14}, 'somecollection')
				.catch(function(err) {
					assert.equal(err, 'Error: Persister not initialized.');
				});
			});
			it('Should not let the user retrieve data', function() {
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
					return persister.save({bool: 12}, 'collec')
				})
				.then(function(data) {
					assert.equal(data, 'Saved.');
				});
			});
		});
		describe('Retrieving Data', function() {
			it('Successfully attempts to retrieve data', function() {
				return persister.recover('collec')
				.then(function(data) {
					assert.equal(data, 1);
				});
			});
		});
		describe('If no data is available an empty object is returned', function() {
			it('Returns an empty JavaScript Object', function() {
				persister.client.hkeysAsync = function() {
					return Promise.resolve([]);
				};
				return persister.recover('not a collection')
				.then(function(data) {
					assert.isOk(data);
				});
			});
		});
	});
});
