/**
 * Internal dependencies
 */
import { isURL } from '../is-url';

describe( 'isURL valid', () => {
	it.each( [
		[ 'http://wordpress.org' ],
		[ 'https://wordpress.org/path?query#fragment' ],
	] )( '%s', ( input ) => {
		expect( isURL( input ) ).toBe( true );
	} );
} );

describe( 'isURL invalid', () => {
	it.each( [
		[ 'http://wordpress.org:port' ],
		[ 'HTTP: HyperText Transfer Protocol' ],
	] )( '%s', ( input ) => {
		expect( isURL( input ) ).toBe( false );
	} );
} );
