/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import {
	hasMetaBoxes,
	isSavingMetaBoxes,
	getActiveMetaBoxLocations,
	isMetaBoxLocationActive,
	isEditorPanelRemoved,
	isInserterOpened,
	isListViewOpened,
} from '../selectors';

describe( 'selectors', () => {
	describe( 'isEditorPanelRemoved', () => {
		it( 'should return false by default', () => {
			const state = deepFreeze( {
				removedPanels: [],
			} );

			expect( isEditorPanelRemoved( state, 'post-status' ) ).toBe(
				false
			);
		} );

		it( 'should return true when panel was removed', () => {
			const state = deepFreeze( {
				removedPanels: [ 'post-status' ],
			} );

			expect( isEditorPanelRemoved( state, 'post-status' ) ).toBe( true );
		} );
	} );

	describe( 'hasMetaBoxes', () => {
		it( 'should return true if there are active meta boxes', () => {
			const state = {
				metaBoxes: {
					locations: {
						side: [ 'postcustom' ],
					},
				},
			};

			expect( hasMetaBoxes( state ) ).toBe( true );
		} );

		it( 'should return false if there are no active meta boxes', () => {
			const state = {
				metaBoxes: {
					locations: {
						side: [],
					},
				},
			};

			expect( hasMetaBoxes( state ) ).toBe( false );
		} );
	} );

	describe( 'isSavingMetaBoxes', () => {
		it( 'should return true if some meta boxes are saving', () => {
			const state = {
				metaBoxes: {
					isSaving: true,
					locations: {},
				},
			};

			expect( isSavingMetaBoxes( state ) ).toBe( true );
		} );

		it( 'should return false if no meta boxes are saving', () => {
			const state = {
				metaBoxes: {
					isSaving: false,
					locations: {},
				},
			};

			expect( isSavingMetaBoxes( state ) ).toBe( false );
		} );
	} );

	describe( 'getActiveMetaBoxLocations', () => {
		it( 'should return the active meta boxes', () => {
			const state = {
				metaBoxes: {
					locations: {
						side: [ 'postcustom' ],
						normal: [],
					},
				},
			};

			const result = getActiveMetaBoxLocations( state, 'side' );

			expect( result ).toEqual( [ 'side' ] );
		} );
	} );

	describe( 'isMetaBoxLocationActive', () => {
		it( 'should return false if not active', () => {
			const state = {
				metaBoxes: {
					locations: {
						side: [],
					},
				},
			};

			const result = isMetaBoxLocationActive( state, 'side' );

			expect( result ).toBe( false );
		} );

		it( 'should return true if active', () => {
			const state = {
				metaBoxes: {
					locations: {
						side: [ 'postcustom' ],
					},
				},
			};

			const result = isMetaBoxLocationActive( state, 'side' );

			expect( result ).toBe( true );
		} );
	} );

	describe( 'isInserterOpened', () => {
		it( 'returns the block inserter panel isOpened state', () => {
			const state = {
				blockInserterPanel: true,
			};
			expect( isInserterOpened( state ) ).toBe( true );
			state.blockInserterPanel = false;
			expect( isInserterOpened( state ) ).toBe( false );
		} );
	} );

	describe( 'isListViewOpened', () => {
		it( 'returns the list view panel isOpened state', () => {
			const state = {
				listViewPanel: true,
			};
			expect( isListViewOpened( state ) ).toBe( true );
			state.listViewPanel = false;
			expect( isListViewOpened( state ) ).toBe( false );
		} );
	} );
} );
