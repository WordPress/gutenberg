import { afterEach, describe, expect, it, vi } from 'vitest';
import { __unstableCreatePersistenceLayer } from '..';

describe( '__unstableCreatePersistenceLayer', () => {
	afterEach( () => {
		vi.restoreAllMocks();
		window.localStorage.clear();
	} );

	it( 'loads when local storage is unavailable', async () => {
		vi.resetModules();
		vi.spyOn( window, 'localStorage', 'get' ).mockImplementation( () => {
			throw new Error( 'SecurityError' );
		} );
		const module = await import( '..' );
		expect( () =>
			module.__unstableCreatePersistenceLayer( false, 1 )
		).not.toThrow();
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
