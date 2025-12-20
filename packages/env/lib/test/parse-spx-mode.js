'use strict';

/**
 * Internal dependencies
 */
const parseSpxMode = require( '../parse-spx-mode' );

describe( 'parseSpxMode', () => {
	it( 'errors with invalid values', () => {
		const errorMessage = 'is not a mode recognized by SPX';
		expect( () => parseSpxMode( true ) ).toThrow( errorMessage );
		expect( () => parseSpxMode( false ) ).toThrow( errorMessage );
		expect( () => parseSpxMode( 1 ) ).toThrow( errorMessage );
	} );

	it( 'sets the SPX mode to "off" if no --spx flag is passed', () => {
		const result = parseSpxMode( undefined );
		expect( result ).toBe( 'off' );
	} );

	it( 'sets the SPX mode to "enabled" if no mode is specified', () => {
		const result = parseSpxMode( '' );
		expect( result ).toBe( 'enabled' );
	} );

	it( 'errors with a mix of valid and invalid modes', () => {
		const fakeMode = 'invalidmode';
		expect( () => parseSpxMode( `enabled,${ fakeMode }` ) ).toThrow(
			fakeMode
		);
	} );
} );
