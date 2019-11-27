/**
 * Internal dependencies
 */
import createPreloadingMiddleware, { getStablePath } from '../preloading';

describe( 'Preloading Middleware', () => {
	describe( 'getStablePath', () => {
		it( 'returns same value if no query parameters', () => {
			const path = '/foo/bar';

			expect( getStablePath( path ) ).toBe( path );
		} );

		it( 'returns a stable path', () => {
			const abc = getStablePath( '/foo/bar?a=5&b=1&c=2' );
			const bca = getStablePath( '/foo/bar?b=1&c=2&a=5' );
			const bac = getStablePath( '/foo/bar?b=1&a=5&c=2' );
			const acb = getStablePath( '/foo/bar?a=5&c=2&b=1' );
			const cba = getStablePath( '/foo/bar?c=2&b=1&a=5' );
			const cab = getStablePath( '/foo/bar?c=2&a=5&b=1' );

			expect( abc ).toBe( bca );
			expect( bca ).toBe( bac );
			expect( bac ).toBe( acb );
			expect( acb ).toBe( cba );
			expect( cba ).toBe( cab );
		} );
	} );

	it( 'should return the preloaded data if provided', () => {
		const body = {
			status: 'this is the preloaded response',
		};
		const preloadedData = {
			'wp/v2/posts': {
				body,
			},
		};
		const preloadingMiddleware = createPreloadingMiddleware( preloadedData );
		const requestOptions = {
			method: 'GET',
			path: 'wp/v2/posts',
		};

		const response = preloadingMiddleware( requestOptions );
		return response.then( ( value ) => {
			expect( value ).toEqual( body );
		} );
	} );

	it( 'should normalize on stable path', async () => {
		const body = { content: 'example' };
		const preloadedData = {
			'wp/v2/demo-reverse-alphabetical?foo=bar&baz=quux': { body },
			'wp/v2/demo-alphabetical?baz=quux&foo=bar': { body },
		};
		const preloadingMiddleware = createPreloadingMiddleware( preloadedData );

		let requestOptions = {
			method: 'GET',
			path: 'wp/v2/demo-reverse-alphabetical?baz=quux&foo=bar',
		};

		let value = await preloadingMiddleware( requestOptions, () => {} );
		expect( value ).toEqual( body );

		requestOptions = {
			method: 'GET',
			path: 'wp/v2/demo-alphabetical?foo=bar&baz=quux',
		};

		value = await preloadingMiddleware( requestOptions, () => {} );
		expect( value ).toEqual( body );
	} );

	describe.each( [
		[ 'GET' ],
		[ 'OPTIONS' ],
	] )( '%s', ( method ) => {
		describe.each( [
			[ 'all empty', {} ],
			[ 'method empty', { [ method ]: {} } ],
		] )( '%s', ( label, preloadedData ) => {
			it( 'should move to the next middleware if no preloaded data', () => {
				const prelooadingMiddleware = createPreloadingMiddleware( preloadedData );
				const requestOptions = {
					method,
					path: 'wp/v2/posts',
				};

				const callback = ( options ) => {
					expect( options ).toBe( requestOptions );
					return true;
				};

				const ret = prelooadingMiddleware( requestOptions, callback );
				expect( ret ).toBe( true );
			} );
		} );
	} );
} );
