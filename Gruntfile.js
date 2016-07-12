var path = require( "path" );
var loadGruntConfig = require( "load-grunt-config" );

module.exports = function( grunt ) {
	"use strict";

	// require('time-grunt')(grunt);

	// Define project configuration
	var project = {
		paths: {
			grunt: "grunt/",
			get config() {
				return this.grunt + "config/";
			}
		},
		files: {
			js: [
				"a11y-speak.js",
				"grunt/config/*.js",
			],
			get config() {
				return project.paths.config + "*.js";
			},
			grunt: "Gruntfile.js"
		},
		pkg: grunt.file.readJSON( "package.json" )
	};

	// Load Grunt configurations and tasks
	loadGruntConfig( grunt, {
		configPath: path.join( process.cwd(), project.paths.config ),
		data: project,
		jitGrunt: {
			customTasksDir: "grunt/custom"
		}
	} );
};
