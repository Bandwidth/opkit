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
				options : {
				  "smarttabs"     : true,
				  "bitwise"       : true,
				  "curly"         : true,
				  "eqeqeq"        : true,
				  "es3"           : false,
				  "forin"         : false,
				  "immed"         : true,
				  "indent"        : 4,
				  "noarg"         : true,
				  "noempty"       : true,
				  "nonew"         : false,
				  "trailing"      : true,
				  "maxparams"     : 5,
				  "maxdepth"      : 4,
				  "maxstatements" : false,
				  "maxlen"        : 120,
				  "node"          : true,
				  "quotmark"      : false,
				  "force"         : false,
				  "ignores"       : [ "node_modules/**/*.js" ],
				  "expr"          : true,
				  "globals"       : {
				    "describe"    : false,
				    "it"          : false,
				    "before"      : false,
				    "beforeEach"  : false,
				    "after"       : false,
				    "afterEach"   : false,
					"unescape"    : false
				  }
				}
			}
		},
	});
	grunt.loadNpmTasks('grunt-mocha-istanbul');
	grunt.loadNpmTasks('grunt-jsdoc');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.registerTask('default', ['jshint', 'mocha_istanbul:coverage', 'istanbul_check_coverage']);
	grunt.registerTask('doc', ['jsdoc']);
};
