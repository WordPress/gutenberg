/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import {
	DEFAULT_ACTIVE_GENERAL_SIDEBAR,
	preferences,
	activeGeneralSidebar,
	activeModal,
	isSavingMetaBoxes,
	activeMetaBoxLocations,
} from '../reducer';

describe( 'state', () => {
	describe( 'preferences()', () => {
		it( 'should apply all defaults', () => {
			const state = preferences( undefined, {} );

			expect( state ).toEqual( {
				editorMode: 'visual',
				isGeneralSidebarDismissed: false,
				panels: { 'post-status': true },
				features: { fixedToolbar: false },
				pinnedPluginItems: {},
			} );
		} );

		it( 'should set the general sidebar dismissed', () => {
			const original = deepFreeze( preferences( undefined, {} ) );
			const state = preferences( original, {
				type: 'OPEN_GENERAL_SIDEBAR',
				name: 'edit-post/document',
			} );

			expect( state.isGeneralSidebarDismissed ).toBe( false );
		} );

		it( 'should set the general sidebar undismissed', () => {
			const original = deepFreeze( preferences( undefined, {
				type: 'OPEN_GENERAL_SIDEBAR',
				name: 'edit-post/document',
			} ) );
			const state = preferences( original, {
				type: 'CLOSE_GENERAL_SIDEBAR',
			} );

			expect( state.isGeneralSidebarDismissed ).toBe( true );
		} );

		it( 'should set the sidebar panel open flag to true if unset', () => {
			const state = preferences( deepFreeze( { panels: {} } ), {
				type: 'TOGGLE_GENERAL_SIDEBAR_EDITOR_PANEL',
				panel: 'post-taxonomies',
			} );

			expect( state.panels ).toEqual( { 'post-taxonomies': true } );
		} );

		it( 'should toggle the sidebar panel open flag', () => {
			const state = preferences( deepFreeze( { panels: { 'post-taxonomies': true } } ), {
				type: 'TOGGLE_GENERAL_SIDEBAR_EDITOR_PANEL',
				panel: 'post-taxonomies',
			} );

			expect( state.panels ).toEqual( { 'post-taxonomies': false } );
		} );

		it( 'should return switched mode', () => {
			const state = preferences( deepFreeze( { editorMode: 'visual' } ), {
				type: 'SWITCH_MODE',
				mode: 'text',
			} );

			expect( state.editorMode ).toBe( 'text' );
		} );

		it( 'should toggle a feature flag', () => {
			const state = preferences( deepFreeze( { features: { chicken: true } } ), {
				type: 'TOGGLE_FEATURE',
				feature: 'chicken',
			} );

			expect( state.features ).toEqual( { chicken: false } );
		} );

		describe( 'pinnedPluginItems', () => {
			const initialState = deepFreeze( {
				pinnedPluginItems: {
					'foo/enabled': true,
					'foo/disabled': false,
				},
			} );

			it( 'should disable a pinned plugin flag when the value does not exist', () => {
				const state = preferences( initialState, {
					type: 'TOGGLE_PINNED_PLUGIN_ITEM',
					pluginName: 'foo/does-not-exist',
				} );

				expect( state.pinnedPluginItems[ 'foo/does-not-exist' ] ).toBe( false );
			} );

			it( 'should disable a pinned plugin flag when it is enabled', () => {
				const state = preferences( initialState, {
					type: 'TOGGLE_PINNED_PLUGIN_ITEM',
					pluginName: 'foo/enabled',
				} );

				expect( state.pinnedPluginItems[ 'foo/enabled' ] ).toBe( false );
			} );

			it( 'should enable a pinned plugin flag when it is disabled', () => {
				const state = preferences( initialState, {
					type: 'TOGGLE_PINNED_PLUGIN_ITEM',
					pluginName: 'foo/disabled',
				} );

				expect( state.pinnedPluginItems[ 'foo/disabled' ] ).toBe( true );
			} );
		} );
	} );

	describe( 'activeGeneralSidebar', () => {
		it( 'should default to the default active sidebar', () => {
			const state = activeGeneralSidebar( undefined, {} );

			expect( state ).toBe( DEFAULT_ACTIVE_GENERAL_SIDEBAR );
		} );

		it( 'should set the general sidebar', () => {
			const original = activeGeneralSidebar( undefined, {} );
			const state = activeGeneralSidebar( original, {
				type: 'OPEN_GENERAL_SIDEBAR',
				name: 'edit-post/document',
			} );

			expect( state ).toBe( 'edit-post/document' );
		} );
	} );

	describe( 'activeModal', () => {
		it( 'should default to null', () => {
			const state = activeModal( undefined, {} );
			expect( state ).toBeNull();
		} );

		it( 'should set the activeModal to the provided name', () => {
			const state = activeModal( null, {
				type: 'OPEN_MODAL',
				name: 'test-modal',
			} );

			expect( state ).toEqual( 'test-modal' );
		} );

		it( 'should set the activeModal to null', () => {
			const state = activeModal( 'test-modal', {
				type: 'CLOSE_MODAL',
			} );

			expect( state ).toBeNull();
		} );
	} );

	describe( 'isSavingMetaBoxes', () => {
		it( 'should return default state', () => {
			const actual = isSavingMetaBoxes( undefined, {} );
			expect( actual ).toBe( false );
		} );

		it( 'should set saving flag to true', () => {
			const action = {
				type: 'REQUEST_META_BOX_UPDATES',
			};
			const actual = isSavingMetaBoxes( false, action );

			expect( actual ).toBe( true );
		} );

		it( 'should set saving flag to false', () => {
			const action = {
				type: 'META_BOX_UPDATES_SUCCESS',
			};
			const actual = isSavingMetaBoxes( true, action );

			expect( actual ).toBe( false );
		} );
	} );

	describe( 'activeMetaBoxLocations()', () => {
		it( 'should return default state', () => {
			const state = activeMetaBoxLocations( undefined, {} );

			expect( state ).toEqual( [] );
		} );

		it( 'should set the active meta box locations', () => {
			const action = {
				type: 'SET_ACTIVE_META_BOX_LOCATIONS',
				locations: [ 'normal' ],
			};

			const state = activeMetaBoxLocations( undefined, action );

			expect( state ).toEqual( [ 'normal' ] );
		} );
	} );
} );
