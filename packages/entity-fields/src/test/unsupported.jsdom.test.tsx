import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
	createReduxStore,
	createRegistry,
	RegistryProvider,
} from '@wordpress/data';
import { loadEntityFields, useEntityFields } from '../entity-fields';

/*
 * A plugin can bundle this package and run it on a WordPress version whose
 * core data store predates the `getFieldsConfig` selector.
 */
vi.mock( '@wordpress/data', async ( importOriginal ) => ( {
	...( await importOriginal< typeof import( '@wordpress/data' ) >() ),
	resolveSelect: () => ( {} ),
} ) );

const UNSUPPORTED_MESSAGE =
	'The fields registered on the server are not available in this version of WordPress.';

describe( 'without the getFieldsConfig selector', () => {
	it( 'rejects loadEntityFields with an error', async () => {
		await expect(
			loadEntityFields( { kind: 'postType', name: 'page' } )
		).rejects.toThrow( UNSUPPORTED_MESSAGE );
	} );

	it( 'returns an error from useEntityFields', () => {
		const registry = createRegistry();
		registry.register(
			createReduxStore( 'core', {
				reducer: ( state = {} ) => state,
				selectors: { getEntityRecord: () => undefined },
			} )
		);

		const { result } = renderHook(
			() => useEntityFields( { kind: 'postType', name: 'page' } ),
			{
				wrapper: ( { children } ) => (
					<RegistryProvider value={ registry }>
						{ children }
					</RegistryProvider>
				),
			}
		);

		expect( result.current.fields ).toEqual( [] );
		expect( result.current.isLoading ).toBe( false );
		expect( result.current.error?.message ).toBe( UNSUPPORTED_MESSAGE );
	} );
} );
