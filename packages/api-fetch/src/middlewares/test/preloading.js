/**
 * Internal dependencies
 */
import createPreloadingMiddleware from '../preloading';

describe( 'Preloading Middleware', () => {
	it( 'should return the preloaded response body if provided when using a GET request', () => {
		const postsResponse = {
			body: {
				status: 'this is the preloaded response',
			},
		};
		const preloadedData = {
			GET: {
				'wp/v2/posts': postsResponse,
			},
		};
		const preloadingMiddleware = createPreloadingMiddleware( preloadedData );
		const requestOptions = {
			method: 'GET',
			path: 'wp/v2/posts',
		};

		const response = preloadingMiddleware( requestOptions );
		return response.then( ( value ) => {
			expect( value ).toEqual( postsResponse.body );
		} );
	} );

	it( 'should return the preloaded full response data if provided when using an OPTIONS request', () => {
		const postsResponse = {
			headers: {
				test: 'this is a preloaded header',
			},
			body: {
				status: 'this is the preloaded response',
			},
		};

		const preloadedData = {
			OPTIONS: {
				'wp/v2/posts': postsResponse,
			},
		};
		const preloadingMiddleware = createPreloadingMiddleware( preloadedData );
		const requestOptions = {
			method: 'OPTIONS',
			path: 'wp/v2/posts',
		};

		const response = preloadingMiddleware( requestOptions );
		return response.then( ( value ) => {
			expect( value ).toEqual( postsResponse );
		} );
	} );

	it( 'should move to the next middleware if no preloaded data', () => {
		const preloadedData = {};
		const prelooadingMiddleware = createPreloadingMiddleware( preloadedData );
		const requestOptions = {
			method: 'GET',
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
