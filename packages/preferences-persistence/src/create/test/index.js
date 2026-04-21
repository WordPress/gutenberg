/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import create from '..';

jest.mock( '@wordpress/api-fetch' );

describe( 'create', () => {
	afterEach( () => {
		apiFetch.mockReset();
	} );

	describe( 'set', () => {
		it( 'stores backup restoration data in localStorage', () => {
			apiFetch.mockResolvedValueOnce();
			const spy = jest.spyOn( global.Storage.prototype, 'setItem' );

			const localStorageRestoreKey = 'test';
			const { set } = create( { localStorageRestoreKey } );

			const data = { test: 1 };
			set( data );

			expect( spy ).toHaveBeenCalledWith(
				localStorageRestoreKey,
				expect.any( String )
			);

			// The second param of the call to `setItem` has been JSON.stringified.
			// Parse it to check it contains the data.
			const setItemDataParam = spy.mock.calls[ 0 ][ 1 ];
			expect( JSON.parse( setItemDataParam ) ).toEqual(
				expect.objectContaining( data )
			);
		} );

		it( 'sends data to the `users/me` endpoint', () => {
			apiFetch.mockResolvedValueOnce();

			const { set } = create();

			const data = { test: 1 };
			set( data );

			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/wp/v2/users/me',
				method: 'PUT',
				keepalive: true,
				data: {
					meta: {
						persisted_preferences: expect.objectContaining( data ),
					},
				},
			} );
		} );
	} );

	describe( 'get', () => {
		it( 'avoids using the REST API or local storage when data is preloaded', async () => {
			const getItemSpy = jest.spyOn(
				global.Storage.prototype,
				'getItem'
			);

			const preloadedData = { preloaded: true };
			const { get } = create( { preloadedData } );
			expect( await get() ).toBe( preloadedData );
			expect( getItemSpy ).not.toHaveBeenCalled();
			expect( apiFetch ).not.toHaveBeenCalled();
		} );

		it( 'returns from a local cache once `set` has been called', async () => {
			const getItemSpy = jest.spyOn(
				global.Storage.prototype,
				'getItem'
			);
			apiFetch.mockResolvedValueOnce();

			const data = { cached: true };
			const { get, set } = create();

			// apiFetch was called as a result of calling `set`.
			set( data );
			expect( apiFetch ).toHaveBeenCalled();
			apiFetch.mockClear();

			// Neither localStorage.getItem or apiFetch are called as a result
			// of the call to `get`. A local cache is used.
			expect( await get() ).toEqual( expect.objectContaining( data ) );
			expect( getItemSpy ).not.toHaveBeenCalled();
			expect( apiFetch ).not.toHaveBeenCalled();
		} );

		it( 'returns data from the users/me endpoint if there is no data in localStorage', async () => {
			const data = {
				__timestamp: 0,
				test: 2,
			};
			apiFetch.mockResolvedValueOnce( {
				meta: { persisted_preferences: data },
			} );

			jest.spyOn(
				global.Storage.prototype,
				'getItem'
			).mockReturnValueOnce( 'null' );

			const { get } = create();
			expect( await get() ).toEqual( data );
		} );

		it( 'returns data from the REST API if it has a more recent modified date than localStorage', async () => {
			const data = {
				_modified: '2022-04-22T00:00:00.000Z',
				test: 'api',
			};
			apiFetch.mockResolvedValueOnce( {
				meta: { persisted_preferences: data },
			} );

			jest.spyOn(
				global.Storage.prototype,
				'getItem'
			).mockReturnValueOnce(
				JSON.stringify( {
					_modified: '2022-04-21T00:00:00.000Z',
					test: 'localStorage',
				} )
			);

			const { get } = create();
			expect( await get() ).toEqual( data );
		} );

		it( 'returns data from localStorage if it has a more recent modified date than data from the REST API', async () => {
			apiFetch.mockResolvedValueOnce( {
				meta: {
					persisted_preferences: {
						_modified: '2022-04-21T00:00:00.000Z',
						test: 'api',
					},
				},
			} );

			const data = {
				_modified: '2022-04-22T00:00:00.000Z',
				test: 'localStorage',
			};
			jest.spyOn(
				global.Storage.prototype,
				'getItem'
			).mockReturnValueOnce( JSON.stringify( data ) );

			const { get } = create();
			expect( await get() ).toEqual( data );
		} );

		it( 'returns an empty object if neither local storage or the REST API return any data', async () => {
			apiFetch.mockResolvedValueOnce( {
				meta: {
					persisted_preferences: null,
				},
			} );
			jest.spyOn(
				global.Storage.prototype,
				'getItem'
			).mockReturnValueOnce( 'null' );

			const { get } = create();
			expect( await get() ).toEqual( {} );
		} );
	} );
} );
