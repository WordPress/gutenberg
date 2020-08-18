/**
 * Internal dependencies
 */
import createNonceMiddleware from '../nonce';

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

	it( 'should not add a nonce header to requests with nonces', () => {
		expect.hasAssertions();

		const nonce = 'nonce';
		const nonceMiddleware = createNonceMiddleware( nonce );
		const requestOptions = {
			method: 'GET',
			path: '/wp/v2/posts',
			headers: { 'X-WP-Nonce': 'existing nonce' },
		};
		const callback = ( options ) => {
			expect( options ).toBe( requestOptions );
			expect( options.headers[ 'X-WP-Nonce' ] ).toBe( 'existing nonce' );
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

	it( 'should add a nonce header if shouldSendNonce returns true', () => {
		expect.hasAssertions();

		const nonce = 'nonce';
		const nonceMiddleware = createNonceMiddleware( nonce, {
			shouldSendNonce: () => true,
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

	it( 'should not add a nonce header if shouldSendNonce returns false', () => {
		expect.hasAssertions();

		const nonce = 'nonce';
		const nonceMiddleware = createNonceMiddleware( nonce, {
			shouldSendNonce: () => false,
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

	it( 'should not add a nonce header if withNonce is false but shouldSendNonce returns true', () => {
		expect.hasAssertions();

		const nonce = 'nonce';
		const nonceMiddleware = createNonceMiddleware( nonce, {
			shouldSendNonce: () => true,
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

	it( 'should not add a nonce header if withNonce is true but shouldSendNonce returns false', () => {
		expect.hasAssertions();

		const nonce = 'nonce';
		const nonceMiddleware = createNonceMiddleware( nonce, {
			shouldSendNonce: () => false,
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
