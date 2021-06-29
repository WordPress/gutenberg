/**
 * Internal dependencies
 */
import fetchRemoteUrlData from '../__experimental-fetch-remote-url-data';
/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

jest.mock( '@wordpress/api-fetch' );

describe( 'fetchRemoteUrlData', () => {
	afterEach( () => {
		apiFetch.mockReset();
	} );

	describe( 'return value settles as expected', () => {
		it( 'resolves with response data upon fetch success', async () => {
			const data = {
				title: 'Lorem ipsum dolor',
				icon: '',
				image: '',
				description:
					'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
			};
			apiFetch.mockReturnValueOnce( Promise.resolve( data ) );

			await expect(
				fetchRemoteUrlData( 'https://www.wordpress.org' )
			).resolves.toEqual( data );

			expect( apiFetch ).toBeCalledTimes( 1 );
		} );

		it( 'rejects with error upon fetch failure', async () => {
			apiFetch.mockReturnValueOnce( Promise.reject( 'fetch failed' ) );

			await expect(
				fetchRemoteUrlData( 'https://www.wordpress.org/1' )
			).rejects.toEqual( 'fetch failed' );
		} );
	} );

	describe( 'interaction with underlying fetch API', () => {
		it( 'passes options argument through to fetch API', async () => {
			apiFetch.mockReturnValueOnce( Promise.resolve() );

			await fetchRemoteUrlData( 'https://www.wordpress.org/2', {
				method: 'POST',
			} );

			expect( apiFetch ).toBeCalledTimes( 1 );

			const argsPassedToFetchApi = apiFetch.mock.calls[ 0 ][ 0 ];

			expect( argsPassedToFetchApi ).toEqual(
				expect.objectContaining( {
					method: 'POST',
				} )
			);
		} );
	} );

	describe( 'client side caching', () => {
		it( 'caches repeat requests to same url', async () => {
			const targetUrl = 'https://www.wordpress.org/3';
			const data = {
				title: 'Lorem ipsum dolor',
				icon: '',
				image: '',
				description:
					'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
			};
			apiFetch.mockReturnValueOnce( Promise.resolve( data ) );

			await expect( fetchRemoteUrlData( targetUrl ) ).resolves.toEqual(
				data
			);
			expect( apiFetch ).toBeCalledTimes( 1 );

			// Allow us to reassert on calls without it being polluted by first fetch
			// but retains the mock implementation from earlier.
			apiFetch.mockClear();

			// Fetch the same URL again...should be cached.
			await expect( fetchRemoteUrlData( targetUrl ) ).resolves.toEqual(
				data
			);

			// Should now be in cache so no need to refetch from API.
			expect( apiFetch ).toBeCalledTimes( 0 );
		} );

		it( 'does not cache failed requests', async () => {
			const targetUrl = 'https://www.wordpress.org/4';
			const data = {
				title: 'Lorem ipsum dolor',
				icon: '',
				image: '',
				description:
					'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
			};

			apiFetch
				.mockReturnValueOnce( Promise.reject( 'fetch failed' ) )
				.mockReturnValueOnce( Promise.resolve( data ) );

			await expect( fetchRemoteUrlData( targetUrl ) ).rejects.toEqual(
				'fetch failed'
			);

			// Cache should not store the previous failed fetch and should retry
			// with a new fetch.
			await expect( fetchRemoteUrlData( targetUrl ) ).resolves.toEqual(
				data
			);

			expect( apiFetch ).toBeCalledTimes( 2 );
		} );
	} );
} );
