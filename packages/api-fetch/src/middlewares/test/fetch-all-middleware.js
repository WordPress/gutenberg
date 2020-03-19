/**
 * Internal dependencies
 */
import fetchAllMiddleware from '../fetch-all-middleware';

describe( 'Fetch All Middleware', () => {
	it( 'should defer with the same options to the next middleware', async () => {
		expect.hasAssertions();
		const originalOptions = { path: '/posts' };
		const next = ( options ) => {
			expect( options ).toBe( originalOptions );
			return Promise.resolve( 'ok' );
		};

		await fetchAllMiddleware( originalOptions, next );
	} );

	it( 'should paginate the request', async () => {
		expect.hasAssertions();
		const originalOptions = { url: '/posts?per_page=-1' };
		let counter = 1;
		const next = ( options ) => {
			if ( counter === 1 ) {
				expect( options.url ).toBe( '/posts?per_page=100' );
			} else {
				expect( options.url ).toBe( '/posts?per_page=100&page=2' );
			}
			const response = Promise.resolve( {
				status: 200,
				headers: {
					get() {
						return options.url === '/posts?per_page=100'
							? '</posts?per_page=100&page=2>; rel="next"'
							: '';
					},
				},
				json() {
					return Promise.resolve( [ 'item' ] );
				},
			} );

			counter++;

			return response;
		};

		const result = await fetchAllMiddleware( originalOptions, next );

		expect( result ).toEqual( [ 'item', 'item' ] );
	} );
} );
