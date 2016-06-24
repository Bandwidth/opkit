var pgp = require('pg-promise')();
var parse = require('url-parse');
var _ = require('lodash');

function postgresPersister(POSTGRES_URL) {
	this.initialized = false;
	var self = this;

	/**
	 * Initialize a connection to Postgres.
	 * @returns A promise if the connection is successfully established.
	 */
	this.start = function() {
		if (!this.initialized) {
			var url = parse(POSTGRES_URL, true);
			var cn = {
				user : url.username,
				password : url.password,
				host : url.hostname,
				port : url.port,
				database : _.trim(url.pathname, '/'),
				ssl : true
			};
			this.db = pgp(cn);
			this.initialized = true;
			return Promise.resolve('Connected.');
		}
		return Promise.reject('Error: Persister already initialized.');
	};

	/**
	 * Save the passed state to Postgres.
	 * @param {Object} brain - State to be saved in Postgres.
	 * @param {String} script - Name of collection to save in Postgres.
	 * @returns A promise resolving to an appropriate success message or an error message.
	 */
	this.save = function(brain, script) {
		var saveToDB = function() {
			return self.db.result("delete from " + script)
			.then(function() {
				return self.db.none("insert into " + script + "(info) values($1)", [JSON.stringify(brain)]);
			});
		};

		if (this.initialized) {
			return saveToDB()
			.catch(function(err) {
				if (err.code === '42P01') { //Table does not exist
					return self.db.none("create table " + script + "(info text)")
					.then(function() {
						return saveToDB();
					});
				} else {
					return Promise.reject(err);
				}
			});
		}
		return Promise.reject('Error: Persister not initialized.');
	};

	/**
	 * Retrieve data from Postgres.
	 * @param {String} script - Name of collection to retrieve from in Postgres.
	 * @returns The most recent entry to Postgres, as a JavaScript object.
	 */
	this.recover = function(script) {
		var recoverFromDB = function() {
			return self.db.any("select * from " + script)
			.then(function(data) {
				if (data[0]) {
					return Promise.resolve(JSON.parse(data[0].info));
				} else {
					return Promise.resolve({});
				}
			});
		};

		if (this.initialized) {
			return recoverFromDB()
			.catch(function(err) {
				if (err.code === '42P01') { //Table does not exist
					return self.db.none("create table " + script + "(info text)")
					.then(function() {
						return recoverFromDB();
					});
				} else {
					return Promise.reject(err);
				}
			});
		}
		return Promise.reject('Error: Persister not initialized.');
	};
}

module.exports = postgresPersister;