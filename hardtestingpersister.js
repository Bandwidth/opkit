var opkit = require('./index');

var persister;
var schema = {
	bool : Number
};

var defaultPersisterFactory = opkit.Persister;
var mongoPersisterFactory = opkit.MongoPersister;


defaultPersisterFactory()
.then(function(returnedPersister) {
	persister = returnedPersister;
	persister.save({bool : 24})
	.then(function() {
		persister.retrieve()
		.then(function(data) {
			console.log(data);
		});
	});
});

/*
mongoPersisterFactory(schema, 'mongodb://heroku_qhlw2rv5:sh3k7ekkk9t4df1o6d7o61kdvk@ds021663.mlab.com:21663/heroku_qhlw2rv5',
	'acollection')
	.then(function(returnedPersister) { 
		persister = returnedPersister;
		persister.start()
		.then(function() {
			persister.save({bool : 95})
			.then(function() {
				persister.retrieve()
				.then(function(data) {
					console.log(data);
				});
			});
		});
	});
	*/

/*
persisterFactory()
.then(function(persisterFunc) { 
	persisterFunction = persisterFunc;
	persisterFunction()
	.then(function(returnedPersister) {
		persister = returnedPersister;
		persister.save({bool : 20})
		.then(function() {
			persister.retrieve()
			.then(function(data) {
				console.log(data);
			});
		});
	});
});
*/

/*
persisterFactory('mongo')
.then(function(persisterFunc) { 
	persisterFunction = persisterFunc;
	persisterFunction(schema, 'mongodb://heroku_qhlw2rv5:sh3k7ekkk9t4df1o6d7o61kdvk@ds021663.mlab.com:21663/heroku_qhlw2rv5',
		'testcollection')
	.then(function(returnedPersister) {
		persister = returnedPersister;
		persister.start()
		.then(function() {
			console.log('ok');
			persister.verify({bool: 20});
		});
	});
});
*/


/*
persisterFactory(schema, 'mongodb://heroku_qhlw2rv5:sh3k7ekkk9t4df1o6d7o61kdvk@ds021663.mlab.com:21663/heroku_qhlw2rv5',
	'testcollection')
.then(function(returnedPersister) {
	persister = returnedPersister;
	persister.start()
	.then(function() {
		persister.save({bool : '11'})
	})
	.then(function() {
		persister.retrieve()
		.then(function(data) {
			console.log(data);
		})
	})
});
*/
