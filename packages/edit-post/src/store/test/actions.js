/**
 * WordPress dependencies
 */
import { createRegistry } from '@wordpress/data';
import { store as interfaceStore } from '@wordpress/interface';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '..';

function createRegistryWithStores() {
	// Create a registry and register used stores.
	const registry = createRegistry();
	[
		editPostStore,
		noticesStore,
		blockEditorStore,
		coreStore,
		interfaceStore,
		preferencesStore,
		editorStore,
	].forEach( registry.register );
	return registry;
}

describe( 'actions', () => {
	let registry;
	beforeEach( () => {
		registry = createRegistryWithStores();
	} );

	it( 'openGeneralSidebar/closeGeneralSidebar', () => {
		registry.dispatch( editPostStore ).openGeneralSidebar( 'test/sidebar' );
		expect(
			registry
				.select( interfaceStore )
				.getActiveComplementaryArea( 'core/edit-post' )
		).toBe( 'test/sidebar' );

		registry
			.dispatch( editPostStore )
			.closeGeneralSidebar( 'test/sidebar' );
		expect(
			registry
				.select( interfaceStore )
				.getActiveComplementaryArea( 'core/edit-post' )
		).toBeNull();
	} );

	it( 'toggleFeature', () => {
		registry.dispatch( editPostStore ).toggleFeature( 'welcomeGuide' );
		expect(
			registry
				.select( preferencesStore )
				.get( editPostStore.name, 'welcomeGuide' )
		).toBe( true );

		registry.dispatch( editPostStore ).toggleFeature( 'welcomeGuide' );
		expect(
			registry
				.select( preferencesStore )
				.get( editPostStore.name, 'welcomeGuide' )
		).toBe( false );
	} );

	describe( 'switchEditorMode', () => {
		it( 'to visual', () => {
			registry.dispatch( editPostStore ).switchEditorMode( 'visual' );
			expect( registry.select( editPostStore ).getEditorMode() ).toEqual(
				'visual'
			);
		} );

		it( 'to text', () => {
			// Add a selected client id and make sure it's there.
			const clientId = 'clientId_1';
			registry.dispatch( blockEditorStore ).selectionChange( clientId );
			expect(
				registry.select( blockEditorStore ).getSelectedBlockClientId()
			).toEqual( clientId );

			registry.dispatch( editPostStore ).switchEditorMode( 'text' );
			expect(
				registry.select( blockEditorStore ).getSelectedBlockClientId()
			).toBeNull();
		} );
	} );

	it( 'togglePinnedPluginItem', () => {
		registry.dispatch( editPostStore ).togglePinnedPluginItem( 'rigatoni' );
		// Sidebars are pinned by default.
		// @See https://github.com/WordPress/gutenberg/pull/21645
		expect(
			registry
				.select( interfaceStore )
				.isItemPinned( editPostStore.name, 'rigatoni' )
		).toBe( false );
		registry.dispatch( editPostStore ).togglePinnedPluginItem( 'rigatoni' );
		expect(
			registry
				.select( interfaceStore )
				.isItemPinned( editPostStore.name, 'rigatoni' )
		).toBe( true );
	} );

	describe( '__unstableSwitchToTemplateMode', () => {
		it( 'welcome guide is active', () => {
			// Activate `welcomeGuideTemplate` feature.
			registry
				.dispatch( editPostStore )
				.toggleFeature( 'welcomeGuideTemplate' );
			registry.dispatch( editPostStore ).__unstableSwitchToTemplateMode();
			expect(
				registry.select( editPostStore ).isEditingTemplate()
			).toBeTruthy();
			const notices = registry.select( noticesStore ).getNotices();
			expect( notices ).toHaveLength( 0 );
		} );

		it( 'welcome guide is inactive', () => {
			expect(
				registry.select( editPostStore ).isEditingTemplate()
			).toBeFalsy();
			registry.dispatch( editPostStore ).__unstableSwitchToTemplateMode();
			expect(
				registry.select( editPostStore ).isEditingTemplate()
			).toBeTruthy();
			const notices = registry.select( noticesStore ).getNotices();
			expect( notices ).toHaveLength( 1 );
			expect( notices[ 0 ].content ).toMatch( 'template' );
		} );
	} );

	describe( 'hideBlockTypes', () => {
		it( 'adds the hidden block type to the preferences', () => {
			registry
				.dispatch( editPostStore )
				.hideBlockTypes( [ 'core/quote', 'core/table' ] );

			const expected = [ 'core/quote', 'core/table' ];

			// TODO - remove once `getPreference` is deprecated.
			expect(
				registry
					.select( editPostStore )
					.getPreference( 'hiddenBlockTypes' )
			).toEqual( expected );

			expect(
				registry.select( editPostStore ).getHiddenBlockTypes()
			).toEqual( expected );
		} );
	} );

	describe( 'showBlockTypes', () => {
		it( 'removes the hidden block type from the preferences', () => {
			registry
				.dispatch( editPostStore )
				.hideBlockTypes( [ 'core/quote', 'core/table' ] );

			const expectedA = [ 'core/quote', 'core/table' ];

			// TODO - remove once `getPreference` is deprecated.
			expect(
				registry
					.select( editPostStore )
					.getPreference( 'hiddenBlockTypes' )
			).toEqual( expectedA );

			expect(
				registry.select( editPostStore ).getHiddenBlockTypes()
			).toEqual( expectedA );

			registry
				.dispatch( editPostStore )
				.showBlockTypes( [ 'core/table' ] );

			const expectedB = [ 'core/quote' ];

			// TODO - remove once `getPreference` is deprecated.
			expect(
				registry
					.select( editPostStore )
					.getPreference( 'hiddenBlockTypes' )
			).toEqual( expectedB );

			expect(
				registry.select( editPostStore ).getHiddenBlockTypes()
			).toEqual( expectedB );
		} );
	} );

	describe( 'toggleEditorPanelEnabled', () => {
		it( 'toggles panels to be enabled and not enabled', () => {
			const defaultState = {
				'post-status': {
					opened: true,
				},
			};

			// This will switch it off, since the default is on.
			registry
				.dispatch( editPostStore )
				.toggleEditorPanelEnabled( 'control-panel' );

			// TODO - remove once `getPreference` is deprecated.
			expect(
				registry.select( editPostStore ).getPreference( 'panels' )
			).toEqual( {
				...defaultState,
				'control-panel': {
					enabled: false,
				},
			} );

			// Switch it on again.
			registry
				.dispatch( editPostStore )
				.toggleEditorPanelEnabled( 'control-panel' );

			// TODO - remove once `getPreference` is deprecated.
			expect(
				registry.select( editPostStore ).getPreference( 'panels' )
			).toEqual( {
				...defaultState,
				'control-panel': {
					enabled: true,
				},
			} );
		} );
	} );

	describe( 'toggleEditorPanelOpened', () => {
		it( 'toggles panels open and closed', () => {
			const defaultState = {
				'post-status': {
					opened: true,
				},
			};

			// This will open it, since the default is closed.
			registry
				.dispatch( editPostStore )
				.toggleEditorPanelOpened( 'control-panel' );

			// TODO - remove once `getPreference` is deprecated.
			expect(
				registry.select( editPostStore ).getPreference( 'panels' )
			).toEqual( {
				...defaultState,
				'control-panel': {
					opened: true,
				},
			} );

			// Close it.
			registry
				.dispatch( editPostStore )
				.toggleEditorPanelOpened( 'control-panel' );

			// TODO - remove once `getPreference` is deprecated.
			expect(
				registry.select( editPostStore ).getPreference( 'panels' )
			).toEqual( {
				...defaultState,
				'control-panel': {
					opened: false,
				},
			} );
		} );
	} );
} );
