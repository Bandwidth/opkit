var assert = require('chai').assert;
var sinon = require('sinon');
var mongoose = require('mongoose');
var fsp = require('fs-promise');
var Promise = require('bluebird');
var result;

var mongooseStub = sinon.stub(mongoose, 'createConnection', function() {
	var returnMe = {};
	returnMe.model = function(args){
		var constructorToReturn = function(state){
			this.bool = 1;
			this._id = 124897234;

			// and so on
			// if we want to call this as a constructor
			// we call as constructor on line 36 of mongopersister.			
		}
		constructorToReturn.prototype.save = function(args){
			return Promise.resolve('Saved.');
		}

		constructorToReturn.find = function(args) {
			return {
				sort : function(args) {
					return {
						exec : function() {
							return Promise.resolve(['1']);
						}
					};
				}
			};
		}

		return constructorToReturn;
	}
	return returnMe;
});

var writeStub = sinon.stub(fsp, 'writeFile', function(path, data) {
	return Promise.resolve('Saved.');
});

var readStub = sinon.stub(fsp, 'readFile', function(path, encoding) {
	return Promise.resolve('{"data":1}');
});

var validateStub = sinon.stub(fsp, 'access', function(path, state) {
	if (path !== 'existingpath.txt') {
		return Promise.reject('File does not exist.');
	}
	return Promise.resolve('File exists.');
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

		it('Successfully returns a persister object', function() {
			return defaultPersisterFunc('somepath')
			.then(function(returnedPersister) {
				persister = returnedPersister;
				assert.isOk(persister);
			});
		});
		it('Does not return a persister if no filepath is specified.', function() {
			return defaultPersisterFunc()
			.catch(function(err) {
				assert.equal(err, "No filepath specified.");
			});
		});
		it('Does not let the user save if the persister has not been started', function() {
			return persister.save({obj : 2})
			.catch(function(err) {
				assert.equal(err, 'Error: Persister not initialized.');
			});
		});
		it('Does not let the user retrieve if the persister has not been started', function() {
			return persister.retrieve()
			.catch(function(err) {
				assert.equal(err, 'Error: Persister not initialized.');
			});
		});
		it('Does not let the persister initialize if the file already exists', function() {
			return defaultPersisterFunc('existingpath.txt')
			.then(function(returnedPersister) {
				return returnedPersister.start();
			})
			.catch(function(err) {
				assert.equal(err, 'File already exists.');
			});
		})
		it('The persister successfully initializes', function() {
			return persister.start()
			.then(function(data) {
				assert.equal(data, 'No problems accessing filepath.')
			});
		});
		it('Successfully attempts to save data', function() {
			return persister.save({obj: 1})
			.then(function(data) {
				assert.equal(data, 'Saved.');
			});
		});
		it('Should not save data that is not an object', function() {
			return persister.save(3)
			.catch(function(err) {
				assert.equal(err, 'Error: Not a valid object.');
			});
		});
		it('Successfully attempts to retrieve data', function() {
			return persister.retrieve()
			.then(function(data) {
				assert.isOk(data);
			});
		});
	});

	describe('Mongo Persister', function() {

		var persister;

		describe('Calling the Factory Method', function() { 
			it('Successfully returns a persister object', function() {
				var schema = {
					num : Number,
				};
				return mongoPersisterFunc(schema, 'notauri', 'collection')
				.then(function(returnedPersister) {
					persister = returnedPersister;
					assert.isOk(persister);
				});
			});
		});
		describe('Persister not started', function() {
			it('Does not let the user save if the persister has not been started', function() {
				return persister.save({bool : 32})
				.catch(function(err) {
					assert.equal(err, 'Error: Persister not initialized.');
				});
			});
			it('Does not let the user retrieve if the persister has not been started', function() {
				return persister.retrieve()
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

		describe('Saving Invalid Data', function() {
			it('Does not save the data', function() {
				return persister.save({bool : 'a'})
				.catch(function(err) {
					assert.equal(err, "Error: Object and schema do not match up.");
				});
			});
		});

		describe('Retrieving Data', function() {
			it('Successfully retrieves data', function() {
				return persister.retrieve()
				.then(function(data) {
					assert.equal(data, 1);
				});
			});
		});
	});
});