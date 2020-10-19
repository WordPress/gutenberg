/**
 * Internal dependencies
 */
import createNonceMiddleware, {
	createSameHostFilter,
	createSameSiteFilter,
} from '../nonce';

describe( 'Nonce middleware', () => {
	it( 'should add a nonce header to the request', () => {
		expect.hasAssertions();

		const nonce = 'nonce';
		const nonceMiddleware = createNonceMiddleware( nonce );
		const requestOptions = {
			method: 'GET',
			path: '/wp/v2/posts',
		};
		const callback = ( options ) => {
			expect( options.headers[ 'X-WP-Nonce' ] ).toBe( nonce );
		};

		nonceMiddleware( requestOptions, callback );
	} );

	it( 'should update the nonce in requests with outdated nonces', () => {
		expect.hasAssertions();

		const nonce = 'new nonce';
		const nonceMiddleware = createNonceMiddleware( nonce );
		const requestOptions = {
			method: 'GET',
			path: '/wp/v2/posts',
			headers: { 'X-WP-Nonce': 'existing nonce' },
		};

		const callback = ( options ) => {
			expect( options.headers[ 'X-WP-Nonce' ] ).toBe( 'new nonce' );
		};

		nonceMiddleware( requestOptions, callback );
	} );

	it( 'should add a nonce header to requests with withNonce set to true', () => {
		expect.hasAssertions();

		const nonce = 'nonce';
		const nonceMiddleware = createNonceMiddleware( nonce );
		const requestOptions = {
			method: 'GET',
			path: '/wp/v2/posts',
			withNonce: true,
		};
		const callback = ( options ) => {
			expect( options.headers ).toHaveProperty( 'X-WP-Nonce' );
		};

		nonceMiddleware( requestOptions, callback );
	} );

	it( 'should not add a nonce header to requests with withNonce set to false', () => {
		expect.hasAssertions();

		const nonce = 'nonce';
		const nonceMiddleware = createNonceMiddleware( nonce );
		const requestOptions = {
			method: 'GET',
			path: '/wp/v2/posts',
			withNonce: false,
		};
		const callback = ( options ) => {
			expect( options.headers ).toBeUndefined();
		};

		nonceMiddleware( requestOptions, callback );
	} );

	it( 'should add a nonce header if requestFilter returns true', () => {
		expect.hasAssertions();

		const nonce = 'nonce';
		const nonceMiddleware = createNonceMiddleware( nonce, {
			requestFilter: () => true,
		} );
		const requestOptions = {
			method: 'GET',
			path: '/wp/v2/posts',
		};
		const callback = ( options ) => {
			expect( options.headers ).toHaveProperty( 'X-WP-Nonce' );
		};

		nonceMiddleware( requestOptions, callback );
	} );

	it( 'should not add a nonce header if requestFilter returns false', () => {
		expect.hasAssertions();

		const nonce = 'nonce';
		const nonceMiddleware = createNonceMiddleware( nonce, {
			requestFilter: () => false,
		} );
		const requestOptions = {
			method: 'GET',
			path: '/wp/v2/posts',
		};
		const callback = ( options ) => {
			expect( options.headers ).toBeUndefined();
		};

		nonceMiddleware( requestOptions, callback );
	} );

	it( 'should not add a nonce header if withNonce is false but requestFilter returns true', () => {
		expect.hasAssertions();

		const nonce = 'nonce';
		const nonceMiddleware = createNonceMiddleware( nonce, {
			requestFilter: () => true,
		} );
		const requestOptions = {
			method: 'GET',
			path: '/wp/v2/posts',
			withNonce: false,
		};
		const callback = ( options ) => {
			expect( options.headers ).toBeUndefined();
		};

		nonceMiddleware( requestOptions, callback );
	} );

	it( 'should not add a nonce header if withNonce is true but requestFilter returns false', () => {
		expect.hasAssertions();

		const nonce = 'nonce';
		const nonceMiddleware = createNonceMiddleware( nonce, {
			requestFilter: () => false,
		} );
		const requestOptions = {
			method: 'GET',
			path: '/wp/v2/posts',
			withNonce: true,
		};
		const callback = ( options ) => {
			expect( options.headers ).toBeUndefined();
		};

		nonceMiddleware( requestOptions, callback );
	} );
} );

describe( 'createSameHostFilter', () => {
	const sameHostFilter = createSameHostFilter(
		'https://wordpress.org/a/b/c'
	);
	it( 'should return true if only path is specified (without a URL)', () => {
		expect( sameHostFilter( { path: '/' } ) ).toBe( true );
	} );
	it( 'should return true for a URL from the same host', () => {
		const urls = [
			'https://wordpress.org/',
			'https://wordpress.org/a',
			'https://wordpress.org/b/c',
		];
		urls.forEach( ( url ) => {
			expect( sameHostFilter( { url } ) ).toBe( true );
		} );
	} );
	it( 'should return false for a URL from a different host', () => {
		const urls = [
			'http://wordpress.org/',
			'https://wordpress.orgg/',
			'https://make.wordpress.org/',
		];
		urls.forEach( ( url ) => {
			expect( sameHostFilter( { url } ) ).toBe( false );
		} );
	} );
} );

describe( 'createSameSiteFilter', () => {
	const sameSiteFilter = createSameSiteFilter(
		'https://wordpress.org/a/b/c'
	);
	it( 'should return true if a matching path is specified (without a URL)', () => {
		const paths = [
			'/a/b/c/',
			'/a/b/c',
			'/a/b/c/?def',
			'/a/b/c/gh/i/j/?kl#mn',
		];
		paths.forEach( ( path ) =>
			expect( sameSiteFilter( { path } ) ).toBe( true )
		);
	} );
	it( 'should return false if a non-matching path is specified (without a URL)', () => {
		const paths = [ '/', '/a/b/d/', '/a/a/b/c' ];
		paths.forEach( ( path ) =>
			expect( sameSiteFilter( { path } ) ).toBe( false )
		);
	} );
	it( 'should return true for a URL under the reference path', () => {
		const urls = [
			'https://wordpress.org/a/b/c/',
			'https://wordpress.org/a/b/c/?def',
			'https://wordpress.org/a/b/c/gh/i/j/?kl#mn',
		];
		urls.forEach( ( url ) => {
			expect( sameSiteFilter( { url } ) ).toBe( true );
		} );
	} );
	it( 'should return false for a URL from a different host or with a non-matching path', () => {
		const urls = [
			'http://wordpress.org/',
			'https://wordpress.orgg/a/b/c',
			'https://make.wordpress.org/',
			'https://wordpress.org/',
			'https://wordpress.org/a',
			'https://wordpress.org/b/c',
		];
		urls.forEach( ( url ) => {
			expect( sameSiteFilter( { url } ) ).toBe( false );
		} );
	} );
} );
