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

    grunt.event.on('coverage', function(lcovFileContents, done){
        // Check below on the section "The coverage event"
        done();
    });

    grunt.loadNpmTasks('grunt-mocha-istanbul');
    grunt.registerTask('default', ['istanbul_check_coverage']);
};