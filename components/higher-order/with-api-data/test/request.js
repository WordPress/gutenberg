/**
 * Internal dependencies
 */
import request, {
	cache,
	getStablePath,
	getResponseFromCache,
	getResponseFromNetwork,
	isRequestMethod,
} from '../request';

describe( 'request', () => {
	const actualResponse = {};

	let wpApiRequest;
	beforeEach( () => {
		getStablePath.clear();
		for ( const key in cache ) {
			delete cache[ key ];
		}

		wpApiRequest = wp.apiRequest;
		wp.apiRequest = jest.fn( () => ( {
			promise: () => Promise.resolve( actualResponse ),
		} ) );
	} );

	afterEach( () => {
		wp.apiRequest = wpApiRequest;
	} );

	describe( 'getResponseFromCache()', () => {
		it( 'returns response from cache', () => {
			cache[ getStablePath( '/wp?c=5&a=5&b=5' ) ] = actualResponse;
			const awaitResponse = getResponseFromCache( {
				path: '/wp?b=5&c=5&a=5',
			} );

			expect( awaitResponse ).resolves.toBe( actualResponse );
		} );
	} );

	describe( 'getResponseFromNetwork()', () => {
		it( 'triggers a network request', () => {
			const awaitResponse = getResponseFromNetwork( {
				path: '/wp?b=5&c=5&a=5',
			} );

			return awaitResponse.then( ( data ) => {
				expect( wp.apiRequest ).toHaveBeenCalled();
				expect( data ).toBe( actualResponse );
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
		it( 'should try from cache for GET', () => {
			cache[ getStablePath( '/wp?c=5&a=5&b=5' ) ] = actualResponse;
			const awaitResponse = request( {
				path: '/wp?b=5&c=5&a=5',
				method: 'GET',
			} );

			return awaitResponse.then( ( data ) => {
				expect( wp.apiRequest ).not.toHaveBeenCalled();
				expect( data ).toBe( actualResponse );
			} );
		} );

		it( 'should not try from cache for non-GET', () => {
			cache[ getStablePath( '/wp?c=5&a=5&b=5' ) ] = actualResponse;
			const awaitResponse = request( {
				path: '/wp?b=5&c=5&a=5',
				method: 'POST',
			} );

			return awaitResponse.then( ( data ) => {
				expect( wp.apiRequest ).toHaveBeenCalled();
				expect( data ).toBe( actualResponse );
			} );
		} );

		it( 'should fall back to network', () => {
			const awaitResponse = request( {
				path: '/wp?b=5&c=5&a=5',
				method: 'GET',
			} );

			return awaitResponse.then( ( data ) => {
				expect( wp.apiRequest ).toHaveBeenCalled();
				expect( data ).toBe( actualResponse );
			} );
		} );
	} );
} );
