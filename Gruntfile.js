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
			default : {
				src: ['lib/*.js'],
				jshintrc: true
			}
		},
	});
	grunt.loadNpmTasks('grunt-mocha-istanbul');
	grunt.loadNpmTasks('grunt-jsdoc');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.registerTask('default', ['jshint', 'mocha_istanbul:coverage', 'istanbul_check_coverage']);
	grunt.registerTask('doc', ['jsdoc']);
};
