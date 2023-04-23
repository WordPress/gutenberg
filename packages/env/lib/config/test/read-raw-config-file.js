/* eslint-disable jest/no-conditional-expect */
/**
 * External dependencies
 */
const { readFile } = require( 'fs' ).promises;

/**
 * Internal dependencies
 */
const readRawConfigFile = require( '../read-raw-config-file' );
const { ValidationError } = require( '../validate-config' );

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
		const result = await readRawConfigFile( '/.wp-env.json' );
		expect( result ).toBe( null );
	} );

	it( 'rejects when read file fails', async () => {
		readFile.mockImplementation( () =>
			Promise.reject( { message: 'Test' } )
		);

		expect.assertions( 1 );

		try {
			await readRawConfigFile( '/.wp-env.json' );
		} catch ( e ) {
			expect( e ).toEqual(
				new ValidationError( 'Could not read .wp-env.json: Test' )
			);
		}
	} );

	it( 'converts testPort into tests.port', async () => {
		readFile.mockImplementation( () =>
			Promise.resolve( JSON.stringify( { testsPort: 100 } ) )
		);
		const result = await readRawConfigFile( '/.wp-env.json' );
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
		const result = await readRawConfigFile( '/.wp-env.json' );
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
		const result = await readRawConfigFile( '/.wp-env.json' );
		expect( result ).toEqual( {
			env: {
				tests: {
					port: 200,
				},
			},
		} );
	} );
} );
/* eslint-enable jest/no-conditional-expect */
