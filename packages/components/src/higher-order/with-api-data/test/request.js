/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import request, {
	cache,
	getStablePath,
	getCachedResponse,
	getResponseFromNetwork,
	isRequestMethod,
} from '../request';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

describe( 'request', () => {
	const actualResponse = {
		json: () => Promise.resolve( {} ),
		headers: {
			connection: 'Keep-Alive',
			'content-type': 'text/plain; charset=utf-8',
		},
	};

	beforeEach( () => {
		getStablePath.clear();
		for ( const key in cache ) {
			delete cache[ key ];
		}

		apiFetch.mockImplementation( () => Promise.resolve( actualResponse ) );
	} );

	describe( 'getCachedResponse()', () => {
		it( 'returns undefined for missing cache', () => {
			const cachedResponse = getCachedResponse( {
				path: '/wp?b=5&c=5&a=5',
				method: 'GET',
			} );

			expect( cachedResponse ).toBe( undefined );
		} );

		it( 'returns undefined for non-GET request', () => {
			cache[ getStablePath( '/wp?c=5&a=5&b=5' ) ] = actualResponse;
			const cachedResponse = getCachedResponse( {
				path: '/wp?b=5&c=5&a=5',
				method: 'POST',
			} );

			expect( cachedResponse ).toBe( undefined );
		} );

		it( 'returns response from cache', () => {
			cache[ getStablePath( '/wp?c=5&a=5&b=5' ) ] = actualResponse;
			const cachedResponse = getCachedResponse( {
				path: '/wp?b=5&c=5&a=5',
				method: 'GET',
			} );

			expect( cachedResponse ).toEqual( actualResponse );
		} );
	} );

	describe( 'getResponseFromNetwork()', () => {
		it( 'triggers a network request', () => {
			const awaitResponse = getResponseFromNetwork( {
				path: '/wp?b=5&c=5&a=5',
			} );

			return awaitResponse.then( ( data ) => {
				expect( apiFetch ).toHaveBeenCalled();
				expect( data ).toEqual( {
					headers: actualResponse.headers,
					body: {},
				} );
			} );
		} );
	} );

	describe( 'getStablePath()', () => {
		it( 'should return a path without query arguments', () => {
			const path = '/wp';

			expect( getStablePath( path ) ).toBe( path );
		} );

		it( 'should return a path with sorted query arguments', () => {
			const a = getStablePath( '/wp?c=5&a=5&b=5' );
			const b = getStablePath( '/wp?b=5&c=5&a=5' );

			expect( a ).toBe( b );
		} );
	} );

	describe( 'isRequestMethod()', () => {
		it( 'returns false if not method', () => {
			expect( isRequestMethod( { method: 'POST' }, 'GET' ) ).toBe( false );
		} );

		it( 'returns true if method', () => {
			expect( isRequestMethod( { method: 'GET' }, 'GET' ) ).toBe( true );
		} );
	} );

	describe( 'request()', () => {
		beforeEach( () => {
			apiFetch.mockClear();
		} );

		it( 'should try from cache for GET', () => {
			cache[ getStablePath( '/wp?c=5&a=5&b=5' ) ] = actualResponse;
			const awaitResponse = request( {
				path: '/wp?b=5&c=5&a=5',
				method: 'GET',
			} );

			return awaitResponse.then( ( data ) => {
				expect( apiFetch ).not.toHaveBeenCalled();
				expect( data ).toEqual( actualResponse );
			} );
		} );

		it( 'should not try from cache for non-GET', () => {
			cache[ getStablePath( '/wp?c=5&a=5&b=5' ) ] = actualResponse;
			const awaitResponse = request( {
				path: '/wp?b=5&c=5&a=5',
				method: 'POST',
			} );

			return awaitResponse.then( ( data ) => {
				expect( apiFetch ).toHaveBeenCalled();
				expect( data ).toEqual( {
					headers: actualResponse.headers,
					body: {},
				} );
			} );
		} );

		it( 'should fall back to network', () => {
			const awaitResponse = request( {
				path: '/wp?b=5&c=5&a=5',
				method: 'GET',
			} );

			return awaitResponse.then( ( data ) => {
				expect( apiFetch ).toHaveBeenCalled();
				expect( data ).toEqual( {
					headers: actualResponse.headers,
					body: {},
				} );
			} );
		} );
	} );
} );
