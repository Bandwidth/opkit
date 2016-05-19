module.exports = function(grunt){
	grunt.initConfig({
		mocha_istanbul: {
			coverage: {
					src: 'test', // a folder works nicely
			}
		},
		istanbul_check_coverage: {
			default: {
				options: {
					coverage : true,
					reporter: 'spec',
					coverageFolder: 'coverage', // will check both coverage folders and merge the coverage results
					check: {
						lines: 100,
						branches: 100,
						statements: 100
					}
				}
			}
		},
		jsdoc : {
			default : {
				src: ['lib/*.js'],
				options: {
					destination: 'out'
				}
			}
		},
		jshint: {
			src: ['lib/*.js'],
			jshintrc: true
		},
	});
	grunt.loadNpmTasks('grunt-mocha-istanbul');
	grunt.loadNpmTasks('grunt-jsdoc');
	grunt.loadNpmTasks('grunt-jslint');
	grunt.registerTask('default', ['jslint', 'mocha_istanbul:coverage', 'istanbul_check_coverage']);
	grunt.registerTask('doc', ['jsdoc']);
};
