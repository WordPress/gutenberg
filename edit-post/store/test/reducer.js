/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import {
	preferences,
	isSavingMetaBoxes,
	metaBoxes,
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

	describe( 'metaBoxes()', () => {
		it( 'should return default state', () => {
			const actual = metaBoxes( undefined, {} );
			const expected = {
				normal: {
					isActive: false,
				},
				side: {
					isActive: false,
				},
				advanced: {
					isActive: false,
				},
			};

			expect( actual ).toEqual( expected );
		} );

		it( 'should set the sidebar to active', () => {
			const theMetaBoxes = {
				normal: false,
				advanced: false,
				side: true,
			};

			const action = {
				type: 'INITIALIZE_META_BOX_STATE',
				metaBoxes: theMetaBoxes,
			};

			const actual = metaBoxes( undefined, action );
			const expected = {
				normal: {
					isActive: false,
				},
				side: {
					isActive: true,
				},
				advanced: {
					isActive: false,
				},
			};

			expect( actual ).toEqual( expected );
		} );

		it( 'should set the meta boxes saved data', () => {
			const action = {
				type: 'META_BOX_SET_SAVED_DATA',
				dataPerLocation: {
					side: 'a=b',
				},
			};

			const theMetaBoxes = metaBoxes( { normal: { isActive: true }, side: { isActive: false } }, action );
			expect( theMetaBoxes ).toEqual( {
				advanced: { data: undefined },
				normal: { isActive: true, data: undefined },
				side: { isActive: false, data: 'a=b' },
			} );
		} );
	} );
} );
