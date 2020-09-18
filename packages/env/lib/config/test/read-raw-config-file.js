/**
 * External dependencies
 */
const { readFile } = require( 'fs' ).promises;

/**
 * Internal dependencies
 */
const readConfigFile = require( '../read-raw-config-file' );

jest.mock( 'fs', () => ( {
	promises: {
		readFile: jest.fn(),
	},
} ) );

describe( 'readRawConfigFile', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'returns null if it cannot find a file', async () => {
		readFile.mockImplementation( () =>
			Promise.reject( { code: 'ENOENT' } )
		);
		const result = await readConfigFile( 'wp-env', '/.wp-env.json' );
		expect( result ).toBe( null );
	} );

	it( 'converts testPort into tests.port', async () => {
		readFile.mockImplementation( () =>
			Promise.resolve( JSON.stringify( { testsPort: 100 } ) )
		);
		const result = await readConfigFile( 'wp-env', '/.wp-env.json' );
		expect( result ).toEqual( {
			env: {
				tests: {
					port: 100,
				},
			},
		} );
	} );

	it( 'does not overwrite other test config values', async () => {
		readFile.mockImplementation( () =>
			Promise.resolve(
				JSON.stringify( {
					testsPort: 100,
					env: {
						tests: {
							something: 'test',
						},
					},
				} )
			)
		);
		const result = await readConfigFile( 'wp-env', '/.wp-env.json' );
		expect( result ).toEqual( {
			env: {
				tests: {
					port: 100,
					something: 'test',
				},
			},
		} );
	} );

	it( 'uses tests.port if both tests.port and testsPort exist', async () => {
		readFile.mockImplementation( () =>
			Promise.resolve(
				JSON.stringify( {
					testsPort: 100,
					env: {
						tests: {
							port: 200,
						},
					},
				} )
			)
		);
		const result = await readConfigFile( 'wp-env', '/.wp-env.json' );
		expect( result ).toEqual( {
			env: {
				tests: {
					port: 200,
				},
			},
		} );
	} );
} );
