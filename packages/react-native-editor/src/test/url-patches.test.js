/**
 * Internal dependencies
 */
import patchURL from '../patch-url';

/**
 * External dependencies
 */
import { URL as CoreURL } from 'react-native/Libraries/Blob/URL';

// use subclass to test patched prototype without side-effects on other tests
class PatchedCoreURL extends CoreURL {}
patchURL( PatchedCoreURL );

describe( 'core URL.prototype.search', () => {
	it( 'throws not implemented error', () => {
		const url = new CoreURL( '/', 'http://example.com' );
		expect( () => url.search ).toThrow( 'not implemented' );
	} );
} );

describe( 'patched core URL.prototype.search', () => {
	it( 'works without parameters', () => {
		const url = new PatchedCoreURL( '/', 'http://example.com' );
		expect( url.search ).toEqual( '' );
	} );

	it( 'works with parameters', () => {
		const url = new PatchedCoreURL(
			'/test-path/file.extension?query=params&more#anchor',
			'http://example.com'
		);
		expect( url.search ).toBe( '?query=params&more' );
	} );

	it( 'works with key-only parameters', () => {
		const url = new PatchedCoreURL(
			'/test-path?query',
			'http://example.com'
		);
		expect( url.search ).toBe( '?query' );
	} );

	it( 'works with special characters in parameters', () => {
		const url = new PatchedCoreURL(
			'/search?source=hp&ei=tP7kW8-_FoK89QORoa2QBQ&q=test+url&oq=test+url&gs_l=psy-ab.3..0l10',
			'http://example.com'
		);
		expect( url.search ).toBe(
			'?source=hp&ei=tP7kW8-_FoK89QORoa2QBQ&q=test+url&oq=test+url&gs_l=psy-ab.3..0l10'
		);
	} );

	it( 'works with an encoded path', () => {
		const url = new PatchedCoreURL(
			'/this%20is%20a%20test?query',
			'http://example.com'
		);
		expect( url.search ).toBe( '?query' );
	} );

	it( 'works with encoded parameters', () => {
		const url = new PatchedCoreURL(
			'/test?query=something%20with%20spaces',
			'http://example.com'
		);
		expect( url.search ).toBe( '?query=something%20with%20spaces' );
	} );

	it( 'works with bracket parameters', () => {
		const url = new PatchedCoreURL(
			'/beach?foo[]=bar&foo[]=baz',
			'http://example.com'
		);
		expect( url.search ).toBe( '?foo[]=bar&foo[]=baz' );
	} );

	it( 'works with no slash', () => {
		const url = new PatchedCoreURL(
			'?foo[]=bar&foo[]=baz',
			'http://example.com'
		);
		expect( url.search ).toBe( '?foo[]=bar&foo[]=baz' );
	} );

	it( 'works with multiple ?s', () => {
		const url = new PatchedCoreURL(
			'?foo=bar&foo=baz?test',
			'http://example.com'
		);
		expect( url.search ).toBe( '?foo=bar&foo=baz?test' );
	} );
} );
