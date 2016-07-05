var assert = require('chai').assert;
var sinon = require('sinon');
var redis = require('redis');
var Promise = require('bluebird');

describe('Redis Persister', function() {

	var persister;
	var result;
	var redisPersisterFunc;

	before(function() {
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
		redisPersisterFunc = opkit.RedisPersister;
	});

	afterEach(function() {
		result = undefined;
	});

	describe('Calling the Constructor', function() {
		before(function() {
			persister = new redisPersisterFunc('notaurl');
		})

		it('Successfully returns a new persister object', function() {
			assert.isOk(persister);
		});
	});

	describe('Persister not started', function() {

		describe('Saving', function() {
			before(function() {
				return persister.save({bool: 14}, 'somecollection')
				.catch(function(err) {
					result = err;
				});
			});

			it('Should not let the user save data', function() {
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

			it('Should not let the user retrieve data', function() {
				assert.equal(result, 'Error: Persister not initialized.');
			});
		});
	});

	describe('Saving Data', function() {
		before(function() {
			return persister.start()
			.then(function() {
				return persister.save({bool: 12}, 'collec')
			})
			.then(function(data) {
				result = data;
			});
		});

		it('Successfully attempts to save data', function() {
			assert.equal(result, 'Saved.');
		});
	});

	describe('Retrieving Data', function() {
		before(function() {
			return persister.recover('collec')
			.then(function(data) {
				result = data;
			});
		});

		it('Successfully attempts to retrieve data', function() {
			assert.equal(result, 1);
		});
	});

	describe('The persister cannot be started multiple times', function() {
		before(function() {
			return persister.start()
			.catch(function(err) {
				result = err;
			});
		});

		it('Does not allow the user to initialize the persister twice', function() {
			assert.equal(result, 'Error: Persister already initialized.');
		});
	});

	describe('If no data is available an empty object is returned', function() {
		before(function() {
			persister.client.hkeysAsync = function() {
				return Promise.resolve([]);
			};
			return persister.recover('not a collection')
			.then(function(data) {
				result = data;
			});
		});

		it('Returns an empty JavaScript Object', function() {
			assert.isOk(result);
		});
	});

	describe('The client quits on an error', function() {
		before(function() {
			return persister.client.onAsync('error')
			.catch(function(err) {
				result = err;
			});
		});

		it('Exits on an error', function() {
			assert.equal(result, 'Error.');
		});
	});
});