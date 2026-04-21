/**
 * Internal dependencies
 */
import isURLLike, { isHashLink, isRelativePath } from '../is-url-like';

describe( 'isURLLike', () => {
	it.each( [ 'https://wordpress.org', 'http://wordpress.org' ] )(
		'returns true for a string that starts with an http(s) protocol',
		( testString ) => {
			expect( isURLLike( testString ) ).toBe( true );
		}
	);

	it.each( [
		'hello world',
		'https://   has spaces even though starts with protocol',
		'www. wordpress . org',
	] )(
		'returns false for any string with spaces (e.g. "%s")',
		( testString ) => {
			expect( isURLLike( testString ) ).toBe( false );
		}
	);

	it( 'returns false for a string without a protocol or a TLD', () => {
		expect( isURLLike( 'somedirectentryhere' ) ).toBe( false );
	} );

	it( 'returns true for a string beginning with www.', () => {
		expect( isURLLike( 'www.wordpress.org' ) ).toBe( true );
	} );

	it.each( [ 'mailto:test@wordpress.org', 'tel:123456' ] )(
		'returns true for common protocols',
		( testString ) => {
			expect( isURLLike( testString ) ).toBe( true );
		}
	);

	it( 'returns true for internal anchor ("hash") links.', () => {
		expect( isURLLike( '#someinternallink' ) ).toBe( true );
	} );

	it.each( [ '/handbook', '/path/to/page', './relative', '../parent' ] )(
		'returns true for relative paths (e.g. "%s")',
		( testString ) => {
			expect( isURLLike( testString ) ).toBe( true );
		}
	);

	// use .each to test multiple cases
	it.each( [
		[ true, 'http://example.com' ],
		[ true, 'https://example.org?query=param' ],
		[ true, 'ftp://example.org?param=value#section' ],
		[ true, 'example.com' ],
		[ true, 'http://example.com?query=param#section' ],
		[ true, 'https://example.org/some/path' ],
		[ true, 'ftp://example.org/some/path' ],
		[ true, 'example.org/some/path' ],
		[ true, 'example_test.tld' ],
		[ true, 'example_test.com' ],
		[ false, 'example' ],
		[ false, '.com' ],
		[ true, '_test.com' ],
		[ true, 'http://example_test.com' ],
	] )(
		'returns %s when testing against string "%s" for a valid TLD',
		( expected, testString ) => {
			expect( isURLLike( testString ) ).toBe( expected );
		}
	);
} );

describe( 'isHashLink', () => {
	it( 'returns true for valid hash links', () => {
		expect( isHashLink( '#section' ) ).toBe( true );
		expect( isHashLink( '#top' ) ).toBe( true );
	} );

	it( 'returns false for invalid links that start with #', () => {
		expect( isHashLink( '# test with space' ) ).toBe( false );
		expect( isHashLink( '#test#multiple' ) ).toBe( false );
	} );

	it( 'returns false for non-hash links', () => {
		expect( isHashLink( '/page' ) ).toBe( false );
		expect( isHashLink( 'https://example.com' ) ).toBe( false );
		expect( isHashLink( 'not a link' ) ).toBe( false );
	} );
} );

describe( 'isRelativePath', () => {
	it( 'returns true for absolute paths starting with /', () => {
		expect( isRelativePath( '/handbook' ) ).toBe( true );
		expect( isRelativePath( '/path/to/page' ) ).toBe( true );
	} );

	it( 'returns true for relative paths starting with ./', () => {
		expect( isRelativePath( './page' ) ).toBe( true );
		expect( isRelativePath( './nested/page' ) ).toBe( true );
	} );

	it( 'returns true for parent relative paths starting with ../', () => {
		expect( isRelativePath( '../page' ) ).toBe( true );
		expect( isRelativePath( '../parent/page' ) ).toBe( true );
	} );

	it( 'returns false for non-relative paths', () => {
		expect( isRelativePath( 'https://example.com' ) ).toBe( false );
		expect( isRelativePath( '#section' ) ).toBe( false );
		expect( isRelativePath( 'www.example.com' ) ).toBe( false );
	} );
} );
