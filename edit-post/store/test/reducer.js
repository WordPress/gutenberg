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
				mode: 'visual',
				isSidebarOpened: true,
				panels: { 'post-status': true },
				features: { fixedToolbar: false },
			} );
		} );

		it( 'should toggle the sidebar open flag', () => {
			const state = preferences( deepFreeze( { isSidebarOpened: false } ), {
				type: 'TOGGLE_SIDEBAR',
			} );

			expect( state ).toEqual( { isSidebarOpened: true } );
		} );

		it( 'should set the sidebar panel open flag to true if unset', () => {
			const state = preferences( deepFreeze( { isSidebarOpened: false } ), {
				type: 'TOGGLE_SIDEBAR_PANEL',
				panel: 'post-taxonomies',
			} );

			expect( state ).toEqual( { isSidebarOpened: false, panels: { 'post-taxonomies': true } } );
		} );

		it( 'should toggle the sidebar panel open flag', () => {
			const state = preferences( deepFreeze( { isSidebarOpened: false, panels: { 'post-taxonomies': true } } ), {
				type: 'TOGGLE_SIDEBAR_PANEL',
				panel: 'post-taxonomies',
			} );

			expect( state ).toEqual( { isSidebarOpened: false, panels: { 'post-taxonomies': false } } );
		} );

		it( 'should return switched mode', () => {
			const state = preferences( deepFreeze( { isSidebarOpened: false } ), {
				type: 'SWITCH_MODE',
				mode: 'text',
			} );

			expect( state ).toEqual( { isSidebarOpened: false, mode: 'text' } );
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
