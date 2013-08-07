/*global module:false*/
module.exports = function(grunt) {
	var path = require('path');
	var SOURCE_DIR = 'src/';
	var BUILD_DIR = 'build/';

	// Project configuration.
	grunt.initConfig({
		clean: {
			all: [BUILD_DIR],
			dynamic: {
				dot: true,
				expand: true,
				cwd: BUILD_DIR,
				src: []
			},
		},
		copy: {
			all: {
				dot: true,
				expand: true,
				cwd: SOURCE_DIR,
				src: ['**','!**/.{svn,git}/**'], // Ignore version control directories.
				dest: BUILD_DIR
			},
			dynamic: {
				dot: true,
				expand: true,
				cwd: SOURCE_DIR,
				dest: BUILD_DIR,
				src: []
			}
		},
		cssmin: {
			core: {
				expand: true,
				cwd: SOURCE_DIR,
				dest: BUILD_DIR,
				ext: '.min.css',
				src: [
					'wp-admin/css/*.css',
					'wp-includes/css/*.css',
					// Exceptions
					'!wp-admin/css/farbtastic.css'
				]
			}
		},
		uglify: {
			core: {
				expand: true,
				cwd: SOURCE_DIR,
				dest: BUILD_DIR,
				ext: '.min.js',
				src: [
					'wp-admin/js/*.js',
					'wp-includes/js/*.js',
					'wp-includes/js/plupload/handlers.js',
					'wp-includes/js/plupload/wp-plupload.js',
					'wp-includes/js/tinymce/plugins/wp*/js/*.js',
					// Exceptions
					'!wp-admin/js/custom-header.js', // Why? We should minify this.
					'!wp-admin/js/farbtastic.js',
					'!wp-admin/js/iris.min.js',
					'!wp-includes/js/backbone.min.js',
					'!wp-includes/js/swfobject.js',
					'!wp-includes/js/underscore.min.js'
				]
			},
			tinymce: {
				expand: true,
				cwd: SOURCE_DIR,
				dest: BUILD_DIR,
				src: [
					'wp-includes/js/tinymce/plugins/wordpress/editor_plugin_src.js',
					'wp-includes/js/tinymce/plugins/wp*/editor_plugin_src.js'
				],
				// TinyMCE plugins use a nonstandard naming scheme: plugin files are named
				// `editor_plugin_src.js`, and are compressed into `editor_plugin.js`.
				rename: function(destBase, destPath) {
					destPath = destPath.replace('/editor_plugin_src.js', '/editor_plugin.js');
					return path.join(destBase || '', destPath);
				}
			}
		},
		watch: {
			all: {
				files: [
					SOURCE_DIR + '**',
					// Ignore version control directories.
					'!' + SOURCE_DIR + '**/.{svn,git}/**'
				],
				tasks: ['clean:dynamic', 'copy:dynamic'],
				options: {
					dot: true,
					spawn: false,
					interval: 2000
				}
			}
		}
	});

	// Load tasks.
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');

	// Register tasks.
	grunt.registerTask('build', ['clean:all', 'copy:all', 'cssmin:core',
		'uglify:core', 'uglify:tinymce']);

	// Default task.
	grunt.registerTask('default', ['build']);

	// Add a listener to the watch task.
	//
	// On `watch:all`, automatically updates the `copy:dynamic` and `clean:dynamic`
	// configurations so that only the changed files are updated.
	grunt.event.on('watch', function(action, filepath, target) {
		if (target != 'all') return;

		var relativePath = path.relative(SOURCE_DIR, filepath);
		var cleanSrc = (action == 'deleted') ? [relativePath] : [];
		var copySrc = (action == 'deleted') ? [] : [relativePath];
		grunt.config(['clean', 'dynamic', 'src'], cleanSrc);
		grunt.config(['copy', 'dynamic', 'src'], copySrc);
	});
};
