'use strict';
/**
 * External dependencies
 */
const { v2: dockerCompose } = require( 'docker-compose' );

/**
 * Internal dependencies
 */
const { configureWordPress } = require( '../runtime/docker/wordpress' );

jest.mock( 'docker-compose', () => ( {
	v2: {
		run: jest.fn( () => Promise.resolve() ),
		exec: jest.fn( () => Promise.resolve() ),
	},
} ) );

jest.mock( '../wordpress', () => ( {
	readWordPressVersion: jest.fn( () => Promise.resolve( '6.8' ) ),
} ) );

const BASE_CONFIG = {
	name: 'test',
	dockerComposeConfigPath: '/path/to/docker-compose.yml',
	debug: false,
	env: {
		development: {
			coreSource: null,
			config: {
				WP_SITEURL: 'http://localhost:8888',
			},
			pluginSources: [],
			multisite: false,
		},
		tests: {
			coreSource: null,
			config: {
				WP_SITEURL: 'http://localhost:8889',
			},
			pluginSources: [],
			multisite: false,
		},
	},
};

const spinner = {
	info: jest.fn(),
	text: '',
};

describe( 'configureWordPress', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'wp-tests-config.php generation', () => {
		it( 'should not include multisite sed expressions when multisite is disabled', async () => {
			await configureWordPress( 'tests', BASE_CONFIG, spinner );

			// Find the exec call that generates wp-tests-config.php.
			const execCall = dockerCompose.exec.mock.calls.find( ( call ) =>
				call[ 1 ].join( ' ' ).includes( 'wp-tests-config.php' )
			);
			expect( execCall ).toBeDefined();

			const sedCommand = execCall[ 1 ][ 2 ];

			// Should NOT contain multisite constant removal.
			expect( sedCommand ).not.toContain( "'MULTISITE'" );
			expect( sedCommand ).not.toContain( "'DOMAIN_CURRENT_SITE'" );
			expect( sedCommand ).not.toContain( 'WP_TESTS_MULTISITE' );

			// Should still contain the basic sed operations.
			expect( sedCommand ).toContain( '/^require.*wp-settings.php/d' );
			expect( sedCommand ).toContain( 'WP_DEFAULT_THEME' );
			expect( sedCommand ).toContain( 'ABSPATH' );
		} );

		it( 'should strip multisite constants and add WP_TESTS_MULTISITE when multisite is enabled', async () => {
			const multisiteConfig = {
				...BASE_CONFIG,
				env: {
					...BASE_CONFIG.env,
					tests: {
						...BASE_CONFIG.env.tests,
						multisite: true,
					},
				},
			};

			await configureWordPress( 'tests', multisiteConfig, spinner );

			// Find the exec call that generates wp-tests-config.php.
			const execCall = dockerCompose.exec.mock.calls.find( ( call ) =>
				call[ 1 ].join( ' ' ).includes( 'wp-tests-config.php' )
			);
			expect( execCall ).toBeDefined();

			const sedCommand = execCall[ 1 ][ 2 ];

			// Should contain sed expressions to remove all multisite constants.
			const expectedConstants = [
				'MULTISITE',
				'WP_ALLOW_MULTISITE',
				'SUBDOMAIN_INSTALL',
				'DOMAIN_CURRENT_SITE',
				'PATH_CURRENT_SITE',
				'SITE_ID_CURRENT_SITE',
				'BLOG_ID_CURRENT_SITE',
			];

			for ( const constant of expectedConstants ) {
				expect( sedCommand ).toContain(
					`/define *( *'${ constant }'/d`
				);
			}

			// Should add WP_TESTS_MULTISITE.
			expect( sedCommand ).toContain( 'WP_TESTS_MULTISITE' );
		} );

		it( 'should use wp core multisite-install when multisite is enabled', async () => {
			const multisiteConfig = {
				...BASE_CONFIG,
				env: {
					...BASE_CONFIG.env,
					tests: {
						...BASE_CONFIG.env.tests,
						multisite: true,
					},
				},
			};

			await configureWordPress( 'tests', multisiteConfig, spinner );

			// The run call passes [ 'bash', '-c', commands ].
			const runCall = dockerCompose.run.mock.calls[ 0 ];
			const bashCommand = runCall[ 1 ][ 2 ];

			expect( bashCommand ).toContain( 'wp core multisite-install' );
		} );

		it( 'should use wp core install when multisite is disabled', async () => {
			await configureWordPress( 'tests', BASE_CONFIG, spinner );

			// The run call passes [ 'bash', '-c', commands ].
			const runCall = dockerCompose.run.mock.calls[ 0 ];
			const bashCommand = runCall[ 1 ][ 2 ];

			expect( bashCommand ).toContain( 'wp core install' );
			expect( bashCommand ).not.toContain( 'multisite-install' );
		} );

		it( 'should use the tests-wordpress container for tests environment', async () => {
			const multisiteConfig = {
				...BASE_CONFIG,
				env: {
					...BASE_CONFIG.env,
					tests: {
						...BASE_CONFIG.env.tests,
						multisite: true,
					},
				},
			};

			await configureWordPress( 'tests', multisiteConfig, spinner );

			const execCall = dockerCompose.exec.mock.calls.find( ( call ) =>
				call[ 1 ].join( ' ' ).includes( 'wp-tests-config.php' )
			);
			expect( execCall[ 0 ] ).toBe( 'tests-wordpress' );
		} );

		it( 'should use the wordpress container for development environment', async () => {
			await configureWordPress( 'development', BASE_CONFIG, spinner );

			const execCall = dockerCompose.exec.mock.calls.find( ( call ) =>
				call[ 1 ].join( ' ' ).includes( 'wp-tests-config.php' )
			);
			expect( execCall[ 0 ] ).toBe( 'wordpress' );
		} );

		it( 'should not accidentally remove WP_TESTS_DOMAIN or other non-multisite constants', async () => {
			const multisiteConfig = {
				...BASE_CONFIG,
				env: {
					...BASE_CONFIG.env,
					tests: {
						...BASE_CONFIG.env.tests,
						multisite: true,
					},
				},
			};

			await configureWordPress( 'tests', multisiteConfig, spinner );

			const execCall = dockerCompose.exec.mock.calls.find( ( call ) =>
				call[ 1 ].join( ' ' ).includes( 'wp-tests-config.php' )
			);
			const sedCommand = execCall[ 1 ][ 2 ];

			// The sed command should NOT match WP_TESTS_DOMAIN or WP_TESTS_EMAIL
			// (which contain substrings of the constants being removed).
			expect( sedCommand ).not.toContain( "'WP_TESTS_DOMAIN'" );
			expect( sedCommand ).not.toContain( "'WP_TESTS_EMAIL'" );
		} );
	} );

	describe( 'wp-tests-config.php sed transformation', () => {
		// These tests validate that the actual sed command correctly
		// transforms a multisite wp-config.php into a valid wp-tests-config.php.
		// This is the core fix for issue #69818 where DOMAIN_CURRENT_SITE
		// (set without port) conflicted with WP_TESTS_DOMAIN (set with port).

		it( 'should produce correct wp-tests-config.php for multisite', () => {
			const { execSync } = require( 'child_process' );
			const fs = require( 'fs' );
			const os = require( 'os' );
			const path = require( 'path' );

			// Simulate a wp-config.php as produced by wp core multisite-install.
			const wpConfig = [
				'<?php',
				"define( 'DB_NAME', 'wordpress' );",
				"define( 'DB_USER', 'root' );",
				"define( 'DB_PASSWORD', 'password' );",
				"define( 'DB_HOST', 'tests-mysql' );",
				"define( 'WP_DEBUG', false );",
				"define( 'WP_TESTS_DOMAIN', 'localhost:8889' );",
				"define( 'WP_SITEURL', 'http://localhost:8889' );",
				"define( 'WP_HOME', 'http://localhost:8889' );",
				"define( 'WP_TESTS_EMAIL', 'admin@example.org' );",
				// Multisite constants added by wp core multisite-install:
				"define( 'WP_ALLOW_MULTISITE', true );",
				"define( 'MULTISITE', true );",
				"define( 'SUBDOMAIN_INSTALL', false );",
				"define( 'DOMAIN_CURRENT_SITE', 'localhost' );",
				"define( 'PATH_CURRENT_SITE', '/' );",
				"define( 'SITE_ID_CURRENT_SITE', 1 );",
				"define( 'BLOG_ID_CURRENT_SITE', 1 );",
				"$table_prefix = 'wp_';",
				"define( 'ABSPATH', __DIR__ . '/' );",
				"require_once ABSPATH . 'wp-settings.php';",
			].join( '\n' );

			const tmpDir = fs.mkdtempSync(
				path.join( os.tmpdir(), 'wp-env-test-' )
			);
			const wpConfigPath = path.join( tmpDir, 'wp-config.php' );
			const outputPath = path.join( tmpDir, 'wp-tests-config.php' );
			fs.writeFileSync( wpConfigPath, wpConfig );

			// Build the same sed command that configureWordPress generates.
			const constants = [
				'MULTISITE',
				'WP_ALLOW_MULTISITE',
				'SUBDOMAIN_INSTALL',
				'DOMAIN_CURRENT_SITE',
				'PATH_CURRENT_SITE',
				'SITE_ID_CURRENT_SITE',
				'BLOG_ID_CURRENT_SITE',
			];
			const removeSed = constants
				.map( ( c ) => `-e "/define *( *'${ c }'/d"` )
				.join( ' ' );
			const abspathDef = `define( 'ABSPATH', __DIR__ . '\\/' );`;
			const sedCmd = `sed -e "/^require.*wp-settings.php/d" ${ removeSed } -e "s/${ abspathDef }/define( 'ABSPATH', '\\/var\\/www\\/html\\/' );\\n\\tdefine( 'WP_DEFAULT_THEME', 'default' );\\n\\tdefine( 'WP_TESTS_MULTISITE', true );/" ${ wpConfigPath } > ${ outputPath }`;

			execSync( sedCmd, { shell: '/bin/sh' } );
			const output = fs.readFileSync( outputPath, 'utf8' );

			// Should NOT contain any multisite constants from wp-config.php.
			expect( output ).not.toContain( "define( 'MULTISITE'" );
			expect( output ).not.toContain( "'DOMAIN_CURRENT_SITE'" );
			expect( output ).not.toContain( "'WP_ALLOW_MULTISITE'" );
			expect( output ).not.toContain( "'SUBDOMAIN_INSTALL'" );
			expect( output ).not.toContain( "'PATH_CURRENT_SITE'" );
			expect( output ).not.toContain( "'SITE_ID_CURRENT_SITE'" );
			expect( output ).not.toContain( "'BLOG_ID_CURRENT_SITE'" );

			// Should NOT contain the require wp-settings.php line.
			expect( output ).not.toContain( 'wp-settings.php' );

			// Should contain WP_TESTS_MULTISITE.
			expect( output ).toContain(
				"define( 'WP_TESTS_MULTISITE', true );"
			);

			// Should preserve other constants.
			expect( output ).toContain( "define( 'DB_NAME', 'wordpress' );" );
			expect( output ).toContain(
				"define( 'WP_TESTS_DOMAIN', 'localhost:8889' );"
			);
			expect( output ).toContain(
				"define( 'WP_TESTS_EMAIL', 'admin@example.org' );"
			);
			expect( output ).toContain(
				"define( 'ABSPATH', '/var/www/html/' );"
			);
			expect( output ).toContain(
				"define( 'WP_DEFAULT_THEME', 'default' );"
			);

			// Cleanup.
			fs.rmSync( tmpDir, { recursive: true } );
		} );

		it( 'should produce correct wp-tests-config.php for single site', () => {
			const { execSync } = require( 'child_process' );
			const fs = require( 'fs' );
			const os = require( 'os' );
			const path = require( 'path' );

			// Simulate a standard wp-config.php (no multisite).
			const wpConfig = [
				'<?php',
				"define( 'DB_NAME', 'wordpress' );",
				"define( 'DB_USER', 'root' );",
				"define( 'DB_PASSWORD', 'password' );",
				"define( 'DB_HOST', 'mysql' );",
				"define( 'WP_TESTS_DOMAIN', 'localhost:8888' );",
				"$table_prefix = 'wp_';",
				"define( 'ABSPATH', __DIR__ . '/' );",
				"require_once ABSPATH . 'wp-settings.php';",
			].join( '\n' );

			const tmpDir = fs.mkdtempSync(
				path.join( os.tmpdir(), 'wp-env-test-' )
			);
			const wpConfigPath = path.join( tmpDir, 'wp-config.php' );
			const outputPath = path.join( tmpDir, 'wp-tests-config.php' );
			fs.writeFileSync( wpConfigPath, wpConfig );

			// Non-multisite sed (no multisite constant removal, no WP_TESTS_MULTISITE).
			const abspathDef = `define( 'ABSPATH', __DIR__ . '\\/' );`;
			const sedCmd = `sed -e "/^require.*wp-settings.php/d" -e "s/${ abspathDef }/define( 'ABSPATH', '\\/var\\/www\\/html\\/' );\\n\\tdefine( 'WP_DEFAULT_THEME', 'default' );/" ${ wpConfigPath } > ${ outputPath }`;

			execSync( sedCmd, { shell: '/bin/sh' } );
			const output = fs.readFileSync( outputPath, 'utf8' );

			// Should NOT contain WP_TESTS_MULTISITE.
			expect( output ).not.toContain( 'WP_TESTS_MULTISITE' );

			// Should NOT contain the require wp-settings.php line.
			expect( output ).not.toContain( 'wp-settings.php' );

			// Should preserve constants.
			expect( output ).toContain( "define( 'DB_NAME', 'wordpress' );" );
			expect( output ).toContain(
				"define( 'WP_TESTS_DOMAIN', 'localhost:8888' );"
			);
			expect( output ).toContain(
				"define( 'ABSPATH', '/var/www/html/' );"
			);

			// Cleanup.
			fs.rmSync( tmpDir, { recursive: true } );
		} );
	} );
} );
