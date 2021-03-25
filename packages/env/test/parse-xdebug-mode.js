/**
 * Internal dependencies
 */
const parseXdebugMode = require( '../lib/parse-xdebug-mode' );

describe( 'parseXdebugMode', () => {
	it( 'throws an error if the passed value is not a string', () => {
		expect( () => parseXdebugMode() ).toThrow(
			'is not a mode recognized by Xdebug'
		);
	} );

	it( 'sets the Xdebug mode to "debug" if no mode is specified', () => {
		const result = parseXdebugMode( '' );
		expect( result ).toEqual( 'debug' );
	} );

	it( 'throws an error if a given mode is not recognized, including the invalid mode in the output', () => {
		const fakeMode = 'fake-mode-123';
		expect.assertions( 2 );
		// Single mode:
		expect( () => parseXdebugMode( fakeMode ) ).toThrow( fakeMode );

		// Many modes:
		expect( () =>
			parseXdebugMode( `debug,profile,${ fakeMode }` )
		).toThrow( fakeMode );
	} );

	it( 'returns all modes passed', () => {
		const result = parseXdebugMode( 'debug,profile,trace' );
		expect( result ).toEqual( 'debug,profile,trace' );
	} );
} );
