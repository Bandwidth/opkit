var assert = require('chai').assert;
var sinon = require('sinon');
var Promise = require('bluebird');
var mock = require('mock-require');

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

describe('Postgres Persister', function() {
	var persister;

	before (function() {
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

	describe('Persister not started', function() {
		it('Does not let the user save', function() {
			return persister.save({bool : 13}, 'collec')
			.catch(function(err) {
				assert.equal(err, 'Error: Persister not initialized.');
			});
		});
		it('Does not let the user retrieve data', function() {
			return persister.recover('collec')
			.catch(function(err) {
				assert.equal(err, 'Error: Persister not initialized.');
			});
		});
	});
	describe('Saving Data', function() {
		it('Properly saves data', function() {
			return persister.start()
			.then(function() {
				return persister.save({bool : 21}, 'collec')
			})
			.then(function(data) {
				assert.equal(data, 'Query Complete.');
			});
		});
		it('Properly saves data when table is not created', function() {
			persister.db.result = function(str) {
				return Promise.reject({code : '42P01'});
			};
			return persister.save({bool : 21}, 'collec')
			.catch(function(err) {
				assert.isOk(err);
			});
		});
		it('Does not save data on an unknown error', function() {
			persister.db.result = function(str) {
				return Promise.reject({code : 'somethingelse'});
			};
			return persister.save({bool : 15}, 'collec')
			.catch(function(err) {
				assert.isOk(err);
			});
		});
	});
	describe('Retrieving Data', function() {
		it('Properly retrieves data', function() {
			return persister.recover()
			.then(function(data) {
				assert.equal(data, 1);
			});
		});
		it('Returns an empty object if there is no data', function() {
			persister.db.any = function(str) {
				return Promise.resolve([]);
			};
			return persister.recover()
			.then(function(data) {
				assert.isOk(data);
			});
		});
		it('Still works if the table has not been created', function() {
			persister.db.any = function(str) {
				return Promise.reject({code : '42P01'});
			};
			return persister.recover()
			.catch(function(err) {
				assert.isOk(err);
			});
		});
		it('Does not recover data on an unknown error', function() {
			persister.db.any = function(str) {
				return Promise.reject({code : 'somethingelse'});
			};
			return persister.recover()
			.catch(function(err) {
				assert.isOk(err);
			});
		});
	});
	describe('Does not let the user start the persister twice', function(){
		it('Returns an error message', function() {
			return persister.start()
			.catch(function(err) {
				assert.equal(err, 'Error: Persister already initialized.');
			});
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