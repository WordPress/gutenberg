/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import {
	preferences,
} from '../reducer';

describe( 'state', () => {
	describe( 'preferences()', () => {
		it( 'should apply all defaults', () => {
			const state = preferences( undefined, {} );

			expect( state ).toEqual( {
				activeGeneralSidebar: 'editor',
				activeSidebarPanel: {
					editor: null,
					plugin: null,
				},
				editorMode: 'visual',
				panels: { 'post-status': true },
				features: { fixedToolbar: false },
				viewportType: 'desktop',
			} );
		} );

		it( 'should set the general sidebar active panel', () => {
			const state = preferences( deepFreeze( {
				activeGeneralSidebar: 'editor',
				activeSidebarPanel: {
					editor: null,
					plugin: null,
				},
			} ), {
				type: 'SET_GENERAL_SIDEBAR_ACTIVE_PANEL',
				sidebar: 'editor',
				panel: 'document',
			} );
			expect( state ).toEqual( {
				activeGeneralSidebar: 'editor',
				activeSidebarPanel: {
					editor: 'document',
					plugin: null,
				},
			} );
		} );

		it( 'should set the sidebar panel open flag to true if unset', () => {
			const state = preferences( deepFreeze( {} ), {
				type: 'TOGGLE_GENERAL_SIDEBAR_EDITOR_PANEL',
				panel: 'post-taxonomies',
			} );

			expect( state ).toEqual( { panels: { 'post-taxonomies': true } } );
		} );

		it( 'should toggle the sidebar panel open flag', () => {
			const state = preferences( deepFreeze( { panels: { 'post-taxonomies': true } } ), {
				type: 'TOGGLE_GENERAL_SIDEBAR_EDITOR_PANEL',
				panel: 'post-taxonomies',
			} );

			expect( state ).toEqual( { panels: { 'post-taxonomies': false } } );
		} );

		it( 'should return switched mode', () => {
			const state = preferences( deepFreeze( {} ), {
				type: 'SWITCH_MODE',
				mode: 'text',
			} );

			expect( state ).toEqual( { editorMode: 'text' } );
		} );

		it( 'should toggle a feature flag', () => {
			const state = preferences( deepFreeze( { features: { chicken: true } } ), {
				type: 'TOGGLE_FEATURE',
				feature: 'chicken',
			} );
			expect( state ).toEqual( { features: { chicken: false } } );
		} );
	} );
} );
