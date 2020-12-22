describe( 'core URL.prototype.search', () => {
	beforeEach( () => {
		URL = global.URL = require( 'react-native/Libraries/Blob/URL' ).URL;
	} );
	it( 'throws not implemented error', () => {
		const url = new URL( '/', 'http://example.com' );
		expect( () => url.search ).toThrow( 'not implemented' );
	} );
} );
describe( 'globals URL.prototype.search', () => {
	beforeEach( () => {
		require( '../globals' );
	} );

	it( 'works without parameters', () => {
		const url = new URL( '/', 'http://example.com' );
		expect( url.search ).toEqual( '' );
	} );

	it( 'works with parameters', () => {
		const url = new URL(
			'/test-path/file.extension?query=params&more#anchor',
			'http://example.com'
		);
		expect( url.search ).toBe( '?query=params&more' );
	} );

	it( 'works with key-only parameters', () => {
		const url = new URL( '/test-path?query', 'http://example.com' );
		expect( url.search ).toBe( '?query' );
	} );

	it( 'works with special characters in parameters', () => {
		const url = new URL(
			'/search?source=hp&ei=tP7kW8-_FoK89QORoa2QBQ&q=test+url&oq=test+url&gs_l=psy-ab.3..0l10',
			'http://example.com'
		);
		expect( url.search ).toBe(
			'?source=hp&ei=tP7kW8-_FoK89QORoa2QBQ&q=test+url&oq=test+url&gs_l=psy-ab.3..0l10'
		);
	} );

	it( 'works with an encoded path', () => {
		const url = new URL(
			'/this%20is%20a%20test?query',
			'http://example.com'
		);
		expect( url.search ).toBe( '?query' );
	} );

	it( 'works with encoded parameters', () => {
		const url = new URL(
			'/test?query=something%20with%20spaces',
			'http://example.com'
		);
		expect( url.search ).toBe( '?query=something%20with%20spaces' );
	} );

	it( 'works with bracket parameters', () => {
		const url = new URL(
			'/beach?foo[]=bar&foo[]=baz',
			'http://example.com'
		);
		expect( url.search ).toBe( '?foo[]=bar&foo[]=baz' );
	} );

	it( 'works with no slash', () => {
		const url = new URL( '?foo[]=bar&foo[]=baz', 'http://example.com' );
		expect( url.search ).toBe( '?foo[]=bar&foo[]=baz' );
	} );

	it( 'works with multiple ?s', () => {
		const url = new URL( '?foo=bar&foo=baz?test', 'http://example.com' );
		expect( url.search ).toBe( '?foo=bar&foo=baz?test' );
	} );
} );
