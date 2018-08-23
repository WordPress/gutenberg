/**
 * Internal dependencies
 */
import createPreloadingMiddleware from '../preloading';

describe( 'Preloading Middleware', () => {
	it( 'should return the preloaded data if provided', () => {
		const body = {
			status: 'this is the preloaded response',
		};
		const preloadedData = {
			GET: {
				'wp/v2/posts': {
					body,
				},
			},
		};
		const prelooadingMiddleware = createPreloadingMiddleware( preloadedData );
		const requestOptions = {
			method: 'GET',
			path: 'wp/v2/posts',
		};

		const response = prelooadingMiddleware( requestOptions );
		return response.then( ( value ) => {
			expect( value ).toEqual( body );
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
