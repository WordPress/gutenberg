/**
 * Internal dependencies
 */
import { isURL } from '../';

describe( 'isURL', () => {
	it.each( [
		[ 'http://wordpress.org' ],
		[ 'https://wordpress.org' ],
		[ 'HTTPS://WORDPRESS.ORG' ],
		[ 'https://wordpress.org/./foo' ],
		[ 'https://wordpress.org/path?query#fragment' ],
		[ 'https://localhost/foo#bar' ],
		[ 'mailto:example@example.com' ],
		[ 'ssh://user:password@127.0.0.1:8080' ],
	] )( 'valid (true): %s', ( url ) => {
		expect( isURL( url ) ).toBe( true );
	} );

	it.each( [
		[ 'http://word press.org' ],
		[ 'http://wordpress.org:port' ],
		[ 'http://[wordpress.org]/' ],
		[ 'HTTP: HyperText Transfer Protocol' ],
		[ 'URLs begin with a http:// prefix' ],
		[ 'Go here: http://wordpress.org' ],
		[ 'http://' ],
		[ 'hello' ],
		[ '' ],
	] )( 'invalid (false): %s', ( url ) => {
		expect( isURL( url ) ).toBe( false );
	} );
} );
