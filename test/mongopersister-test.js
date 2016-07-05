var assert = require('chai').assert;
var sinon = require('sinon');
var MongoDB = require('mongodb-bluebird');
var Promise = require('bluebird');

describe('Mongo Persister', function() {

	var mongoPersisterFunc;
	var result;

	before(function() {
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

		var opkit = require('../index');
		mongoPersisterFunc = opkit.MongoPersister;
	});

	afterEach(function() {
		result = undefined;
	});

	var persister;

	describe('Calling the Constructor', function() { 
		before(function() {
			persister = new mongoPersisterFunc('notauri');
		});

		it('Successfully returns a persister object', function() {
			assert.isOk(persister);
		});
	});

	describe('Persister not started', function() {

		describe('Saving', function() {
			before(function() {
				return persister.save({bool : 32}, 'somecollection')
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

	describe('Saving Data', function() {
		before(function() {
			return persister.start()
			.then(function() { 
				return persister.save({bool : 1})
			})
			.then(function(data) {
				result = data;
			});
		});

		it('Successfully attempts to save data', function() {
			assert.equal(result, 'Inserted.');
		});
	});

	describe('Retrieving Data', function() {
		before(function() {
			return persister.recover()
			.then(function(data) {
				result = data;
			});
		});

		it('Successfully recovers data', function() {
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
			persister.db.collection = function() {
				return {
					find : function() {
						return Promise.resolve([]);
					}
				};
			};
			return persister.recover('no collection')
			.then(function(data) {
				result = data;
			});
		});

		it('Returns an empty JavaScript object', function() {
			assert.isOk(result);
		});
	});
});