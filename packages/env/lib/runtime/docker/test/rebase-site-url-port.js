'use strict';
/**
 * Internal dependencies
 */
const { rebaseSiteUrlPort } = require( '../index' );

describe( 'rebaseSiteUrlPort', () => {
	it( 'returns null when the live port is missing', () => {
		expect( rebaseSiteUrlPort( 'http://localhost:8888', null ) ).toBeNull();
		expect( rebaseSiteUrlPort( 'http://localhost:8888', 0 ) ).toBeNull();
	} );

	it( 'falls back to localhost when the configured site URL is empty', () => {
		expect( rebaseSiteUrlPort( '', 8889 ) ).toBe( 'http://localhost:8889' );
		expect( rebaseSiteUrlPort( undefined, 8889 ) ).toBe(
			'http://localhost:8889'
		);
	} );

	it( 'replaces the port in the configured site URL with the live port', () => {
		expect( rebaseSiteUrlPort( 'http://localhost:8888', 8889 ) ).toBe(
			'http://localhost:8889'
		);
	} );

	it( 'preserves a custom host when rebasing the port', () => {
		expect( rebaseSiteUrlPort( 'http://my.local:8888', 8889 ) ).toBe(
			'http://my.local:8889'
		);
	} );

	it( 'preserves a custom path and scheme when rebasing the port', () => {
		expect( rebaseSiteUrlPort( 'https://my.local:8888/wp', 8889 ) ).toBe(
			'https://my.local:8889/wp'
		);
	} );

	it( 'returns the configured site URL unchanged when it has no port', () => {
		// A user who explicitly set WP_SITEURL without a port wants exactly
		// that URL — don't synthesize one onto it.
		expect( rebaseSiteUrlPort( 'http://example.com', 8889 ) ).toBe(
			'http://example.com'
		);
	} );

	it( 'falls back to localhost when the configured site URL is invalid', () => {
		expect( rebaseSiteUrlPort( 'not a url', 8889 ) ).toBe(
			'http://localhost:8889'
		);
	} );

	it( 'preserves a trailing slash when present in the configured URL', () => {
		expect( rebaseSiteUrlPort( 'http://localhost:8888/', 8889 ) ).toBe(
			'http://localhost:8889/'
		);
	} );

	it( 'does not introduce a trailing slash that the configured URL lacked', () => {
		expect( rebaseSiteUrlPort( 'http://localhost:8888', 8889 ) ).toBe(
			'http://localhost:8889'
		);
	} );
} );
