import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ApiFetch } from '../../index';
import type { APIFetchOptions, FetchHandler } from '../../types';

describe( 'Fetch All Middleware', () => {
	beforeEach( vi.resetModules );

	it( 'should defer with the same options to the next middleware', async () => {
		expect.hasAssertions();
		const originalOptions = { path: '/posts' };
		const next: FetchHandler = async ( options ) => {
			expect( options ).toBe( originalOptions );
			return 'ok';
		};

		const { default: fetchAllMiddleware } = await import(
			'../fetch-all-middleware'
		);

		await fetchAllMiddleware( originalOptions, next );
	} );

	it( 'should paginate the request', async () => {
		expect.hasAssertions();
		const originalOptions = { url: '/posts?per_page=-1' };
		let counter = 1;
		vi.doMock( import( '../../index' ), () => {
			const mockApiFetch = ( ( options: APIFetchOptions ) => {
				const expectedUrl =
					counter === 1
						? '/posts?per_page=100'
						: '/posts?per_page=100&page=2';
				expect( options.url ).toBe( expectedUrl );

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
			} ) as ApiFetch;

			return { default: mockApiFetch };
		} );
		const { default: fetchAllMiddleware } = await import(
			'../fetch-all-middleware'
		);
		const result = await fetchAllMiddleware(
			originalOptions,
			async () => {}
		);

		expect( result ).toEqual( [ 'item', 'item' ] );
	} );
} );
