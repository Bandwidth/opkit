var pgp = require('pg-promise')();

function postgresPersister(POSTGRES_URL) {
	this.initialized = false;
	var self = this;

	/**
	 * Initialize a connection to Postgres.
	 * @returns A promise if the connection is successfully established.
	 */
	this.start = function() {
		if (!this.initialized) {
			var cn = {
				user : POSTGRES_URL.match(/([/])([/])(.*)(:)/)[3]
							.match(/(.*)([:])/)[1],
				password : POSTGRES_URL.match(/([:])(.*)([@])/)[2]
							.match(/([:])(.*)/)[2],
				host : POSTGRES_URL.match(/([@])(.*)([:])/)[2],
				port : POSTGRES_URL.match(/([:])([1-9]+)([/])/)[2],
				database : POSTGRES_URL.match(/([1-9])([/])(.*)($)/)[3],
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
				if (err.code === '42P01') //Table does not exist
				{
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
		if (this.initialized) {
			return this.db.any("select * from " + script)
			.then(function(data) {
				return Promise.resolve(JSON.parse(data[0].info));
			});
		}
		return Promise.reject('Error: Persister not initialized.');
	};
}

module.exports = postgresPersister;