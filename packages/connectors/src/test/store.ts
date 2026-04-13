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
				name: 'Test',
				description: 'A test connector',
			} );

			const after = getConnectors();

			expect( before ).not.toBe( after );
			expect( after ).toHaveLength( 1 );
			expect( after[ 0 ] ).toMatchObject( {
				slug: 'test',
				name: 'Test',
			} );
		} );
	} );

	describe( 'registerConnector (upsert)', () => {
		it( 'should merge config when re-registering an existing slug', () => {
			const registry = createRegistryWithStore();
			const { getConnector } = unlock( registry.select( STORE_NAME ) );
			const { registerConnector } = unlock(
				registry.dispatch( STORE_NAME )
			);

			registerConnector( 'test', {
				name: 'Original',
				description: 'Original description',
			} );

			registerConnector( 'test', {
				name: 'Updated',
			} );

			const connector = getConnector( 'test' );
			expect( connector ).toMatchObject( {
				slug: 'test',
				name: 'Updated',
				description: 'Original description',
			} );
		} );

		it( 'should allow updating render and logo independently', () => {
			const registry = createRegistryWithStore();
			const { getConnector } = unlock( registry.select( STORE_NAME ) );
			const { registerConnector } = unlock(
				registry.dispatch( STORE_NAME )
			);

			const originalRender = () => null;
			registerConnector( 'test', {
				name: 'Test',
				description: 'A test connector',
				render: originalRender,
			} );

			const newRender = () => 'updated';
			registerConnector( 'test', {
				render: newRender,
			} );

			const connector = getConnector( 'test' );
			expect( connector?.render ).toBe( newRender );
			expect( connector?.name ).toBe( 'Test' );
			expect( connector?.description ).toBe( 'A test connector' );
		} );
	} );

	describe( 'unregisterConnector', () => {
		it( 'should remove an existing connector', () => {
			const registry = createRegistryWithStore();
			const { getConnectors, getConnector } = unlock(
				registry.select( STORE_NAME )
			);
			const { registerConnector, unregisterConnector } = unlock(
				registry.dispatch( STORE_NAME )
			);

			registerConnector( 'test', {
				name: 'Test',
				description: 'A test connector',
			} );

			expect( getConnectors() ).toHaveLength( 1 );

			unregisterConnector( 'test' );

			expect( getConnectors() ).toHaveLength( 0 );
			expect( getConnector( 'test' ) ).toBeUndefined();
		} );

		it( 'should return a new reference after unregistering', () => {
			const registry = createRegistryWithStore();
			const { getConnectors } = unlock( registry.select( STORE_NAME ) );
			const { registerConnector, unregisterConnector } = unlock(
				registry.dispatch( STORE_NAME )
			);

			registerConnector( 'test', {
				name: 'Test',
				description: 'A test connector',
			} );

			const before = getConnectors();
			unregisterConnector( 'test' );
			const after = getConnectors();

			expect( before ).not.toBe( after );
		} );

		it( 'should be a no-op for a non-existent slug', () => {
			const registry = createRegistryWithStore();
			const { getConnectors } = unlock( registry.select( STORE_NAME ) );
			const { unregisterConnector } = unlock(
				registry.dispatch( STORE_NAME )
			);

			const before = getConnectors();
			unregisterConnector( 'non-existent' );
			const after = getConnectors();

			expect( before ).toBe( after );
		} );
	} );
} );
