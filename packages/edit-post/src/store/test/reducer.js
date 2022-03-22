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
	blockInserterPanel,
	listViewPanel,
} from '../reducer';
import { PREFERENCES_DEFAULTS } from '../defaults';

import { setIsInserterOpened, setIsListViewOpened } from '../actions';

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

	describe( 'blockInserterPanel()', () => {
		it( 'should apply default state', () => {
			expect( blockInserterPanel( undefined, {} ) ).toEqual( false );
		} );

		it( 'should default to returning the same state', () => {
			expect( blockInserterPanel( true, {} ) ).toBe( true );
		} );

		it( 'should set the open state of the inserter panel', () => {
			expect(
				blockInserterPanel( false, setIsInserterOpened( true ) )
			).toBe( true );
			expect(
				blockInserterPanel( true, setIsInserterOpened( false ) )
			).toBe( false );
		} );

		it( 'should close the inserter when opening the list view panel', () => {
			expect(
				blockInserterPanel( true, setIsListViewOpened( true ) )
			).toBe( false );
		} );

		it( 'should not change the state when closing the list view panel', () => {
			expect(
				blockInserterPanel( true, setIsListViewOpened( false ) )
			).toBe( true );
		} );
	} );

	describe( 'listViewPanel()', () => {
		it( 'should apply default state', () => {
			expect( listViewPanel( undefined, {} ) ).toEqual( false );
		} );

		it( 'should default to returning the same state', () => {
			expect( listViewPanel( true, {} ) ).toBe( true );
		} );

		it( 'should set the open state of the list view panel', () => {
			expect( listViewPanel( false, setIsListViewOpened( true ) ) ).toBe(
				true
			);
			expect( listViewPanel( true, setIsListViewOpened( false ) ) ).toBe(
				false
			);
		} );

		it( 'should close the list view when opening the inserter panel', () => {
			expect( listViewPanel( true, setIsInserterOpened( true ) ) ).toBe(
				false
			);
		} );

		it( 'should not change the state when closing the inserter panel', () => {
			expect( listViewPanel( true, setIsInserterOpened( false ) ) ).toBe(
				true
			);
		} );
	} );
} );
