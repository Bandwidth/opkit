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
					coverageFolder: 'coverage*', // will check both coverage folders and merge the coverage results
					check: {
						lines: 100,
						statements: 100
					}
				}
			}
		}
	});
	grunt.loadNpmTasks('grunt-mocha-istanbul');
	grunt.registerTask('default', ['mocha_istanbul:coverage']);

};