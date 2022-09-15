/**
 * Internal dependencies
 */
const parseXdebugMode = require( '../lib/parse-xdebug-mode' );

describe( 'parseXdebugMode', () => {
	it( 'throws an error if the passed value is neither a string nor undefined', () => {
		const errorMessage = 'is not a mode recognized by Xdebug';
		expect( () => parseXdebugMode( true ) ).toThrow( errorMessage );
		expect( () => parseXdebugMode( false ) ).toThrow( errorMessage );
		expect( () => parseXdebugMode( 1 ) ).toThrow( errorMessage );
	} );

	it( 'sets the Xdebug mode to "off" if no --xdebug flag is passed', () => {
		const result = parseXdebugMode( undefined );
		expect( result ).toEqual( 'off' );
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
