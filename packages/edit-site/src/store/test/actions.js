/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { createRegistry } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { store as preferencesStore } from '@wordpress/preferences';
import {
	store as editorStore,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '..';
import { unlock } from '../../lock-unlock';

const { interfaceStore } = unlock( editorPrivateApis );

function createRegistryWithStores() {
	// create a registry
	const registry = createRegistry();

	// register stores
	registry.register( editorStore );
	registry.register( blockEditorStore );
	registry.register( coreStore );
	registry.register( editSiteStore );
	registry.register( interfaceStore );
	registry.register( noticesStore );
	registry.register( preferencesStore );

	return registry;
}

describe( 'actions', () => {
	describe( 'toggleFeature', () => {
		it( 'should toggle a feature flag', () => {
			const registry = createRegistryWithStores();

			// Should start as undefined.
			expect(
				registry
					.select( preferencesStore )
					.get( 'core/edit-site', 'name' )
			).toBe( undefined );

			// Toggle on.
			registry.dispatch( editSiteStore ).toggleFeature( 'name' );
			expect(
				registry
					.select( preferencesStore )
					.get( 'core/edit-site', 'name' )
			).toBe( true );

			// Toggle off again.
			registry.dispatch( editSiteStore ).toggleFeature( 'name' );
			expect(
				registry
					.select( preferencesStore )
					.get( 'core/edit-site', 'name' )
			).toBe( false );

			// Expect a deprecation warning.
			expect( console ).toHaveWarned();
		} );
	} );

	describe( 'setTemplatePart', () => {
		it( 'should set template part', () => {
			const registry = createRegistryWithStores();

			const ID = 1;
			registry.dispatch( editSiteStore ).setTemplatePart( ID );

			const select = registry.select( editSiteStore );
			expect( select.getEditedPostId() ).toBe( ID );
			expect( select.getEditedPostType() ).toBe( 'wp_template_part' );
		} );
	} );
} );
