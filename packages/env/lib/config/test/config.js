/* eslint-disable jest/no-conditional-expect */
/**
 * External dependencies
 */
const { readFile, stat } = require( 'fs' ).promises;
const os = require( 'os' );

/**
 * Internal dependencies
 */
const { readConfig, ValidationError } = require( '..' );
const detectDirectoryType = require( '../detect-directory-type' );

jest.mock( 'fs', () => ( {
	promises: {
		readFile: jest.fn(),
		stat: jest.fn().mockReturnValue( Promise.resolve( false ) ),
	},
} ) );

jest.mock( '../detect-directory-type', () => jest.fn() );

describe( 'readConfig', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'config file', () => {
		it( 'should throw a validation error if config is invalid JSON', async () => {
			readFile.mockImplementation( () => Promise.resolve( '{' ) );
			expect.assertions( 2 );
			try {
				await readConfig( '.wp-env.json' );
			} catch ( error ) {
				expect( error ).toBeInstanceOf( ValidationError );
				expect( error.message ).toContain( 'Invalid .wp-env.json' );
			}
		} );

		it( 'should throw a validation error if config cannot be read', async () => {
			readFile.mockImplementation( () =>
				Promise.reject( { message: 'Uh oh!' } )
			);
			expect.assertions( 2 );
			try {
				await readConfig( '.wp-env.json' );
			} catch ( error ) {
				expect( error ).toBeInstanceOf( ValidationError );
				expect( error.message ).toContain(
					'Could not read .wp-env.json'
				);
			}
		} );

		it( 'should infer a core config when ran from a core directory', async () => {
			readFile.mockImplementation( () =>
				Promise.reject( { code: 'ENOENT' } )
			);
			detectDirectoryType.mockImplementation( () => 'core' );
			const config = await readConfig( '.wp-env.json' );
			expect( config.env.development.coreSource ).not.toBeNull();
			expect( config.env.tests.coreSource ).not.toBeNull();
			expect( config.env.development.pluginSources ).toHaveLength( 0 );
			expect( config.env.development.themeSources ).toHaveLength( 0 );
		} );

		it( 'should infer a plugin config when ran from a plugin directory', async () => {
			readFile.mockImplementation( () =>
				Promise.reject( { code: 'ENOENT' } )
			);
			detectDirectoryType.mockImplementation( () => 'plugin' );
			const config = await readConfig( '.wp-env.json' );
			expect( config.env.development.coreSource ).toBeNull();
			expect( config.env.development.pluginSources ).toHaveLength( 1 );
			expect( config.env.tests.pluginSources ).toHaveLength( 1 );
			expect( config.env.development.themeSources ).toHaveLength( 0 );
		} );

		it( 'should infer a theme config when ran from a theme directory', async () => {
			readFile.mockImplementation( () =>
				Promise.reject( { code: 'ENOENT' } )
			);
			detectDirectoryType.mockImplementation( () => 'theme' );
			const config = await readConfig( '.wp-env.json' );
			expect( config.env.development.coreSource ).toBeNull();
			expect( config.env.tests.coreSource ).toBeNull();
			expect( config.env.development.themeSources ).toHaveLength( 1 );
			expect( config.env.tests.themeSources ).toHaveLength( 1 );
			expect( config.env.development.pluginSources ).toHaveLength( 0 );
			expect( config.env.tests.pluginSources ).toHaveLength( 0 );
		} );

		it( 'should use the WP_ENV_HOME environment variable only if specified', async () => {
			readFile.mockImplementation( () =>
				Promise.resolve( JSON.stringify( {} ) )
			);
			const oldEnvHome = process.env.WP_ENV_HOME;

			expect.assertions( 2 );

			process.env.WP_ENV_HOME = 'here/is/a/path';
			const configWith = await readConfig( '.wp-env.json' );
			expect(
				configWith.workDirectoryPath.includes( 'here/is/a/path' )
			).toBe( true );

			process.env.WP_ENV_HOME = undefined;
			const configWithout = await readConfig( '.wp-env.json' );
			expect(
				configWithout.workDirectoryPath.includes( 'here/is/a/path' )
			).toBe( false );

			process.env.WP_ENV_HOME = oldEnvHome;
		} );

		it( 'should use the WP_ENV_HOME environment variable on Linux', async () => {
			readFile.mockImplementation( () =>
				Promise.resolve( JSON.stringify( {} ) )
			);
			const oldEnvHome = process.env.WP_ENV_HOME;
			const oldOsPlatform = os.platform;
			os.platform = () => 'linux';

			expect.assertions( 2 );

			process.env.WP_ENV_HOME = 'here/is/a/path';
			const configWith = await readConfig( '.wp-env.json' );
			expect(
				configWith.workDirectoryPath.includes( 'here/is/a/path' )
			).toBe( true );

			process.env.WP_ENV_HOME = undefined;
			const configWithout = await readConfig( '.wp-env.json' );
			expect(
				configWithout.workDirectoryPath.includes( 'here/is/a/path' )
			).toBe( false );

			process.env.WP_ENV_HOME = oldEnvHome;
			os.platform = oldOsPlatform;
		} );

		it( 'should use a non-private folder with Snap-installed Docker', async () => {
			readFile.mockImplementation( () =>
				Promise.resolve( JSON.stringify( {} ) )
			);
			stat.mockReturnValue( Promise.resolve( true ) );

			expect.assertions( 2 );

			const config = await readConfig( '.wp-env.json' );
			expect( config.workDirectoryPath.includes( '.wp-env' ) ).toBe(
				false
			);
			expect( config.workDirectoryPath.includes( 'wp-env' ) ).toBe(
				true
			);
		} );

		it( 'should match snapshot', async () => {
			// Note: did not add sources to this config because they include absolute
			// paths which would be different elsewhere.
			readFile.mockImplementation( () =>
				Promise.resolve(
					JSON.stringify( {
						port: 2000,
						config: {
							TEST_VAL1: 1,
							TEST_VAL2: 'hello',
							TEST_VAL3: false,
						},
						env: {
							development: {
								config: {
									TEST: 100,
								},
							},
							tests: {
								port: 1000,
								config: {
									TEST: 200,
								},
							},
						},
					} )
				)
			);
			const config = await readConfig( '.wp-env.json' );
			// Remove generated values which are different on other machines.
			delete config.dockerComposeConfigPath;
			delete config.workDirectoryPath;
			expect( config ).toMatchSnapshot();
		} );
	} );

	describe( 'source parsing', () => {
		it( "should throw a validation error if 'core' is not a string", async () => {
			readFile.mockImplementation( () =>
				Promise.resolve( JSON.stringify( { core: 123 } ) )
			);
			expect.assertions( 2 );
			try {
				await readConfig( '.wp-env.json' );
			} catch ( error ) {
				expect( error ).toBeInstanceOf( ValidationError );
				expect( error.message ).toContain( 'must be null or a string' );
			}
		} );

		it( "should throw a validation error if 'plugins' is not an array of strings", async () => {
			readFile.mockImplementation( () =>
				Promise.resolve(
					JSON.stringify( { plugins: [ 'test', 123 ] } )
				)
			);
			expect.assertions( 2 );
			try {
				await readConfig( '.wp-env.json' );
			} catch ( error ) {
				expect( error ).toBeInstanceOf( ValidationError );
				expect( error.message ).toContain(
					'must be an array of strings'
				);
			}
		} );

		it( "should throw a validation error if 'themes' is not an array of strings", async () => {
			readFile.mockImplementation( () =>
				Promise.resolve( JSON.stringify( { themes: [ 'test', 123 ] } ) )
			);
			expect.assertions( 2 );
			try {
				await readConfig( '.wp-env.json' );
			} catch ( error ) {
				expect( error ).toBeInstanceOf( ValidationError );
				expect( error.message ).toContain(
					'must be an array of strings'
				);
			}
		} );

		it( 'should parse local sources', async () => {
			readFile.mockImplementation( () =>
				Promise.resolve(
					JSON.stringify( {
						plugins: [ './relative', '../parent', '~/home' ],
					} )
				)
			);
			const config = await readConfig( '.wp-env.json' );
			expect( config.env.development ).toMatchObject( {
				pluginSources: [
					{
						type: 'local',
						path: expect.stringMatching( /^\/.*relative$/ ),
						basename: 'relative',
					},
					{
						type: 'local',
						path: expect.stringMatching( /^\/.*parent$/ ),
						basename: 'parent',
					},
					{
						type: 'local',
						path: expect.stringMatching( /^\/.*home$/ ),
						basename: 'home',
					},
				],
			} );
			expect( config.env.tests ).toMatchObject( {
				pluginSources: [
					{
						type: 'local',
						path: expect.stringMatching( /^\/.*relative$/ ),
						basename: 'relative',
					},
					{
						type: 'local',
						path: expect.stringMatching( /^\/.*parent$/ ),
						basename: 'parent',
					},
					{
						type: 'local',
						path: expect.stringMatching( /^\/.*home$/ ),
						basename: 'home',
					},
				],
			} );
		} );

		it( 'should override plugins/themes on an environment level', async () => {
			readFile.mockImplementation( () =>
				Promise.resolve(
					JSON.stringify( {
						plugins: [ './test1', './foo2' ],
						themes: [ './test2', './foo' ],
						env: {
							development: {
								plugins: [ './test1a' ],
								themes: [ './test2a' ],
							},
							tests: {
								plugins: [ './test1b' ],
								themes: [ './test2b' ],
							},
						},
					} )
				)
			);
			const config = await readConfig( '.wp-env.json' );
			expect( config.env.development.pluginSources ).toEqual( [
				{
					type: 'local',
					path: expect.stringMatching( /^\/.*test1a$/ ),
					basename: 'test1a',
				},
			] );
			expect( config.env.development.themeSources ).toEqual( [
				{
					type: 'local',
					path: expect.stringMatching( /^\/.*test2a$/ ),
					basename: 'test2a',
				},
			] );
			expect( config.env.tests.pluginSources ).toEqual( [
				{
					type: 'local',
					path: expect.stringMatching( /^\/.*test1b$/ ),
					basename: 'test1b',
				},
			] );
			expect( config.env.tests.themeSources ).toEqual( [
				{
					type: 'local',
					path: expect.stringMatching( /^\/.*test2b$/ ),
					basename: 'test2b',
				},
			] );
		} );

		it( "should set testsPath on the 'core' source", async () => {
			readFile.mockImplementation( () =>
				Promise.resolve( JSON.stringify( { core: './relative' } ) )
			);
			const config = await readConfig( '.wp-env.json' );
			expect( config.env.development ).toMatchObject( {
				coreSource: {
					type: 'local',
					path: expect.stringMatching( /^\/.*relative$/ ),
					testsPath: expect.stringMatching( /^\/.*tests-relative$/ ),
				},
			} );
			expect( config.env.tests ).toMatchObject( {
				coreSource: {
					type: 'local',
					path: expect.stringMatching( /^\/.*relative$/ ),
					testsPath: expect.stringMatching( /^\/.*tests-relative$/ ),
				},
			} );
		} );

		it( 'should parse GitHub sources', async () => {
			readFile.mockImplementation( () =>
				Promise.resolve(
					JSON.stringify( {
						plugins: [
							'WordPress/gutenberg',
							'WordPress/gutenberg#trunk',
							'WordPress/gutenberg#5.0',
							'WordPress/theme-experiments/tt1-blocks#tt1-blocks@0.4.3',
						],
					} )
				)
			);
			const config = await readConfig( '.wp-env.json' );
			const matchObj = {
				pluginSources: [
					{
						type: 'git',
						url: 'https://github.com/WordPress/gutenberg.git',
						ref: 'master',
						path: expect.stringMatching( /^\/.*gutenberg$/ ),
						basename: 'gutenberg',
					},
					{
						type: 'git',
						url: 'https://github.com/WordPress/gutenberg.git',
						ref: 'trunk',
						path: expect.stringMatching( /^\/.*gutenberg$/ ),
						basename: 'gutenberg',
					},
					{
						type: 'git',
						url: 'https://github.com/WordPress/gutenberg.git',
						ref: '5.0',
						path: expect.stringMatching( /^\/.*gutenberg$/ ),
						basename: 'gutenberg',
					},
					{
						type: 'git',
						url:
							'https://github.com/WordPress/theme-experiments.git',
						ref: 'tt1-blocks@0.4.3',
						path: expect.stringMatching(
							/^\/.*theme-experiments\/tt1-blocks$/
						),
						basename: 'tt1-blocks',
					},
				],
			};
			expect( config.env.tests ).toMatchObject( matchObj );
			expect( config.env.development ).toMatchObject( matchObj );
		} );

		it( 'should parse wordpress.org sources', async () => {
			readFile.mockImplementation( () =>
				Promise.resolve(
					JSON.stringify( {
						plugins: [
							'https://downloads.wordpress.org/plugin/gutenberg.zip',
							'https://downloads.wordpress.org/plugin/gutenberg.8.1.0.zip',
							'https://downloads.wordpress.org/theme/twentytwenty.zip',
							'https://downloads.wordpress.org/theme/twentytwenty.1.3.zip',
						],
					} )
				)
			);
			const config = await readConfig( '.wp-env.json' );
			const matchObj = {
				pluginSources: [
					{
						type: 'zip',
						url:
							'https://downloads.wordpress.org/plugin/gutenberg.zip',
						path: expect.stringMatching( /^\/.*gutenberg$/ ),
						basename: 'gutenberg',
					},
					{
						type: 'zip',
						url:
							'https://downloads.wordpress.org/plugin/gutenberg.8.1.0.zip',
						path: expect.stringMatching( /^\/.*gutenberg$/ ),
						basename: 'gutenberg',
					},
					{
						type: 'zip',
						url:
							'https://downloads.wordpress.org/theme/twentytwenty.zip',
						path: expect.stringMatching( /^\/.*twentytwenty$/ ),
						basename: 'twentytwenty',
					},
					{
						type: 'zip',
						url:
							'https://downloads.wordpress.org/theme/twentytwenty.1.3.zip',
						path: expect.stringMatching( /^\/.*twentytwenty$/ ),
						basename: 'twentytwenty',
					},
				],
			};
			expect( config.env.development ).toMatchObject( matchObj );
			expect( config.env.tests ).toMatchObject( matchObj );
		} );

		it( 'should parse zip sources', async () => {
			readFile.mockImplementation( () =>
				Promise.resolve(
					JSON.stringify( {
						plugins: [
							'https://www.example.com/test/path/to/gutenberg.zip',
							'https://www.example.com/test/path/to/gutenberg.8.1.0.zip',
							'https://www.example.com/test/path/to/twentytwenty.zip',
							'https://www.example.com/test/path/to/twentytwenty.1.3.zip',
							'https://example.com/twentytwenty.1.3.zip',
						],
					} )
				)
			);
			const config = await readConfig( '.wp-env.json' );
			const matchObj = {
				pluginSources: [
					{
						type: 'zip',
						url:
							'https://www.example.com/test/path/to/gutenberg.zip',
						path: expect.stringMatching( /^\/.*gutenberg$/ ),
						basename: 'gutenberg',
					},
					{
						type: 'zip',
						url:
							'https://www.example.com/test/path/to/gutenberg.8.1.0.zip',
						path: expect.stringMatching( /^\/.*gutenberg.8.1.0$/ ),
						basename: 'gutenberg.8.1.0',
					},
					{
						type: 'zip',
						url:
							'https://www.example.com/test/path/to/twentytwenty.zip',
						path: expect.stringMatching( /^\/.*twentytwenty$/ ),
						basename: 'twentytwenty',
					},
					{
						type: 'zip',
						url:
							'https://www.example.com/test/path/to/twentytwenty.1.3.zip',
						path: expect.stringMatching( /^\/.*twentytwenty.1.3$/ ),
						basename: 'twentytwenty.1.3',
					},
					{
						type: 'zip',
						url: 'https://example.com/twentytwenty.1.3.zip',
						path: expect.stringMatching( /^\/.*twentytwenty.1.3$/ ),
						basename: 'twentytwenty.1.3',
					},
				],
			};
			expect( config.env.development ).toMatchObject( matchObj );
			expect( config.env.tests ).toMatchObject( matchObj );
		} );

		it( 'should throw a validaton error if there is an unknown source', async () => {
			readFile.mockImplementation( () =>
				Promise.resolve( JSON.stringify( { plugins: [ 'invalid' ] } ) )
			);
			expect.assertions( 2 );
			try {
				await readConfig( '.wp-env.json' );
			} catch ( error ) {
				expect( error ).toBeInstanceOf( ValidationError );
				expect( error.message ).toContain(
					'Invalid or unrecognized source'
				);
			}
		} );
	} );

	describe( 'mappings parsing', () => {
		it( 'should parse mappings into sources', async () => {
			readFile.mockImplementation( () =>
				Promise.resolve(
					JSON.stringify( {
						mappings: {
							test: './relative',
							test2: 'WordPress/gutenberg#trunk',
						},
					} )
				)
			);
			const config = await readConfig( '.wp-env.json' );
			const matchObj = {
				test: {
					type: 'local',
					path: expect.stringMatching( /^\/.*relative$/ ),
					basename: 'relative',
				},
				test2: {
					type: 'git',
					path: expect.stringMatching( /^\/.*gutenberg$/ ),
					basename: 'gutenberg',
				},
			};
			expect( config.env.development.mappings ).toMatchObject( matchObj );
			expect( config.env.development.mappings ).toMatchObject( matchObj );
		} );

		it( 'should throw a validaton error if there is an invalid mapping', async () => {
			readFile.mockImplementation( () =>
				Promise.resolve(
					JSON.stringify( { mappings: { test: 'false' } } )
				)
			);
			expect.assertions( 2 );
			try {
				await readConfig( '.wp-env.json' );
			} catch ( error ) {
				expect( error ).toBeInstanceOf( ValidationError );
				expect( error.message ).toContain(
					'Invalid or unrecognized source'
				);
			}
		} );

		it( 'throws an error if a mapping is badly formatted', async () => {
			readFile.mockImplementation( () =>
				Promise.resolve(
					JSON.stringify( {
						mappings: { test: null },
					} )
				)
			);
			expect.assertions( 2 );
			try {
				await readConfig( '.wp-env.json' );
			} catch ( error ) {
				expect( error ).toBeInstanceOf( ValidationError );
				expect( error.message ).toContain(
					'Invalid .wp-env.json: "mappings.test" should be a string.'
				);
			}
		} );

		it( 'throws an error if mappings is not an object', async () => {
			readFile.mockImplementation( () =>
				Promise.resolve(
					JSON.stringify( {
						mappings: 'not object',
					} )
				)
			);
			expect.assertions( 2 );
			try {
				await readConfig( '.wp-env.json' );
			} catch ( error ) {
				expect( error ).toBeInstanceOf( ValidationError );
				expect( error.message ).toContain(
					'Invalid .wp-env.json: "mappings" must be an object.'
				);
			}
		} );

		it( 'should return an empty mappings object if none are passed', async () => {
			readFile.mockImplementation( () =>
				Promise.resolve( JSON.stringify( { mappings: {} } ) )
			);
			const config = await readConfig( '.wp-env.json' );
			expect( config.env.development.mappings ).toEqual( {} );
			expect( config.env.tests.mappings ).toEqual( {} );
		} );

		it( 'should merge mappings from different environments', async () => {
			readFile.mockImplementation( () =>
				Promise.resolve(
					JSON.stringify( {
						mappings: {
							test1: '/test1',
						},
						env: {
							tests: {
								mappings: {
									test2: '/test2',
								},
							},
							development: {
								mappings: {
									test3: '/test3',
								},
							},
						},
					} )
				)
			);
			const config = await readConfig( '.wp-env.json' );
			expect( config.env.development.mappings ).toEqual( {
				test1: {
					basename: 'test1',
					path: '/test1',
					type: 'local',
				},
				test3: {
					basename: 'test3',
					path: '/test3',
					type: 'local',
				},
			} );
			expect( config.env.tests.mappings ).toEqual( {
				test1: {
					basename: 'test1',
					path: '/test1',
					type: 'local',
				},
				test2: {
					basename: 'test2',
					path: '/test2',
					type: 'local',
				},
			} );
		} );

		it( 'should override less specific mappings with more specific mappings', async () => {
			readFile.mockImplementation( () =>
				Promise.resolve(
					JSON.stringify( {
						mappings: {
							test: '/test1',
						},
						env: {
							tests: {
								mappings: {
									test: '/test2',
								},
							},
							development: {
								mappings: {
									test: '/test3',
								},
							},
						},
					} )
				)
			);
			const config = await readConfig( '.wp-env.json' );
			expect( config.env.development.mappings ).toEqual( {
				test: {
					basename: 'test3',
					path: '/test3',
					type: 'local',
				},
			} );
			expect( config.env.tests.mappings ).toEqual( {
				test: {
					basename: 'test2',
					path: '/test2',
					type: 'local',
				},
			} );
		} );
	} );

	describe( 'port number parsing', () => {
		it( 'should throw a validaton error if the ports are not numbers', async () => {
			expect.assertions( 10 );
			await testPortNumberValidation( 'port', 'string' );
			await testPortNumberValidation( 'testsPort', [], 'env.tests.' );
			await testPortNumberValidation( 'port', {} );
			await testPortNumberValidation( 'testsPort', false, 'env.tests.' );
			await testPortNumberValidation( 'port', null );
		} );

		it( 'should throw a validaton error if the ports are the same', async () => {
			expect.assertions( 2 );
			readFile.mockImplementation( () =>
				Promise.resolve(
					JSON.stringify( { port: 8888, testsPort: 8888 } )
				)
			);
			try {
				await readConfig( '.wp-env.json' );
			} catch ( error ) {
				expect( error ).toBeInstanceOf( ValidationError );
				expect( error.message ).toContain(
					'Invalid .wp-env.json: Each port value must be unique.'
				);
			}
		} );

		it( 'should parse custom ports', async () => {
			readFile.mockImplementation( () =>
				Promise.resolve(
					JSON.stringify( {
						port: 1000,
						testsPort: 2000,
					} )
				)
			);
			const config = await readConfig( '.wp-env.json' );
			// Custom port is overriden while testsPort gets the deault value.
			expect( config ).toMatchObject( {
				env: {
					development: {
						port: 1000,
					},
					tests: {
						port: 2000,
					},
				},
			} );
		} );

		it( 'certain wp-config values should include the port number', async () => {
			readFile.mockImplementation( () =>
				Promise.resolve(
					JSON.stringify( {
						port: 1000,
						testsPort: 2000,
					} )
				)
			);
			const config = await readConfig( '.wp-env.json' );
			// Custom port is overriden while testsPort gets the deault value.
			expect( config ).toMatchObject( {
				env: {
					development: {
						port: 1000,
						config: {
							WP_TESTS_DOMAIN: 'http://localhost:1000/',
							WP_SITEURL: 'http://localhost:1000/',
							WP_HOME: 'http://localhost:1000/',
						},
					},
					tests: {
						port: 2000,
						config: {
							WP_TESTS_DOMAIN: 'http://localhost:2000/',
							WP_SITEURL: 'http://localhost:2000/',
							WP_HOME: 'http://localhost:2000/',
						},
					},
				},
			} );
		} );

		it( 'should not overwrite port number for WP_HOME if set', async () => {
			readFile.mockImplementation( () =>
				Promise.resolve(
					JSON.stringify( {
						port: 1000,
						testsPort: 2000,
						config: {
							WP_HOME: 'http://localhost:3000/',
						},
					} )
				)
			);
			const config = await readConfig( '.wp-env.json' );
			// Custom port is overriden while testsPort gets the deault value.
			expect( config ).toMatchObject( {
				env: {
					development: {
						port: 1000,
						config: {
							WP_TESTS_DOMAIN: 'http://localhost:1000/',
							WP_SITEURL: 'http://localhost:1000/',
							WP_HOME: 'http://localhost:3000/',
						},
					},
					tests: {
						port: 2000,
						config: {
							WP_TESTS_DOMAIN: 'http://localhost:2000/',
							WP_SITEURL: 'http://localhost:2000/',
							WP_HOME: 'http://localhost:3000/',
						},
					},
				},
			} );
		} );

		it( 'should throw an error if the port number environment variable is invalid', async () => {
			readFile.mockImplementation( () =>
				Promise.resolve( JSON.stringify( {} ) )
			);
			const oldPort = process.env.WP_ENV_PORT;
			process.env.WP_ENV_PORT = 'hello';
			try {
				await readConfig( '.wp-env.json' );
			} catch ( error ) {
				expect( error ).toBeInstanceOf( ValidationError );
				expect( error.message ).toContain(
					'Invalid environment variable: WP_ENV_PORT must be a number.'
				);
			}
			process.env.WP_ENV_PORT = oldPort;
		} );

		it( 'should throw an error if the tests port number environment variable is invalid', async () => {
			readFile.mockImplementation( () =>
				Promise.resolve( JSON.stringify( {} ) )
			);
			const oldPort = process.env.WP_ENV_TESTS_PORT;
			process.env.WP_ENV_TESTS_PORT = 'hello';
			try {
				await readConfig( '.wp-env.json' );
			} catch ( error ) {
				expect( error ).toBeInstanceOf( ValidationError );
				expect( error.message ).toContain(
					'Invalid environment variable: WP_ENV_TESTS_PORT must be a number.'
				);
			}
			process.env.WP_ENV_TESTS_PORT = oldPort;
		} );

		it( 'should use port environment values rather than config values if both are defined', async () => {
			readFile.mockImplementation( () =>
				Promise.resolve(
					JSON.stringify( {
						port: 1000,
						testsPort: 2000,
					} )
				)
			);
			const oldPort = process.env.WP_ENV_PORT;
			const oldTestsPort = process.env.WP_ENV_TESTS_PORT;
			process.env.WP_ENV_PORT = 4000;
			process.env.WP_ENV_TESTS_PORT = 3000;

			const config = await readConfig( '.wp-env.json' );
			expect( config ).toMatchObject( {
				env: {
					development: {
						port: 4000,
					},
					tests: {
						port: 3000,
					},
				},
			} );

			process.env.WP_ENV_PORT = oldPort;
			process.env.WP_ENV_TESTS_PORT = oldTestsPort;
		} );

		it( 'should use 8888 and 8889 as the default port and testsPort values if nothing else is specified', async () => {
			readFile.mockImplementation( () =>
				Promise.resolve( JSON.stringify( {} ) )
			);

			const config = await readConfig( '.wp-env.json' );
			expect( config ).toMatchObject( {
				env: {
					development: {
						port: 8888,
					},
					tests: {
						port: 8889,
					},
				},
			} );
		} );
	} );

	describe( 'wp config values', () => {
		it( 'should use default config values', async () => {
			const config = await readConfig( '.wp-env.json' );

			expect( config.env.tests.config ).toMatchSnapshot();
			expect( config.env.development.config ).toMatchSnapshot();
		} );

		it( 'should override default config values when some are specified', async () => {
			const testValue = 'new value';
			readFile.mockImplementation( () =>
				Promise.resolve(
					JSON.stringify( {
						config: {
							SCRIPT_DEBUG: testValue,
						},
					} )
				)
			);

			const config = await readConfig( '.wp-env.json' );
			expect( config.env.tests.config.SCRIPT_DEBUG ).toBe( testValue );
			expect( config.env.development.config.SCRIPT_DEBUG ).toBe(
				testValue
			);
		} );

		it( 'should override config values using the .override file first', async () => {
			readFile.mockImplementation( ( filename ) => {
				let result;
				if ( filename === '.wp-env.json' ) {
					result = {
						config: {
							SCRIPT_DEBUG: '1',
						},
					};
				} else if ( filename === '.wp-env.override.json' ) {
					result = {
						config: {
							SCRIPT_DEBUG: '2',
						},
					};
				}
				return Promise.resolve( JSON.stringify( result ) );
			} );

			const config = await readConfig( '.wp-env.json' );
			expect( config.env.tests.config.SCRIPT_DEBUG ).toBe( '2' );
			expect( config.env.development.config.SCRIPT_DEBUG ).toBe( '2' );
		} );

		it( 'should override config values using the environment option from the .override file after the general option', async () => {
			readFile.mockImplementation( ( filename ) => {
				let result;
				if ( filename === '.wp-env.json' ) {
					result = {
						config: {
							SCRIPT_DEBUG: '1',
						},
						env: {
							tests: {
								config: {
									SCRIPT_DEBUG: '0',
								},
							},
							development: {
								config: {
									SCRIPT_DEBUG: '0',
								},
							},
						},
					};
				} else if ( filename === '.wp-env.override.json' ) {
					result = {
						config: {
							SCRIPT_DEBUG: '2',
						},
						env: {
							tests: {
								config: {
									SCRIPT_DEBUG: '3',
								},
							},
							development: {
								config: {
									SCRIPT_DEBUG: '4',
								},
							},
						},
					};
				}
				return Promise.resolve( JSON.stringify( result ) );
			} );

			const config = await readConfig( '.wp-env.json' );
			expect( config.env.tests.config.SCRIPT_DEBUG ).toBe( '3' );
			expect( config.env.development.config.SCRIPT_DEBUG ).toBe( '4' );
		} );

		it( 'should override config values using the environment option after the general option', async () => {
			readFile.mockImplementation( () =>
				Promise.resolve(
					JSON.stringify( {
						config: {
							SCRIPT_DEBUG: '1',
						},
						env: {
							tests: {
								config: {
									SCRIPT_DEBUG: '2',
								},
							},
							development: {
								config: {
									SCRIPT_DEBUG: '4',
								},
							},
						},
					} )
				)
			);

			const config = await readConfig( '.wp-env.json' );
			expect( config.env.tests.config.SCRIPT_DEBUG ).toBe( '2' );
			expect( config.env.development.config.SCRIPT_DEBUG ).toBe( '4' );
		} );

		it( 'should merge config values without overwriting an entire section', async () => {
			readFile.mockImplementation( () =>
				Promise.resolve(
					JSON.stringify( {
						config: {
							SCRIPT_DEBUG: '1',
							TEST: '2',
						},
						env: {
							tests: {
								config: {
									SCRIPT_DEBUG: '2',
									TEST3: 'foo',
								},
							},
							development: {
								config: {
									SCRIPT_DEBUG: '4',
									TEST5: 5,
								},
							},
						},
					} )
				)
			);

			const config = await readConfig( '.wp-env.json' );
			expect( config.env.tests.config ).toEqual( {
				SCRIPT_DEBUG: '2',
				TEST3: 'foo',
				TEST: '2',
				WP_DEBUG: false,
				WP_ENVIRONMENT_TYPE: 'local',
				WP_PHP_BINARY: 'php',
				WP_TESTS_EMAIL: 'admin@example.org',
				WP_TESTS_TITLE: 'Test Blog',
				WP_TESTS_DOMAIN: 'http://localhost:8889/',
				WP_SITEURL: 'http://localhost:8889/',
				WP_HOME: 'http://localhost:8889/',
			} );

			expect( config.env.development.config ).toEqual( {
				SCRIPT_DEBUG: '4',
				TEST5: 5,
				TEST: '2',
				WP_DEBUG: true,
				WP_ENVIRONMENT_TYPE: 'local',
				WP_PHP_BINARY: 'php',
				WP_TESTS_EMAIL: 'admin@example.org',
				WP_TESTS_TITLE: 'Test Blog',
				WP_TESTS_DOMAIN: 'http://localhost:8888/',
				WP_SITEURL: 'http://localhost:8888/',
				WP_HOME: 'http://localhost:8888/',
			} );
		} );
	} );
} );

/**
 * Tests that readConfig will throw errors when invalid port numbers are passed.
 *
 * @param {string} portName The name of the port to test ('port' or 'testsPort')
 * @param {any}    value    A value which should throw an error.
 * @param {string} envText  Env text which prefixes the error.
 */
async function testPortNumberValidation( portName, value, envText = '' ) {
	readFile.mockImplementation( () =>
		Promise.resolve( JSON.stringify( { [ portName ]: value } ) )
	);
	try {
		await readConfig( '.wp-env.json' );
	} catch ( error ) {
		// Useful for debugging:
		if ( ! ( error instanceof ValidationError ) ) {
			throw error;
		}
		expect( error ).toBeInstanceOf( ValidationError );
		expect( error.message ).toContain(
			`Invalid .wp-env.json: "${ envText }port" must be an integer.`
		);
	}
	jest.clearAllMocks();
}
/* eslint-enable jest/no-conditional-expect */
