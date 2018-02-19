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
				sidebars: {
					desktop: true,
					mobile: false,
					publish: false,
				},
				panels: { 'post-status': true },
				features: { fixedToolbar: false },
			} );
		} );

		it( 'should toggle the given sidebar flag', () => {
			const state = preferences( deepFreeze( { sidebars: {
				mobile: true,
				desktop: true,
			} } ), {
				type: 'TOGGLE_SIDEBAR',
				sidebar: 'desktop',
			} );

			expect( state.sidebars ).toEqual( {
				mobile: true,
				desktop: false,
			} );
		} );

		it( 'should set the sidebar open flag to true if unset', () => {
			const state = preferences( deepFreeze( { sidebars: {
				mobile: true,
			} } ), {
				type: 'TOGGLE_SIDEBAR',
				sidebar: 'desktop',
			} );

			expect( state.sidebars ).toEqual( {
				mobile: true,
				desktop: true,
			} );
		} );

		it( 'should force the given sidebar flag', () => {
			const state = preferences( deepFreeze( { sidebars: {
				mobile: true,
			} } ), {
				type: 'TOGGLE_SIDEBAR',
				sidebar: 'desktop',
				forcedValue: false,
			} );

			expect( state.sidebars ).toEqual( {
				mobile: true,
				desktop: false,
			} );
		} );

		it( 'should set the sidebar panel open flag to true if unset', () => {
			const state = preferences( deepFreeze( {} ), {
				type: 'TOGGLE_SIDEBAR_PANEL',
				panel: 'post-taxonomies',
			} );

			expect( state ).toEqual( { panels: { 'post-taxonomies': true } } );
		} );

		it( 'should toggle the sidebar panel open flag', () => {
			const state = preferences( deepFreeze( { panels: { 'post-taxonomies': true } } ), {
				type: 'TOGGLE_SIDEBAR_PANEL',
				panel: 'post-taxonomies',
			} );

			expect( state ).toEqual( { panels: { 'post-taxonomies': false } } );
		} );

		it( 'should return switched mode', () => {
			const state = preferences( deepFreeze( {} ), {
				type: 'SWITCH_MODE',
				mode: 'text',
			} );

			expect( state ).toEqual( { mode: 'text' } );
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
