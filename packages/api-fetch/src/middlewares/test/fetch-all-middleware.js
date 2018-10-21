/**
 * Internal dependencies
 */
import fetchAllMiddleware from '../fetch-all-middleware';

describe( 'Fetch All Middleware', async () => {
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
		const originalOptions = { path: '/posts?per_page=-1' };
		const next = ( options ) => {
			expect( options.path ).toBe( '/posts?per_page=100' );
			return Promise.resolve( {
				status: 200,
				headers: {
					get() {
						return '';
					},
				},
				json() {
					return Promise.resolve( { message: 'ok' } );
				},
			} );
		};

		await fetchAllMiddleware( originalOptions, next );
	} );
} );
