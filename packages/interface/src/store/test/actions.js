/**
 * WordPress dependencies
 */
import { createRegistry } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import { store as interfaceStore } from '../';

function createRegistryWithStores() {
	// Create a registry and register used stores.
	const registry = createRegistry();
	[ interfaceStore, preferencesStore ].forEach( registry.register );
	return registry;
}

describe( 'actions', () => {
	let registry;
	beforeEach( () => {
		registry = createRegistryWithStores();
	} );

	describe( 'enableComplementaryArea', () => {
		it( 'sets a single area as active in the complementary area', () => {
			// Starts off as `undefined`.
			expect(
				registry
					.select( interfaceStore )
					.getActiveComplementaryArea( 'my-plugin' )
			).toBeUndefined();

			registry
				.dispatch( interfaceStore )
				.enableComplementaryArea( 'my-plugin', 'custom-sidebar-1' );

			expect(
				registry
					.select( interfaceStore )
					.getActiveComplementaryArea( 'my-plugin' )
			).toBe( 'custom-sidebar-1' );

			registry
				.dispatch( interfaceStore )
				.enableComplementaryArea( 'my-plugin', 'custom-sidebar-2' );

			expect(
				registry
					.select( interfaceStore )
					.getActiveComplementaryArea( 'my-plugin' )
			).toBe( 'custom-sidebar-2' );
		} );
	} );

	describe( 'disableComplementaryArea', () => {
		it( 'results in the complementary area being inactive', () => {
			registry
				.dispatch( interfaceStore )
				.enableComplementaryArea( 'my-plugin', 'custom-sidebar' );

			expect(
				registry
					.select( interfaceStore )
					.getActiveComplementaryArea( 'my-plugin' )
			).toBe( 'custom-sidebar' );

			registry
				.dispatch( interfaceStore )
				.disableComplementaryArea( 'my-plugin' );

			expect(
				registry
					.select( interfaceStore )
					.getActiveComplementaryArea( 'my-plugin' )
			).toBeNull();
		} );
	} );

	describe( 'pinItem / unpinItem', () => {
		it( 'can be used to pin and unpin multiple items using successive calls', () => {
			// Items are pinned by default.
			expect(
				registry
					.select( interfaceStore )
					.isItemPinned( 'my-plugin', 'ui-item-1' )
			).toBe( true );

			expect(
				registry
					.select( interfaceStore )
					.isItemPinned( 'my-plugin', 'ui-item-2' )
			).toBe( true );

			// Unpinning the default value works.
			registry
				.dispatch( interfaceStore )
				.unpinItem( 'my-plugin', 'ui-item-1' );

			registry
				.dispatch( interfaceStore )
				.unpinItem( 'my-plugin', 'ui-item-2' );

			expect(
				registry
					.select( interfaceStore )
					.isItemPinned( 'my-plugin', 'ui-item-1' )
			).toBe( false );

			expect(
				registry
					.select( interfaceStore )
					.isItemPinned( 'my-plugin', 'ui-item-2' )
			).toBe( false );

			// Now explicitly set the items to be pinned.
			registry
				.dispatch( interfaceStore )
				.pinItem( 'my-plugin', 'ui-item-1' );

			registry
				.dispatch( interfaceStore )
				.pinItem( 'my-plugin', 'ui-item-2' );

			expect(
				registry
					.select( interfaceStore )
					.isItemPinned( 'my-plugin', 'ui-item-1' )
			).toBe( true );

			expect(
				registry
					.select( interfaceStore )
					.isItemPinned( 'my-plugin', 'ui-item-2' )
			).toBe( true );

			// Unpinning should still work.
			registry
				.dispatch( interfaceStore )
				.unpinItem( 'my-plugin', 'ui-item-1' );

			registry
				.dispatch( interfaceStore )
				.unpinItem( 'my-plugin', 'ui-item-2' );

			expect(
				registry
					.select( interfaceStore )
					.isItemPinned( 'my-plugin', 'ui-item-1' )
			).toBe( false );

			expect(
				registry
					.select( interfaceStore )
					.isItemPinned( 'my-plugin', 'ui-item-2' )
			).toBe( false );
		} );
	} );

	describe( 'setFeatureDefaults', () => {
		it( 'results in default values being present', () => {
			registry.dispatch( interfaceStore ).setFeatureDefaults( 'test', {
				feature1: true,
				feature2: false,
			} );

			expect(
				registry
					.select( interfaceStore )
					.isFeatureActive( 'test', 'feature1' )
			).toBe( true );
			expect(
				registry
					.select( interfaceStore )
					.isFeatureActive( 'test', 'feature2' )
			).toBe( false );

			// Expect a deprecation message.
			expect( console ).toHaveWarned();
		} );
	} );

	describe( 'setFeatureValue', () => {
		it( 'sets a feature to a boolean value', () => {
			registry
				.dispatch( interfaceStore )
				.setFeatureValue( 'test', 'feature1', false );
			registry
				.dispatch( interfaceStore )
				.setFeatureValue( 'test', 'feature2', true );
			expect(
				registry
					.select( interfaceStore )
					.isFeatureActive( 'test', 'feature1' )
			).toBe( false );
			expect(
				registry
					.select( interfaceStore )
					.isFeatureActive( 'test', 'feature2' )
			).toBe( true );

			// Expect a deprecation message.
			expect( console ).toHaveWarned();
		} );

		it( 'coerces non-boolean values into booleans', () => {
			registry
				.dispatch( interfaceStore )
				.setFeatureValue( 'test', 'feature1', 'avocado' );
			registry
				.dispatch( interfaceStore )
				.setFeatureValue( 'test', 'feature2', 0 );

			expect(
				registry
					.select( interfaceStore )
					.isFeatureActive( 'test', 'feature1' )
			).toBe( true );
			expect(
				registry
					.select( interfaceStore )
					.isFeatureActive( 'test', 'feature2' )
			).toBe( false );
		} );
	} );

	describe( 'toggleFeature', () => {
		it( 'changes a value that was true to false', () => {
			registry
				.dispatch( interfaceStore )
				.setFeatureValue( 'test', 'feature1', true );
			registry
				.dispatch( interfaceStore )
				.toggleFeature( 'test', 'feature1' );
			expect(
				registry
					.select( interfaceStore )
					.isFeatureActive( 'test', 'feature1' )
			).toBe( false );

			// Expect a deprecation message.
			expect( console ).toHaveWarned();
		} );

		it( 'changes a value that was false to true', () => {
			registry
				.dispatch( interfaceStore )
				.setFeatureValue( 'test', 'feature1', false );
			registry
				.dispatch( interfaceStore )
				.toggleFeature( 'test', 'feature1' );
			expect(
				registry
					.select( interfaceStore )
					.isFeatureActive( 'test', 'feature1' )
			).toBe( true );
		} );
	} );
} );
