var assert = require('chai').assert;
var sinon = require('sinon');
var Promise = require('bluebird');
var mock = require('mock-require');

describe('Postgres Persister', function() {
	var persister;
	var result;

	before (function() {
		mock('pg-promise', function() {
			return function pgp(connection) {
				return {
					result : function(str) {
						return Promise.resolve('Deleted.');
					},
					none : function(str) {
						return Promise.resolve('Query Complete.');
					},
					any : function(str) {
						return Promise.resolve([{info : "1"}]);
					},
					config : connection
				};
			};
		});

		require.searchCache = function (moduleName, callback) {
		    var mod = require.resolve(moduleName);

		    if (mod && ((mod = require.cache[mod]) !== undefined)) {
		        (function run(mod) {
		            mod.children.forEach(function (child) {
		                run(child);
		            });
		            callback(mod);
		        })(mod);
		    }
		};

		require.uncache = function (moduleName) {
		    require.searchCache(moduleName, function (mod) {
		        delete require.cache[mod.id];
		    });

		    Object.keys(module.constructor._pathCache).forEach(function(cacheKey) {
		        if (cacheKey.indexOf(moduleName)>0) {
		            delete module.constructor._pathCache[cacheKey];
		        }
		    });
		};

		require.uncache('../lib/Persisters/postgrespersister.js');
		var postgresPersisterFunc = require('../lib/Persisters/postgrespersister.js');

		persister = new postgresPersisterFunc('postgres://username:password@host:5432/database');
	});

	afterEach(function() {
		result = undefined;
	});

	describe('Persister not started', function() {

		describe('Saving', function() {
			before(function() {
				return persister.save({bool : 13}, 'collec')
				.catch(function(err) {
					result = err;
				});
			});

			it('Does not let the user save', function() {
				assert.equal(result, 'Error: Persister not initialized.');
			});
		});

		describe('Recovering', function() {
			before(function() {
				return persister.recover('collec')
				.catch(function(err) {
					result = err;
				});
			});

			it('Does not let the user retrieve data', function() {
				assert.equal(result, 'Error: Persister not initialized.');
			});
		});
	});

	describe('Saving Data', function() {

		describe('Save', function() {
			before(function() {
				return persister.start()
				.then(function() {
					return persister.save({bool : 21}, 'collec')
				})
				.then(function(data) {
					result = data;
				});
			});

			it('Properly saves data', function() {
				assert.equal(result, 'Query Complete.');
			});
		});

		describe('Save to non-existent table', function() {
			before(function() {
				persister.db.result = function(str) {
					return Promise.reject({code : '42P01'});
				};
				persister.db.none = function(str) {
					this.result = function(str) {
						return Promise.resolve('Deleted.');
					};
					return Promise.resolve('Query Complete.');
				};
				return persister.save({bool : 21}, 'collec')
				.then(function(data) {
					result = data;
				});
			});

			it('Properly saves data when table is not created', function() {
				assert.equal(result, 'Query Complete.');
			});
		});

		describe('Save on an unknown error', function() {
			before(function() {
				persister.db.result = function(str) {
					return Promise.reject({code : 'somethingelse'});
				};
				return persister.save({bool : 15}, 'collec')
				.catch(function(err) {
					result = err;
				});
			});

			it('Does not save data on an unkown error', function() {
				assert.equal(result.code, 'somethingelse');
			});
		});
	});

	describe('Retrieving Data', function() {

		describe('Recover', function() {
			before(function() {
				return persister.recover()
				.then(function(data) {
					result = data;
				});
			});

			it('Properly retrieves data', function() {
				assert.equal(result, 1);
			});
		});

		describe('Recover with no data available', function() {
			before(function() {
				persister.db.any = function(str) {
					return Promise.resolve([]);
				};
				return persister.recover()
				.then(function(data) {
					result = data;
				});
			});

			it('Returns an empty object if there is no data', function() {
				assert.isOk(result);
			});
		});

		describe('Recover from non-existent table', function() {
			before(function() {
				persister.db.any = function(str) {
					return Promise.reject({code : '42P01'});
				};
				persister.db.none = function(str) {
					this.any = function(str) {
						return Promise.resolve([]);
					};
					return Promise.resolve('Query Complete.');
				};
				return persister.recover()
				.then(function(data) {
					result = data;
				});
			});

			it('Still works if the table has not been created', function() {
				assert.isOk(result);
			});
		});

		describe('Recover with an unknown error', function() {
			before(function() {
				persister.db.any = function(str) {
					return Promise.reject({code : 'somethingelse'});
				};
				persister.db.none = function(str) {
					return Promise.resolve('Query Complete.');
				};
				return persister.recover()
				.catch(function(err) {
					result = err;
				});
			});

			it('Does not recover data on an unkown error', function() {
				assert.equal(result.code, 'somethingelse');
			});
		});
	});

	describe('Does not let the user start the persister twice', function() {
		before(function() {
			return persister.start()
			.catch(function(err) {
				result = err;
			});
		});

		it('Returns an error message', function() {
			assert.equal(result, 'Error: Persister already initialized.');
		});
	});

	describe('Configuration', function() {
		it('The URL was properly parsed', function() {
			assert.equal(persister.db.config.user, 'username');
			assert.equal(persister.db.config.password, 'password');
			assert.equal(persister.db.config.host, 'host');
			assert.equal(persister.db.config.port, '5432');
			assert.equal(persister.db.config.database, 'database');
		});
	});
});