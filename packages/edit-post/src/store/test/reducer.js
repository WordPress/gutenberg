/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import {
	isSavingMetaBoxes,
	metaBoxLocations,
	removedPanels,
	blockInserterPanel,
	listViewPanel,
} from '../reducer';

import { setIsInserterOpened, setIsListViewOpened } from '../actions';

describe( 'state', () => {
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
					normal: [ { id: 'postcustom' } ],
				},
			};

			const state = metaBoxLocations( undefined, action );

			expect( state ).toEqual( {
				normal: [ { id: 'postcustom' } ],
			} );
		} );

		it( 'should merge new meta box locations into the existing ones', () => {
			const oldState = {
				normal: [
					{ id: 'a', title: 'A' },
					{ id: 'b', title: 'B' },
				],
				side: [ { id: 's', title: 'S' } ],
			};
			const action = {
				type: 'SET_META_BOXES_PER_LOCATIONS',
				metaBoxesPerLocation: {
					normal: [
						{ id: 'b', title: 'B-updated' },
						{ id: 'c', title: 'C' },
					],
					advanced: [ { id: 'd', title: 'D' } ],
				},
			};
			const newState = metaBoxLocations( oldState, action );
			expect( newState ).toEqual( {
				normal: [
					{ id: 'a', title: 'A' },
					{ id: 'b', title: 'B-updated' },
					{ id: 'c', title: 'C' },
				],
				advanced: [ { id: 'd', title: 'D' } ],
				side: [ { id: 's', title: 'S' } ],
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
