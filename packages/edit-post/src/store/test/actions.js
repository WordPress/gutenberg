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

	it( 'openGeneralSidebar - should turn off distraction free mode when opening a general sidebar', () => {
		registry
			.dispatch( preferencesStore )
			.set( 'core/edit-post', 'distractionFree', true );
		registry
			.dispatch( editPostStore )
			.openGeneralSidebar( 'edit-post/block' );
		expect(
			registry
				.select( preferencesStore )
				.get( 'core/edit-post', 'distractionFree' )
		).toBe( false );
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
			// Switch to text first, since the default is visual.
			registry.dispatch( editPostStore ).switchEditorMode( 'text' );
			expect( registry.select( editPostStore ).getEditorMode() ).toEqual(
				'text'
			);
			registry.dispatch( editPostStore ).switchEditorMode( 'visual' );
			expect( registry.select( editPostStore ).getEditorMode() ).toEqual(
				'visual'
			);
		} );

		it( 'to text', () => {
			// It defaults to visual.
			expect( registry.select( editPostStore ).getEditorMode() ).toEqual(
				'visual'
			);
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
			expect( registry.select( editPostStore ).getEditorMode() ).toEqual(
				'text'
			);
		} );
		it( 'should turn off distraction free mode when switching to code editor', () => {
			registry
				.dispatch( preferencesStore )
				.set( 'core/edit-post', 'distractionFree', true );
			registry.dispatch( editPostStore ).switchEditorMode( 'text' );
			expect(
				registry
					.select( preferencesStore )
					.get( 'core/edit-post', 'distractionFree' )
			).toBe( false );
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

			expect(
				registry
					.select( editPostStore )
					.getPreference( 'hiddenBlockTypes' )
			).toEqual( expected );

			expect(
				registry.select( editPostStore ).getHiddenBlockTypes()
			).toEqual( expected );

			// Expect a deprecation message for `getPreference`.
			expect( console ).toHaveWarned();
		} );
	} );

	describe( 'showBlockTypes', () => {
		it( 'removes the hidden block type from the preferences', () => {
			registry
				.dispatch( editPostStore )
				.hideBlockTypes( [ 'core/quote', 'core/table' ] );

			const expectedA = [ 'core/quote', 'core/table' ];

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
			// This will switch it off, since the default is on.
			registry
				.dispatch( editPostStore )
				.toggleEditorPanelEnabled( 'control-panel' );

			expect(
				registry
					.select( editPostStore )
					.isEditorPanelEnabled( 'control-panel' )
			).toBe( false );

			// Also check that the `getPreference` selector includes panels.
			expect(
				registry.select( editPostStore ).getPreference( 'panels' )
			).toEqual( {
				'control-panel': {
					enabled: false,
				},
			} );

			// Switch it on again.
			registry
				.dispatch( editPostStore )
				.toggleEditorPanelEnabled( 'control-panel' );

			expect(
				registry
					.select( editPostStore )
					.isEditorPanelEnabled( 'control-panel' )
			).toBe( true );

			expect(
				registry.select( editPostStore ).getPreference( 'panels' )
			).toEqual( {} );
		} );
	} );

	describe( 'toggleEditorPanelOpened', () => {
		it( 'toggles panels open and closed', () => {
			// This will open it, since the default is closed.
			registry
				.dispatch( editPostStore )
				.toggleEditorPanelOpened( 'control-panel' );

			expect(
				registry
					.select( editPostStore )
					.isEditorPanelOpened( 'control-panel' )
			).toBe( true );

			expect(
				registry.select( editPostStore ).getPreference( 'panels' )
			).toEqual( {
				'control-panel': {
					opened: true,
				},
			} );

			// Close it.
			registry
				.dispatch( editPostStore )
				.toggleEditorPanelOpened( 'control-panel' );

			expect(
				registry
					.select( editPostStore )
					.isEditorPanelOpened( 'control-panel' )
			).toBe( false );

			expect(
				registry.select( editPostStore ).getPreference( 'panels' )
			).toEqual( {} );
		} );
	} );

	describe( 'updatePreferredStyleVariations', () => {
		it( 'sets a preferred style variation for a block when a style name is passed', () => {
			registry
				.dispatch( 'core/edit-post' )
				.updatePreferredStyleVariations( 'core/paragraph', 'fancy' );
			registry
				.dispatch( 'core/edit-post' )
				.updatePreferredStyleVariations( 'core/quote', 'posh' );

			expect(
				registry
					.select( editPostStore )
					.getPreference( 'preferredStyleVariations' )
			).toEqual( {
				'core/paragraph': 'fancy',
				'core/quote': 'posh',
			} );
		} );

		it( 'removes a preferred style variation for a block when a style name is omitted', () => {
			registry
				.dispatch( 'core/edit-post' )
				.updatePreferredStyleVariations( 'core/paragraph', 'fancy' );
			registry
				.dispatch( 'core/edit-post' )
				.updatePreferredStyleVariations( 'core/quote', 'posh' );
			expect(
				registry
					.select( editPostStore )
					.getPreference( 'preferredStyleVariations' )
			).toEqual( {
				'core/paragraph': 'fancy',
				'core/quote': 'posh',
			} );

			registry
				.dispatch( 'core/edit-post' )
				.updatePreferredStyleVariations( 'core/paragraph' );

			expect(
				registry
					.select( editPostStore )
					.getPreference( 'preferredStyleVariations' )
			).toEqual( {
				'core/quote': 'posh',
			} );
		} );
	} );

	describe( 'toggleDistractionFree', () => {
		it( 'should properly update settings to prevent layout corruption when enabling distraction free mode', () => {
			// Enable everything that shouldn't be enabled in distraction free mode.
			registry
				.dispatch( preferencesStore )
				.set( 'core/edit-post', 'fixedToolbar', true );
			registry.dispatch( editPostStore ).setIsListViewOpened( true );
			registry
				.dispatch( editPostStore )
				.openGeneralSidebar( 'edit-post/block' );
			// Initial state is falsy.
			registry.dispatch( editPostStore ).toggleDistractionFree();
			expect(
				registry
					.select( preferencesStore )
					.get( 'core/edit-post', 'fixedToolbar' )
			).toBe( false );
			expect( registry.select( editPostStore ).isListViewOpened() ).toBe(
				false
			);
			expect( registry.select( editPostStore ).isInserterOpened() ).toBe(
				false
			);
			expect(
				registry
					.select( interfaceStore )
					.getActiveComplementaryArea( editPostStore.name )
			).toBeNull();
			expect(
				registry
					.select( preferencesStore )
					.get( 'core/edit-post', 'distractionFree' )
			).toBe( true );
		} );
	} );

	describe( 'setIsListViewOpened', () => {
		it( 'should turn off distraction free mode when opening the list view', () => {
			registry
				.dispatch( preferencesStore )
				.set( 'core/edit-post', 'distractionFree', true );
			registry.dispatch( editPostStore ).setIsListViewOpened( true );
			expect(
				registry
					.select( preferencesStore )
					.get( 'core/edit-post', 'distractionFree' )
			).toBe( false );
		} );
	} );
} );
