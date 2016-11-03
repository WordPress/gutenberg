/* jshint node:true */
module.exports = function(grunt) {
	var path = require('path'),
		fs = require( 'fs' ),
		SOURCE_DIR = 'src/',
		BUILD_DIR = 'build/',
		autoprefixer = require('autoprefixer'),
		mediaConfig = {},
		mediaBuilds = ['audiovideo', 'grid', 'models', 'views'];

	// Load tasks.
	require('matchdep').filterDev(['grunt-*', '!grunt-legacy-util']).forEach( grunt.loadNpmTasks );
	// Load legacy utils
	grunt.util = require('grunt-legacy-util');

	mediaBuilds.forEach( function ( build ) {
		var path = SOURCE_DIR + 'wp-includes/js/media';
		mediaConfig[ build ] = { files : {} };
		mediaConfig[ build ].files[ path + '-' + build + '.js' ] = [ path + '/' + build + '.manifest.js' ];
	} );

	// Project configuration.
	grunt.initConfig({
		postcss: {
			options: {
				processors: [
					autoprefixer({
						browsers: [
							'Android >= 2.1',
							'Chrome >= 21',
							'Edge >= 12',
							'Explorer >= 7',
							'Firefox >= 17',
							'Opera >= 12.1',
							'Safari >= 6.0'
						],
						cascade: false
					})
				]
			},
			core: {
				expand: true,
				cwd: SOURCE_DIR,
				dest: SOURCE_DIR,
				src: [
					'wp-admin/css/*.css',
					'wp-includes/css/*.css'
				]
			},
			colors: {
				expand: true,
				cwd: BUILD_DIR,
				dest: BUILD_DIR,
				src: [
					'wp-admin/css/colors/*/colors.css'
				]
			}
		},
		clean: {
			all: [BUILD_DIR],
			dynamic: {
				dot: true,
				expand: true,
				cwd: BUILD_DIR,
				src: []
			},
			tinymce: ['<%= concat.tinymce.dest %>'],
			qunit: ['tests/qunit/compiled.html']
		},
		copy: {
			files: {
				files: [
					{
						dot: true,
						expand: true,
						cwd: SOURCE_DIR,
						src: [
							'**',
							'!wp-includes/js/media/**',
							'!**/.{svn,git}/**', // Ignore version control directories.
							// Ignore unminified versions of external libs we don't ship:
							'!wp-includes/js/backbone.js',
							'!wp-includes/js/underscore.js',
							'!wp-includes/js/jquery/jquery.masonry.js',
							'!wp-includes/js/jquery/ui/*.js',
							'!wp-includes/js/tinymce/tinymce.js',
							'!wp-includes/version.php' // Exclude version.php
						],
						dest: BUILD_DIR
					},
					{
						src: 'wp-config-sample.php',
						dest: BUILD_DIR
					}
				]
			},
			'wp-admin-css-compat-rtl': {
				options: {
					processContent: function( src ) {
						return src.replace( /\.css/g, '-rtl.css' );
					}
				},
				src: SOURCE_DIR + 'wp-admin/css/wp-admin.css',
				dest: BUILD_DIR + 'wp-admin/css/wp-admin-rtl.css'
			},
			'wp-admin-css-compat-min': {
				options: {
					processContent: function( src ) {
						return src.replace( /\.css/g, '.min.css' );
					}
				},
				files: [
					{
						src: SOURCE_DIR + 'wp-admin/css/wp-admin.css',
						dest: BUILD_DIR + 'wp-admin/css/wp-admin.min.css'
					},
					{
						src:  BUILD_DIR + 'wp-admin/css/wp-admin-rtl.css',
						dest: BUILD_DIR + 'wp-admin/css/wp-admin-rtl.min.css'
					}
				]
			},
			version: {
				options: {
					processContent: function( src ) {
						return src.replace( /^\$wp_version = '(.+?)';/m, function( str, version ) {
							version = version.replace( /-src$/, '' );

							// If the version includes an SVN commit (-12345), it's not a released alpha/beta. Append a timestamp.
							version = version.replace( /-[\d]{5}$/, '-' + grunt.template.today( 'yyyymmdd.HHMMss' ) );

							/* jshint quotmark: true */
							return "$wp_version = '" + version + "';";
						});
					}
				},
				src: SOURCE_DIR + 'wp-includes/version.php',
				dest: BUILD_DIR + 'wp-includes/version.php'
			},
			dynamic: {
				dot: true,
				expand: true,
				cwd: SOURCE_DIR,
				dest: BUILD_DIR,
				src: []
			},
			qunit: {
				src: 'tests/qunit/index.html',
				dest: 'tests/qunit/compiled.html',
				options: {
					processContent: function( src ) {
						return src.replace( /(\".+?\/)src(\/.+?)(?:.min)?(.js\")/g , function( match, $1, $2, $3 ) {
							// Don't add `.min` to files that don't have it.
							return $1 + 'build' + $2 + ( /jquery$/.test( $2 ) ? '' : '.min' ) + $3;
						} );
					}
				}
			}
		},
		browserify: mediaConfig,
		sass: {
			colors: {
				expand: true,
				cwd: SOURCE_DIR,
				dest: BUILD_DIR,
				ext: '.css',
				src: ['wp-admin/css/colors/*/colors.scss'],
				options: {
					outputStyle: 'expanded'
				}
			}
		},
		cssmin: {
			options: {
				compatibility: 'ie7'
			},
			core: {
				expand: true,
				cwd: SOURCE_DIR,
				dest: BUILD_DIR,
				ext: '.min.css',
				src: [
					'wp-admin/css/*.css',
					'!wp-admin/css/wp-admin*.css',
					'wp-includes/css/*.css',
					'wp-includes/js/mediaelement/wp-mediaelement.css'
				]
			},
			rtl: {
				expand: true,
				cwd: BUILD_DIR,
				dest: BUILD_DIR,
				ext: '.min.css',
				src: [
					'wp-admin/css/*-rtl.css',
					'!wp-admin/css/wp-admin*.css',
					'wp-includes/css/*-rtl.css'
				]
			},
			colors: {
				expand: true,
				cwd: BUILD_DIR,
				dest: BUILD_DIR,
				ext: '.min.css',
				src: [
					'wp-admin/css/colors/*/*.css'
				]
			}
		},
		rtlcss: {
			options: {
				// rtlcss options
				opts: {
					clean: false,
					processUrls: { atrule: true, decl: false },
					stringMap: [
						{
							name: 'import-rtl-stylesheet',
							priority: 10,
							exclusive: true,
							search: [ '.css' ],
							replace: [ '-rtl.css' ],
							options: {
								scope: 'url',
								ignoreCase: false
							}
						}
					]
				},
				saveUnmodified: false,
				plugins: [
					{
						name: 'swap-dashicons-left-right-arrows',
						priority: 10,
						directives: {
							control: {},
							value: []
						},
						processors: [
							{
								expr: /content/im,
								action: function( prop, value ) {
									if ( value === '"\\f141"' ) { // dashicons-arrow-left
										value = '"\\f139"';
									} else if ( value === '"\\f340"' ) { // dashicons-arrow-left-alt
										value = '"\\f344"';
									} else if ( value === '"\\f341"' ) { // dashicons-arrow-left-alt2
										value = '"\\f345"';
									} else if ( value === '"\\f139"' ) { // dashicons-arrow-right
										value = '"\\f141"';
									} else if ( value === '"\\f344"' ) { // dashicons-arrow-right-alt
										value = '"\\f340"';
									} else if ( value === '"\\f345"' ) { // dashicons-arrow-right-alt2
										value = '"\\f341"';
									}
									return { prop: prop, value: value };
								}
							}
						]
					}
				]
			},
			core: {
				expand: true,
				cwd: SOURCE_DIR,
				dest: BUILD_DIR,
				ext: '-rtl.css',
				src: [
					'wp-admin/css/*.css',
					'wp-includes/css/*.css',

					// Exceptions
					'!wp-includes/css/dashicons.css',
					'!wp-includes/css/wp-embed-template.css',
					'!wp-includes/css/wp-embed-template-ie.css'
				]
			},
			colors: {
				expand: true,
				cwd: BUILD_DIR,
				dest: BUILD_DIR,
				ext: '-rtl.css',
				src: [
					'wp-admin/css/colors/*/colors.css'
				]
			},
			dynamic: {
				expand: true,
				cwd: SOURCE_DIR,
				dest: BUILD_DIR,
				ext: '-rtl.css',
				src: []
			}
		},
		jshint: {
			options: grunt.file.readJSON('.jshintrc'),
			grunt: {
				src: ['Gruntfile.js']
			},
			tests: {
				src: [
					'tests/qunit/**/*.js',
					'!tests/qunit/vendor/*',
					'!tests/qunit/editor/**'
				],
				options: grunt.file.readJSON('tests/qunit/.jshintrc')
			},
			themes: {
				expand: true,
				cwd: SOURCE_DIR + 'wp-content/themes',
				src: [
					'twenty*/**/*.js',
					'!twenty{eleven,twelve,thirteen}/**',
					// Third party scripts
					'!twenty{fourteen,fifteen,sixteen}/js/html5.js',
					'!twentyseventeen/assets/js/html5.js',
					'!twentyseventeen/assets/js/jquery.scrollTo.js'
				]
			},
			media: {
				options: {
					browserify: true
				},
				src: [
					SOURCE_DIR + 'wp-includes/js/media/**/*.js'
				]
			},
			core: {
				expand: true,
				cwd: SOURCE_DIR,
				src: [
					'wp-admin/js/*.js',
					'wp-includes/js/*.js',
					// Built scripts.
					'!wp-includes/js/media-*',
					// WordPress scripts inside directories
					'wp-includes/js/jquery/jquery.table-hotkeys.js',
					'wp-includes/js/mediaelement/wp-mediaelement.js',
					'wp-includes/js/mediaelement/wp-playlist.js',
					'wp-includes/js/plupload/handlers.js',
					'wp-includes/js/plupload/wp-plupload.js',
					'wp-includes/js/tinymce/plugins/wordpress/plugin.js',
					'wp-includes/js/tinymce/plugins/wp*/plugin.js',
					// Third party scripts
					'!wp-admin/js/farbtastic.js',
					'!wp-includes/js/backbone*.js',
					'!wp-includes/js/swfobject.js',
					'!wp-includes/js/underscore*.js',
					'!wp-includes/js/colorpicker.js',
					'!wp-includes/js/hoverIntent.js',
					'!wp-includes/js/json2.js',
					'!wp-includes/js/tw-sack.js',
					'!wp-includes/js/twemoji.js',
					'!**/*.min.js'
				],
				// Remove once other JSHint errors are resolved
				options: {
					curly: false,
					eqeqeq: false
				},
				// Limit JSHint's run to a single specified file:
				//
				//    grunt jshint:core --file=filename.js
				//
				// Optionally, include the file path:
				//
				//    grunt jshint:core --file=path/to/filename.js
				//
				filter: function( filepath ) {
					var index, file = grunt.option( 'file' );

					// Don't filter when no target file is specified
					if ( ! file ) {
						return true;
					}

					// Normalize filepath for Windows
					filepath = filepath.replace( /\\/g, '/' );
					index = filepath.lastIndexOf( '/' + file );

					// Match only the filename passed from cli
					if ( filepath === file || ( -1 !== index && index === filepath.length - ( file.length + 1 ) ) ) {
						return true;
					}

					return false;
				}
			},
			plugins: {
				expand: true,
				cwd: SOURCE_DIR + 'wp-content/plugins',
				src: [
					'**/*.js',
					'!**/*.min.js'
				],
				// Limit JSHint's run to a single specified plugin directory:
				//
				//    grunt jshint:plugins --dir=foldername
				//
				filter: function( dirpath ) {
					var index, dir = grunt.option( 'dir' );

					// Don't filter when no target folder is specified
					if ( ! dir ) {
						return true;
					}

					dirpath = dirpath.replace( /\\/g, '/' );
					index = dirpath.lastIndexOf( '/' + dir );

					// Match only the folder name passed from cli
					if ( -1 !== index ) {
						return true;
					}

					return false;
				}
			}
		},
		qunit: {
			files: [
				'tests/qunit/**/*.html',
				'!tests/qunit/editor/**'
			]
		},
		phpunit: {
			'default': {
				cmd: 'phpunit',
				args: ['-c', 'phpunit.xml.dist']
			},
			ajax: {
				cmd: 'phpunit',
				args: ['-c', 'phpunit.xml.dist', '--group', 'ajax']
			},
			multisite: {
				cmd: 'phpunit',
				args: ['-c', 'tests/phpunit/multisite.xml']
			},
			'external-http': {
				cmd: 'phpunit',
				args: ['-c', 'phpunit.xml.dist', '--group', 'external-http']
			}
		},
		uglify: {
			options: {
				ASCIIOnly: true,
				screwIE8: false
			},
			core: {
				expand: true,
				cwd: SOURCE_DIR,
				dest: BUILD_DIR,
				ext: '.min.js',
				src: [
					'wp-admin/js/*.js',
					'wp-includes/js/*.js',
					'wp-includes/js/mediaelement/wp-mediaelement.js',
					'wp-includes/js/mediaelement/wp-playlist.js',
					'wp-includes/js/plupload/handlers.js',
					'wp-includes/js/plupload/wp-plupload.js',
					'wp-includes/js/tinymce/plugins/wordpress/plugin.js',
					'wp-includes/js/tinymce/plugins/wp*/plugin.js',

					// Exceptions
					'!wp-admin/js/bookmarklet.*', // Minified and updated in /src with the precommit task. See uglify:bookmarklet.
					'!wp-admin/js/custom-header.js', // Why? We should minify this.
					'!wp-admin/js/farbtastic.js',
					'!wp-admin/js/iris.min.js',
					'!wp-includes/js/backbone.*',
					'!wp-includes/js/masonry.min.js',
					'!wp-includes/js/swfobject.js',
					'!wp-includes/js/underscore.*',
					'!wp-includes/js/zxcvbn.min.js',
					'!wp-includes/js/wp-embed.js' // We have extra options for this, see uglify:embed
				]
			},
			embed: {
				options: {
					compress: {
						conditionals: false
					}
				},
				expand: true,
				cwd: SOURCE_DIR,
				dest: BUILD_DIR,
				ext: '.min.js',
				src: ['wp-includes/js/wp-embed.js']
			},
			media: {
				expand: true,
				cwd: SOURCE_DIR,
				dest: BUILD_DIR,
				ext: '.min.js',
				src: [
					'wp-includes/js/media-audiovideo.js',
					'wp-includes/js/media-grid.js',
					'wp-includes/js/media-models.js',
					'wp-includes/js/media-views.js'
				]
			},
			jqueryui: {
				options: {
					// Preserve comments that start with a bang.
					preserveComments: /^!/
				},
				expand: true,
				cwd: SOURCE_DIR,
				dest: BUILD_DIR,
				ext: '.min.js',
				src: ['wp-includes/js/jquery/ui/*.js']
			},
			bookmarklet: {
				options: {
					compress: {
						negate_iife: false
					}
				},
				src: SOURCE_DIR + 'wp-admin/js/bookmarklet.js',
				dest: SOURCE_DIR + 'wp-admin/js/bookmarklet.min.js'
			},
			masonry: {
				options: {
					// Preserve comments that start with a bang.
					preserveComments: /^!/
				},
				src: SOURCE_DIR + 'wp-includes/js/jquery/jquery.masonry.js',
				dest: SOURCE_DIR + 'wp-includes/js/jquery/jquery.masonry.min.js'
			}
		},

		concat: {
			tinymce: {
				options: {
					separator: '\n',
					process: function( src, filepath ) {
						return '// Source: ' + filepath.replace( BUILD_DIR, '' ) + '\n' + src;
					}
				},
				src: [
					BUILD_DIR + 'wp-includes/js/tinymce/tinymce.min.js',
					BUILD_DIR + 'wp-includes/js/tinymce/themes/modern/theme.min.js',
					BUILD_DIR + 'wp-includes/js/tinymce/plugins/*/plugin.min.js'
				],
				dest: BUILD_DIR + 'wp-includes/js/tinymce/wp-tinymce.js'
			},
			emoji: {
				options: {
					separator: '\n',
					process: function( src, filepath ) {
						return '// Source: ' + filepath.replace( BUILD_DIR, '' ) + '\n' + src;
					}
				},
				src: [
					BUILD_DIR + 'wp-includes/js/twemoji.min.js',
					BUILD_DIR + 'wp-includes/js/wp-emoji.min.js'
				],
				dest: BUILD_DIR + 'wp-includes/js/wp-emoji-release.min.js'
			}
		},
		compress: {
			tinymce: {
				options: {
					mode: 'gzip',
					level: 9
				},
				src: '<%= concat.tinymce.dest %>',
				dest: BUILD_DIR + 'wp-includes/js/tinymce/wp-tinymce.js.gz'
			}
		},
		jsvalidate:{
			options: {
				globals: {},
				esprimaOptions:{},
				verbose: false
			},
			build: {
				files: {
					src: [
						BUILD_DIR + 'wp-{admin,includes}/**/*.js',
						BUILD_DIR + 'wp-content/themes/twenty*/**/*.js'
					]
				}
			}
		},
		imagemin: {
			core: {
				expand: true,
				cwd: SOURCE_DIR,
				src: [
					'wp-{admin,includes}/images/**/*.{png,jpg,gif,jpeg}',
					'wp-includes/js/tinymce/skins/wordpress/images/*.{png,jpg,gif,jpeg}'
				],
				dest: SOURCE_DIR
			}
		},
		includes: {
			emoji: {
				src: BUILD_DIR + 'wp-includes/formatting.php',
				dest: '.'
			},
			embed: {
				src: BUILD_DIR + 'wp-includes/embed.php',
				dest: '.'
			}
		},
		_watch: {
			all: {
				files: [
					SOURCE_DIR + '**',
					'!' + SOURCE_DIR + 'wp-includes/js/media/**',
					// Ignore version control directories.
					'!' + SOURCE_DIR + '**/.{svn,git}/**'
				],
				tasks: ['clean:dynamic', 'copy:dynamic'],
				options: {
					dot: true,
					spawn: false,
					interval: 2000
				}
			},
			config: {
				files: 'Gruntfile.js'
			},
			colors: {
				files: [SOURCE_DIR + 'wp-admin/css/colors/**'],
				tasks: ['sass:colors']
			},
			rtl: {
				files: [
					SOURCE_DIR + 'wp-admin/css/*.css',
					SOURCE_DIR + 'wp-includes/css/*.css'
				],
				tasks: ['rtlcss:dynamic'],
				options: {
					spawn: false,
					interval: 2000
				}
			},
			test: {
				files: [
					'tests/qunit/**',
					'!tests/qunit/editor/**'
				],
				tasks: ['qunit']
			}
		}
	});

	// Allow builds to be minimal
	if( grunt.option( 'minimal-copy' ) ) {
		var copyFilesOptions = grunt.config.get( 'copy.files.files' );
		copyFilesOptions[0].src.push( '!wp-content/plugins/**' );
		copyFilesOptions[0].src.push( '!wp-content/themes/!(twenty*)/**' );
		grunt.config.set( 'copy.files.files', copyFilesOptions );
	}


	// Register tasks.

	// RTL task.
	grunt.registerTask('rtl', ['rtlcss:core', 'rtlcss:colors']);

	// Color schemes task.
	grunt.registerTask('colors', ['sass:colors', 'postcss:colors']);

	// JSHint task.
	grunt.registerTask( 'jshint:corejs', [
		'jshint:grunt',
		'jshint:tests',
		'jshint:themes',
		'jshint:core',
		'jshint:media'
	] );

	grunt.renameTask( 'watch', '_watch' );

	grunt.registerTask( 'watch', function() {
		if ( ! this.args.length || this.args.indexOf( 'browserify' ) > -1 ) {
			grunt.config( 'browserify.options', {
				browserifyOptions: {
					debug: true
				},
				watch: true
			} );

			grunt.task.run( 'browserify' );
		}

		grunt.task.run( '_' + this.nameArgs );
	} );

	grunt.registerTask( 'precommit:image', [
		'imagemin:core'
	] );

	grunt.registerTask( 'precommit:js', [
		'browserify',
		'jshint:corejs',
		'uglify:bookmarklet',
		'uglify:masonry',
		'qunit:compiled'
	] );

	grunt.registerTask( 'precommit:css', [
		'postcss:core'
	] );

	grunt.registerTask( 'precommit:php', [
		'phpunit'
	] );

	grunt.registerTask( 'precommit', 'Runs test and build tasks in preparation for a commit', function() {
		var done = this.async();
		var map = {
			svn: 'svn status --ignore-externals',
			git: 'git status --short'
		};

		find( [
			__dirname + '/.svn',
			__dirname + '/.git',
			path.dirname( __dirname ) + '/.svn'
		] );

		function find( set ) {
			var dir;

			if ( set.length ) {
				fs.stat( dir = set.shift(), function( error ) {
					error ? find( set ) : run( path.basename( dir ).substr( 1 ) );
				} );
			} else {
				grunt.fatal( 'This WordPress install is not under version control.' );
			}
		}

		function run( type ) {
			var command = map[ type ].split( ' ' );

			grunt.util.spawn( {
				cmd: command.shift(),
				args: command
			}, function( error, result, code ) {
				var taskList = [];

				if ( code !== 0 ) {
					grunt.fatal( 'The `' +  map[ type ] + '` command returned a non-zero exit code.', code );
				}

				// Callback for finding modified paths.
				function testPath( path ) {
					var regex = new RegExp( ' ' + path + '$', 'm' );
					return regex.test( result.stdout );
				}

				// Callback for finding modified files by extension.
				function testExtension( extension ) {
					var regex = new RegExp( '\.' + extension + '$', 'm' );
					return regex.test( result.stdout );
				}

				if ( [ 'package.json', 'Gruntfile.js' ].some( testPath ) ) {
					grunt.log.writeln( 'Configuration files modified. Running `prerelease`.' );
					taskList.push( 'prerelease' );
				} else {
					if ( [ 'png', 'jpg', 'gif', 'jpeg' ].some( testExtension ) ) {
						grunt.log.writeln( 'Image files modified. Minifying.' );
						taskList.push( 'precommit:image' );
					}

					[ 'js', 'css', 'php' ].forEach( function( extension ) {
						if ( testExtension( extension ) ) {
							grunt.log.writeln( extension.toUpperCase() + ' files modified. ' + extension.toUpperCase() + ' tests will be run.' );
							taskList.push( 'precommit:' + extension );
						}
					} );
				}

				grunt.task.run( taskList );

				done();
			} );
		}
	} );

	grunt.registerTask( 'copy:all', [
		'copy:files',
		'copy:wp-admin-css-compat-rtl',
		'copy:wp-admin-css-compat-min',
		'copy:version'
	] );

	grunt.registerTask( 'build', [
		'clean:all',
		'copy:all',
		'cssmin:core',
		'colors',
		'rtl',
		'cssmin:rtl',
		'cssmin:colors',
		'uglify:core',
		'uglify:embed',
		'uglify:jqueryui',
		'concat:tinymce',
		'compress:tinymce',
		'clean:tinymce',
		'concat:emoji',
		'includes:emoji',
		'includes:embed',
		'jsvalidate:build'
	] );

	grunt.registerTask( 'prerelease', [
		'precommit:php',
		'precommit:js',
		'precommit:css',
		'precommit:image'
	] );

	// Testing tasks.
	grunt.registerMultiTask('phpunit', 'Runs PHPUnit tests, including the ajax, external-http, and multisite tests.', function() {
		grunt.util.spawn({
			cmd: this.data.cmd,
			args: this.data.args,
			opts: {stdio: 'inherit'}
		}, this.async());
	});

	grunt.registerTask('qunit:compiled', 'Runs QUnit tests on compiled as well as uncompiled scripts.',
		['build', 'copy:qunit', 'qunit']);

	grunt.registerTask('test', 'Runs all QUnit and PHPUnit tasks.', ['qunit:compiled', 'phpunit']);

	// Travis CI tasks.
	grunt.registerTask('travis:js', 'Runs Javascript Travis CI tasks.', [ 'jshint:corejs', 'qunit:compiled' ]);
	grunt.registerTask('travis:phpunit', 'Runs PHPUnit Travis CI tasks.', 'phpunit');

	// Patch task.
	grunt.renameTask('patch_wordpress', 'patch');

	// Default task.
	grunt.registerTask('default', ['build']);

	/*
	 * Automatically updates the `:dynamic` configurations
	 * so that only the changed files are updated.
	 */
	grunt.event.on('watch', function( action, filepath, target ) {
		var src;

		if ( [ 'all', 'rtl', 'browserify' ].indexOf( target ) === -1 ) {
			return;
		}

		src = [ path.relative( SOURCE_DIR, filepath ) ];

		if ( action === 'deleted' ) {
			grunt.config( [ 'clean', 'dynamic', 'src' ], src );
		} else {
			grunt.config( [ 'copy', 'dynamic', 'src' ], src );

			if ( target === 'rtl' ) {
				grunt.config( [ 'rtlcss', 'dynamic', 'src' ], src );
			}
		}
	});
};
