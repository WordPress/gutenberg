/**
 * Internal dependencies
 */
import isURLLike from '../is-url-like';

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
		[ true, 'this_is_an.example.com' ],
		[ true, 'https://this_is_an.example.com' ],
		[ true, 'https://sub_domain.another_sub.example.org/path' ],
		[ true, 'my-site.com' ],
		[ true, 'https://my-hyphenated-domain.org' ],
		[ true, 'example.com:8080' ],
		[ true, 'https://example.com:3000/path' ],
		[ true, 'https://user@example.com' ],
		[ true, 'https://user:pass@example.org/path' ],
		[ true, 'ftp://anonymous@ftp.example.com' ],
		[
			true,
			'abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnopqrstuvwxyza.com',
		],
		[
			false,
			'abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnopqrstuvwxyzab.com',
		],
		[ false, '-example.com' ],
		[ false, 'example-.com' ],
		[ false, '-example-.com' ],
		[ false, 'https://user@invalid-.org' ],
		[ false, 'example.a' ],
		[ false, 'example.123' ],
		[ false, 'example.c0m' ],
		[ false, 'example_test.tld' ],
		[ false, 'example_test.com' ],
		[ false, '_test.com' ],
		[ false, 'http://example_test.com' ],
		[ false, 'example' ],
		[ false, '.com' ],
	] )(
		'returns %s when testing against string "%s" for a valid TLD',
		( expected, testString ) => {
			expect( isURLLike( testString ) ).toBe( expected );
		}
	);
} );
