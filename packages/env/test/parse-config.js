'use strict';
/* eslint-disable jest/no-conditional-expect */
/**
 * External dependencies
 */
const path = require( 'path' );
const { readFile } = require( 'fs' ).promises;

/**
 * Internal dependencies
 */
const { loadConfig } = require( '../lib/config' );
const detectDirectoryType = require( '../lib/config/detect-directory-type' );

jest.mock( 'fs', () => ( {
	promises: {
		readFile: jest.fn(),
		stat: jest.fn().mockResolvedValue( true ),
	},
} ) );

// This mocks a small response with a format matching the stable-check API.
// It makes getLatestWordPressVersion resolve to "100.0.0".
jest.mock( 'got', () =>
	jest.fn( ( url ) => ( {
		json: () => {
			if ( url === 'https://api.wordpress.org/core/stable-check/1.0/' ) {
				return Promise.resolve( {
					'1.0': 'insecure',
					'99.1.1': 'outdated',
					'100.0.0': 'latest',
					'100.0.1': 'fancy',
				} );
			}
		},
	} ) )
);

jest.mock( '../lib/config/detect-directory-type', () => jest.fn() );

describe( 'Config Parsing', () => {
	beforeEach( () => {
		process.env.WP_ENV_HOME = '/cache';
		detectDirectoryType.mockResolvedValue( null );
	} );

	afterEach( () => {
		delete process.env.WP_ENV_HOME;
	} );

	it( 'should load local configuration', async () => {
		readFile.mockImplementation( async ( fileName ) => {
			console.log( fileName );
			throw { code: 'ENOENT' };
		} );

		const config = await loadConfig( path.resolve( '.' ) );

		expect( config ).toMatchObject( {
			name: 'gutenberg',
			detectedLocalConfig: true,
			env: {
				development: {
					port: 8888,
					phpVersion: null,
					coreSource: {
						type: 'git',
						url: 'https://github.com/WordPress/WordPress.git',
						ref: '100.0.0',
						path: '/cache/f406b227b400575d350730477365a884/WordPress',
						clonePath:
							'/cache/f406b227b400575d350730477365a884/WordPress',
						basename: 'WordPress',
						testsPath:
							'/cache/f406b227b400575d350730477365a884/tests-WordPress',
					},
					pluginSources: [],
					themeSources: [],
					config: {
						SCRIPT_DEBUG: true,
						WP_DEBUG: true,
						WP_ENVIRONMENT_TYPE: 'local',
						WP_PHP_BINARY: 'php',
						WP_TESTS_EMAIL: 'admin@example.org',
						WP_TESTS_TITLE: 'Test Blog',
						WP_TESTS_DOMAIN: 'localhost:8888',
						WP_SITEURL: 'http://localhost:8888',
						WP_HOME: 'http://localhost:8888',
					},
					mappings: {},
				},
				tests: {
					port: 8889,
					phpVersion: null,
					coreSource: {
						type: 'git',
						url: 'https://github.com/WordPress/WordPress.git',
						ref: '100.0.0',
						path: '/cache/f406b227b400575d350730477365a884/WordPress',
						clonePath:
							'/cache/f406b227b400575d350730477365a884/WordPress',
						basename: 'WordPress',
						testsPath:
							'/cache/f406b227b400575d350730477365a884/tests-WordPress',
					},
					pluginSources: [],
					themeSources: [],
					config: {
						SCRIPT_DEBUG: false,
						WP_DEBUG: false,
						WP_ENVIRONMENT_TYPE: 'local',
						WP_PHP_BINARY: 'php',
						WP_TESTS_EMAIL: 'admin@example.org',
						WP_TESTS_TITLE: 'Test Blog',
						WP_TESTS_DOMAIN: 'localhost:8889',
						WP_SITEURL: 'http://localhost:8889',
						WP_HOME: 'http://localhost:8889',
					},
					mappings: {},
				},
			},
		} );
	} );
} );
/* eslint-enable jest/no-conditional-expect */
