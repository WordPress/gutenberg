/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import {
	preferences,
	activeModal,
	isSavingMetaBoxes,
	metaBoxLocations,
	removedPanels,
} from '../reducer';
import { PREFERENCES_DEFAULTS } from '../defaults';

describe( 'state', () => {
	describe( 'preferences()', () => {
		it( 'should apply all defaults', () => {
			const state = preferences( undefined, {} );

			expect( state ).toEqual( PREFERENCES_DEFAULTS );
		} );

		it( 'should disable panels by default', () => {
			const original = deepFreeze( {
				panels: {},
			} );
			const state = preferences( original, {
				type: 'TOGGLE_PANEL_ENABLED',
				panelName: 'post-status',
			} );
			expect( state.panels ).toEqual( {
				'post-status': { enabled: false },
			} );
		} );

		it( 'should disable panels that are enabled', () => {
			const original = deepFreeze( {
				panels: {
					'post-status': { enabled: true },
				},
			} );
			const state = preferences( original, {
				type: 'TOGGLE_PANEL_ENABLED',
				panelName: 'post-status',
			} );
			expect( state.panels ).toEqual( {
				'post-status': { enabled: false },
			} );
		} );

		it( 'should enable panels that are disabled', () => {
			const original = deepFreeze( {
				panels: {
					'post-status': { enabled: false },
				},
			} );
			const state = preferences( original, {
				type: 'TOGGLE_PANEL_ENABLED',
				panelName: 'post-status',
			} );
			expect( state.panels ).toEqual( {
				'post-status': { enabled: true },
			} );
		} );

		it( 'should open panels by default', () => {
			const original = deepFreeze( {
				panels: {},
			} );
			const state = preferences( original, {
				type: 'TOGGLE_PANEL_OPENED',
				panelName: 'post-status',
			} );
			expect( state.panels ).toEqual( {
				'post-status': { opened: true },
			} );
		} );

		it( 'should open panels that are closed', () => {
			const original = deepFreeze( {
				panels: {
					'post-status': { opened: false },
				},
			} );
			const state = preferences( original, {
				type: 'TOGGLE_PANEL_OPENED',
				panelName: 'post-status',
			} );
			expect( state.panels ).toEqual( {
				'post-status': { opened: true },
			} );
		} );

		it( 'should close panels that are opened', () => {
			const original = deepFreeze( {
				panels: {
					'post-status': { opened: true },
				},
			} );
			const state = preferences( original, {
				type: 'TOGGLE_PANEL_OPENED',
				panelName: 'post-status',
			} );
			expect( state.panels ).toEqual( {
				'post-status': { opened: false },
			} );
		} );

		it( 'should open panels that are legacy closed', () => {
			const original = deepFreeze( {
				panels: {
					'post-status': false,
				},
			} );
			const state = preferences( original, {
				type: 'TOGGLE_PANEL_OPENED',
				panelName: 'post-status',
			} );
			expect( state.panels ).toEqual( {
				'post-status': { opened: true },
			} );
		} );

		it( 'should close panels that are legacy opened', () => {
			const original = deepFreeze( {
				panels: {
					'post-status': true,
				},
			} );
			const state = preferences( original, {
				type: 'TOGGLE_PANEL_OPENED',
				panelName: 'post-status',
			} );
			expect( state.panels ).toEqual( {
				'post-status': { opened: false },
			} );
		} );

		it( 'should return switched mode', () => {
			const state = preferences( deepFreeze( { editorMode: 'visual' } ), {
				type: 'SWITCH_MODE',
				mode: 'text',
			} );

			expect( state.editorMode ).toBe( 'text' );
		} );

		it( 'should toggle a feature flag', () => {
			const state = preferences(
				deepFreeze( { features: { chicken: true } } ),
				{
					type: 'TOGGLE_FEATURE',
					feature: 'chicken',
				}
			);

			expect( state.features ).toEqual( { chicken: false } );
		} );

		describe( 'hiddenBlockTypes', () => {
			it( 'concatenates unique names on disable', () => {
				const original = deepFreeze( {
					hiddenBlockTypes: [ 'a', 'b' ],
				} );

				const state = preferences( original, {
					type: 'HIDE_BLOCK_TYPES',
					blockNames: [ 'b', 'c' ],
				} );

				expect( state.hiddenBlockTypes ).toEqual( [ 'a', 'b', 'c' ] );
			} );

			it( 'omits present names by enable', () => {
				const original = deepFreeze( {
					hiddenBlockTypes: [ 'a', 'b' ],
				} );

				const state = preferences( original, {
					type: 'SHOW_BLOCK_TYPES',
					blockNames: [ 'b', 'c' ],
				} );

				expect( state.hiddenBlockTypes ).toEqual( [ 'a' ] );
			} );
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

	describe( 'metaBoxLocations()', () => {
		it( 'should return default state', () => {
			const state = metaBoxLocations( undefined, {} );

			expect( state ).toEqual( {} );
		} );

		it( 'should set the active meta box locations', () => {
			const action = {
				type: 'SET_META_BOXES_PER_LOCATIONS',
				metaBoxesPerLocation: {
					normal: [ 'postcustom' ],
				},
			};

			const state = metaBoxLocations( undefined, action );

			expect( state ).toEqual( {
				normal: [ 'postcustom' ],
			} );
		} );
	} );

	describe( 'removedPanels', () => {
		it( 'should remove panel', () => {
			const original = deepFreeze( [] );
			const state = removedPanels( original, {
				type: 'REMOVE_PANEL',
				panelName: 'post-status',
			} );
			expect( state ).toEqual( [ 'post-status' ] );
		} );

		it( 'should not remove already removed panel', () => {
			const original = deepFreeze( [ 'post-status' ] );
			const state = removedPanels( original, {
				type: 'REMOVE_PANEL',
				panelName: 'post-status',
			} );
			expect( state ).toBe( original );
		} );
	} );
} );
