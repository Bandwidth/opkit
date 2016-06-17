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

var opkit = require('../index');
var defaultPersisterFactory = opkit.Persister;
var mongoPersisterFactory = opkit.MongoPersister;

describe('Persisters', function() {

	beforeEach(function() {
		result = undefined;
	});

	describe('Default Persister', function() {
		var persister;

		it('Successfully returns a persister object', function() {
			return defaultPersisterFactory('somepath')
			.then(function(returnedPersister) {
				persister = returnedPersister;
				assert.isOk(persister);
			});
		});
		it('Successfully returns a persister object using a specified filepath', function() {
			return defaultPersisterFactory()
			.catch(function(err) {
				assert.equal(err, "No filepath specified.");
			});
		});
		it('Successfully attempts to save data', function() {
			return persister.save({obj: 1})
			.then(function(data) {
				assert.equal(data, 'Saved.');
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
				return mongoPersisterFactory(schema, 'notauri', 'collection')
				.then(function(returnedPersister) {
					persister = returnedPersister;
					assert.isOk(persister);
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