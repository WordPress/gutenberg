/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react-hooks';

/**
 * WordPress dependencies
 */
import { RegistryProvider } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { createRegistry } from '../../../registry';
import useStoreSelectors from '../index';

describe( 'useStoreSelectors', () => {
	let registry;
	beforeEach( () => {
		registry = createRegistry();
	} );

	it( 'wraps useSelect', () => {
		registry.registerStore( 'testStore', {
			reducer: () => ( { foo: 'bar' } ),
			selectors: {
				testSelector: ( state, key ) => state[ key ],
			},
		} );

		const wrapper = ( { children } ) => (
			<RegistryProvider value={ registry }>{ children }</RegistryProvider>
		);

		const useHook = () =>
			useStoreSelectors( 'testStore', ( { testSelector } ) =>
				testSelector( 'foo' )
			);

		const { result } = renderHook( useHook, { wrapper } );

		// ensure expected state was rendered
		expect( result.current ).toEqual( 'bar' );
	} );
} );
