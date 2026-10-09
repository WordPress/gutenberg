import { afterEach, describe, expect, it } from 'vitest';
import { __unstableCreatePersistenceLayer } from '..';

describe( '__unstableCreatePersistenceLayer', () => {
	afterEach( () => {
		window.localStorage.clear();
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
} );
