/**
 * WordPress dependencies
 */
import { createRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store, STORE_NAME } from '../store';
import { unlock } from '../lock-unlock';

function createRegistryWithStore() {
	const registry = createRegistry();
	registry.register( store );
	return registry;
}

describe( 'connectors store', () => {
	describe( 'getConnectors', () => {
		it( 'should return the same reference if state has not changed', () => {
			const registry = createRegistryWithStore();
			const { getConnectors } = unlock( registry.select( STORE_NAME ) );

			const first = getConnectors();
			const second = getConnectors();

			expect( first ).toBe( second );
		} );

		it( 'should return a new reference after a connector is registered', () => {
			const registry = createRegistryWithStore();
			const { getConnectors } = unlock( registry.select( STORE_NAME ) );
			const { registerConnector } = unlock(
				registry.dispatch( STORE_NAME )
			);

			const before = getConnectors();

			registerConnector( 'test', {
				label: 'Test',
				description: 'A test connector',
			} );

			const after = getConnectors();

			expect( before ).not.toBe( after );
			expect( after ).toHaveLength( 1 );
			expect( after[ 0 ] ).toMatchObject( {
				slug: 'test',
				label: 'Test',
			} );
		} );
	} );
} );
