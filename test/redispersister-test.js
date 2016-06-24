var assert = require('chai').assert;
var sinon = require('sinon');
var redis = require('redis');
var Promise = require('bluebird');

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
		},
		end : function() {
			return Promise.resolve('Connection exited.');
		},
		onAsync : function(str) {
			if (str === 'error') {
				return Promise.reject('Error.');
			}
			return Promise.resolve();
		}
	};
});

var opkit = require('../index');
var redisPersisterFunc = opkit.RedisPersister;

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
	describe('The persister cannot be started multiple times', function() {
		it('Does not allow the user to initialize the persister twice', function() {
			return persister.start()
			.catch(function(err) {
				assert.equal(err, 'Error: Persister already initialized.');
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
	describe('The client quits on an error', function() {
		it ('Exits on an error', function() {
			return persister.client.onAsync('error')
			.catch(function(err) {
				assert.equal(err, 'Error.');
			});
		});
	});
});