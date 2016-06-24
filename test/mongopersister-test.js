var assert = require('chai').assert;
var sinon = require('sinon');
var MongoDB = require('mongodb-bluebird');
var Promise = require('bluebird');

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
var mongoPersisterFunc = opkit.MongoPersister;

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
	describe('The persister cannot be started multiple times', function() {
		it('Does not allow the user to initialize the persister twice', function() {
			return persister.start()
			.catch(function(err) {
				assert.equal(err, 'Error: Persister already initialized.');
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