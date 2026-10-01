import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
	createReduxStore,
	createRegistry,
	RegistryProvider,
} from '@wordpress/data';
import { loadFields, useFields } from '../fields-loader';

/*
 * A plugin can bundle this package and run it on a WordPress version whose
 * core data store predates the `getFieldsConfig` selector.
 */
vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => {
	const original = await importOriginal();
	return {
		...original,
		resolveSelect: ( () => ( {} ) ) as typeof original.resolveSelect,
	};
} );

const UNSUPPORTED_MESSAGE =
	'This screen needs a newer version of WordPress to show its fields. Update WordPress, then reload the page.';

describe( 'without the getFieldsConfig selector', () => {
	it( 'rejects loadFields with an error', async () => {
		await expect(
			loadFields( { kind: 'postType', name: 'page' } )
		).rejects.toThrow( UNSUPPORTED_MESSAGE );
	} );

	it( 'returns an error from useFields', () => {
		const registry = createRegistry();
		registry.register(
			createReduxStore( 'core', {
				reducer: ( state = {} ) => state,
				selectors: { getEntityRecord: () => undefined },
			} )
		);

		const { result } = renderHook(
			() => useFields( { kind: 'postType', name: 'page' } ),
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
