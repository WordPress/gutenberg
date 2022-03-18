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
