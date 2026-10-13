import { afterEach, describe, expect, it, vi } from 'vitest';
import apiFetch from '@wordpress/api-fetch';
import { __unstableCreatePersistenceLayer } from '..';

vi.mock( import( '@wordpress/api-fetch' ), () => ( {
	default: vi.fn( () => Promise.resolve() ),
} ) );

describe( '__unstableCreatePersistenceLayer', () => {
	afterEach( () => {
		vi.mocked( apiFetch ).mockClear();
		vi.restoreAllMocks();
		window.localStorage.clear();
	} );

	it( 'works when local storage is unavailable', async () => {
		// Import afresh so that reading storage at module load would throw.
		vi.resetModules();
		vi.spyOn( window, 'localStorage', 'get' ).mockImplementation( () => {
			throw new Error( 'SecurityError' );
		} );
		const module = await import( '..' );
		const { get, set } = module.__unstableCreatePersistenceLayer(
			false,
			1
		);
		expect( await get() ).toEqual( {} );
		expect( () => set( { core: { fixedToolbar: true } } ) ).not.toThrow();
		expect( await get() ).toEqual(
			expect.objectContaining( { core: { fixedToolbar: true } } )
		);
	} );

	it( 'prefers server data', async () => {
		const { get } = __unstableCreatePersistenceLayer(
			{ core: { fixedToolbar: true } },
			1
		);
		expect( await get() ).toEqual( { core: { fixedToolbar: true } } );
	} );

	it.each( [ [ [] ], [ '' ], [ false ] ] )(
		'falls back to local storage when server data is %j',
		async ( serverData ) => {
			window.localStorage.setItem(
				'WP_PREFERENCES_USER_1',
				JSON.stringify( { core: { fixedToolbar: true } } )
			);
			const { get } = __unstableCreatePersistenceLayer( serverData, 1 );
			expect( await get() ).toEqual( { core: { fixedToolbar: true } } );
		}
	);

	it.each( [ [ [] ], [ '' ], [ false ] ] )(
		'returns an empty object without fetching when server data is %j',
		async ( serverData ) => {
			const { get } = __unstableCreatePersistenceLayer( serverData, 1 );
			expect( await get() ).toEqual( {} );
			expect( apiFetch ).not.toHaveBeenCalled();
		}
	);

	it( 'falls back to legacy data when server data is an empty array', async () => {
		window.localStorage.setItem(
			'WP_DATA_USER_1',
			JSON.stringify( {
				'core/preferences': {
					preferences: { core: { fixedToolbar: true } },
				},
			} )
		);
		const { get } = __unstableCreatePersistenceLayer( [], 1 );
		expect( await get() ).toEqual( { core: { fixedToolbar: true } } );
	} );

	it.each( [ [ [] ], [ '' ], [ false ] ] )(
		'falls back to legacy data when local data is %j',
		async ( localData ) => {
			window.localStorage.setItem(
				'WP_PREFERENCES_USER_1',
				JSON.stringify( localData )
			);
			window.localStorage.setItem(
				'WP_DATA_USER_1',
				JSON.stringify( {
					'core/preferences': {
						preferences: { core: { fixedToolbar: true } },
					},
				} )
			);
			const { get } = __unstableCreatePersistenceLayer( false, 1 );
			expect( await get() ).toEqual( { core: { fixedToolbar: true } } );
		}
	);
} );
