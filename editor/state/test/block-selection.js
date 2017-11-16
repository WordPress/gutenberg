/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import reducer, {
	focusBlock,
	getMultiSelectedBlockUids,
	getMultiSelectedBlocks,
	getSelectedBlock,
	getMultiSelectedBlocksStartUid,
	getMultiSelectedBlocksEndUid,
	isBlockSelected,
	isBlockWithinSelection,
	isBlockMultiSelected,
	isFirstMultiSelectedBlock,
	getBlockFocus,
} from '../block-selection';

describe( 'blockSelection', () => {
	describe( 'reducer', () => {
		it( 'should return with block uid as selected', () => {
			const state = reducer( undefined, {
				type: 'SELECT_BLOCK',
				uid: 'kumquat',
			} );

			expect( state ).toEqual( { start: 'kumquat', end: 'kumquat', focus: {}, isMultiSelecting: false } );
		} );

		it( 'should set multi selection', () => {
			const original = deepFreeze( { focus: { editable: 'citation' }, isMultiSelecting: false } );
			const state = reducer( original, {
				type: 'MULTI_SELECT',
				start: 'ribs',
				end: 'chicken',
			} );

			expect( state ).toEqual( { start: 'ribs', end: 'chicken', focus: null, isMultiSelecting: false } );
		} );

		it( 'should set continuous multi selection', () => {
			const original = deepFreeze( { focus: { editable: 'citation' }, isMultiSelecting: true } );
			const state = reducer( original, {
				type: 'MULTI_SELECT',
				start: 'ribs',
				end: 'chicken',
			} );

			expect( state ).toEqual( { start: 'ribs', end: 'chicken', focus: { editable: 'citation' }, isMultiSelecting: true } );
		} );

		it( 'should start multi selection', () => {
			const original = deepFreeze( { start: 'ribs', end: 'ribs', focus: { editable: 'citation' }, isMultiSelecting: false } );
			const state = reducer( original, {
				type: 'START_MULTI_SELECT',
			} );

			expect( state ).toEqual( { start: 'ribs', end: 'ribs', focus: { editable: 'citation' }, isMultiSelecting: true } );
		} );

		it( 'should end multi selection with selection', () => {
			const original = deepFreeze( { start: 'ribs', end: 'chicken', focus: { editable: 'citation' }, isMultiSelecting: true } );
			const state = reducer( original, {
				type: 'STOP_MULTI_SELECT',
			} );

			expect( state ).toEqual( { start: 'ribs', end: 'chicken', focus: null, isMultiSelecting: false } );
		} );

		it( 'should end multi selection without selection', () => {
			const original = deepFreeze( { start: 'ribs', end: 'ribs', focus: { editable: 'citation' }, isMultiSelecting: true } );
			const state = reducer( original, {
				type: 'STOP_MULTI_SELECT',
			} );

			expect( state ).toEqual( { start: 'ribs', end: 'ribs', focus: { editable: 'citation' }, isMultiSelecting: false } );
		} );

		it( 'should not update the state if the block is already selected', () => {
			const original = deepFreeze( { start: 'ribs', end: 'ribs' } );

			const state1 = reducer( original, {
				type: 'SELECT_BLOCK',
				uid: 'ribs',
			} );

			expect( state1 ).toBe( original );
		} );

		it( 'should unset multi selection and select inserted block', () => {
			const original = deepFreeze( { start: 'ribs', end: 'chicken' } );

			const state1 = reducer( original, {
				type: 'CLEAR_SELECTED_BLOCK',
			} );

			expect( state1 ).toEqual( { start: null, end: null, focus: null, isMultiSelecting: false } );

			const state3 = reducer( original, {
				type: 'INSERT_BLOCKS',
				blocks: [ {
					uid: 'ribs',
					name: 'core/freeform',
				} ],
			} );

			expect( state3 ).toEqual( { start: 'ribs', end: 'ribs', focus: {}, isMultiSelecting: false } );
		} );

		it( 'should not update the state if the block moved is already selected', () => {
			const original = deepFreeze( { start: 'ribs', end: 'ribs', focus: {} } );
			const state = reducer( original, {
				type: 'MOVE_BLOCKS_UP',
				uids: [ 'ribs' ],
			} );

			expect( state ).toBe( original );
		} );

		it( 'should update the focus and selects the block', () => {
			const state = reducer( undefined, {
				type: 'UPDATE_FOCUS',
				uid: 'chicken',
				config: { editable: 'citation' },
			} );

			expect( state ).toEqual( { start: 'chicken', end: 'chicken', focus: { editable: 'citation' }, isMultiSelecting: false } );
		} );

		it( 'should update the focus and merge the existing state', () => {
			const original = deepFreeze( { start: 'ribs', end: 'ribs', focus: {}, isMultiSelecting: true } );
			const state = reducer( original, {
				type: 'UPDATE_FOCUS',
				uid: 'ribs',
				config: { editable: 'citation' },
			} );

			expect( state ).toEqual( { start: 'ribs', end: 'ribs', focus: { editable: 'citation' }, isMultiSelecting: true } );
		} );

		it( 'should replace the selected block', () => {
			const original = deepFreeze( { start: 'chicken', end: 'chicken', focus: { editable: 'citation' } } );
			const state = reducer( original, {
				type: 'REPLACE_BLOCKS',
				uids: [ 'chicken' ],
				blocks: [ {
					uid: 'wings',
					name: 'core/freeform',
				} ],
			} );

			expect( state ).toEqual( { start: 'wings', end: 'wings', focus: {}, isMultiSelecting: false } );
		} );

		it( 'should keep the selected block', () => {
			const original = deepFreeze( { start: 'chicken', end: 'chicken', focus: { editable: 'citation' } } );
			const state = reducer( original, {
				type: 'REPLACE_BLOCKS',
				uids: [ 'ribs' ],
				blocks: [ {
					uid: 'wings',
					name: 'core/freeform',
				} ],
			} );

			expect( state ).toBe( original );
		} );
	} );

	describe( 'action creators', () => {
		describe( 'focusBlock', () => {
			it( 'should return the UPDATE_FOCUS action', () => {
				const focusConfig = {
					editable: 'cite',
				};

				expect( focusBlock( 'chicken', focusConfig ) ).toEqual( {
					type: 'UPDATE_FOCUS',
					uid: 'chicken',
					config: focusConfig,
				} );
			} );
		} );
	} );

	describe( 'selectors', () => {
		beforeEach( () => {
			getMultiSelectedBlockUids.clear();
			getMultiSelectedBlocks.clear();
		} );

		describe( 'getSelectedBlock', () => {
			it( 'should return null if no block is selected', () => {
				const state = {
					currentPost: {},
					editor: {
						present: {
							blocksByUid: {
								23: { uid: 23, name: 'core/heading' },
								123: { uid: 123, name: 'core/paragraph' },
							},
							edits: {},
						},
					},
					blockSelection: { start: null, end: null },
				};

				expect( getSelectedBlock( state ) ).toBe( null );
			} );

			it( 'should return null if there is multi selection', () => {
				const state = {
					editor: {
						present: {
							blocksByUid: {
								23: { uid: 23, name: 'core/heading' },
								123: { uid: 123, name: 'core/paragraph' },
							},
						},
					},
					blockSelection: { start: 23, end: 123 },
				};

				expect( getSelectedBlock( state ) ).toBe( null );
			} );

			it( 'should return the selected block', () => {
				const state = {
					editor: {
						present: {
							blocksByUid: {
								23: { uid: 23, name: 'core/heading' },
								123: { uid: 123, name: 'core/paragraph' },
							},
						},
					},
					blockSelection: { start: 23, end: 23 },
				};

				expect( getSelectedBlock( state ) ).toBe( state.editor.present.blocksByUid[ 23 ] );
			} );
		} );

		describe( 'getMultiSelectedBlockUids', () => {
			it( 'should return empty if there is no multi selection', () => {
				const state = {
					editor: {
						present: {
							blockOrder: [ 123, 23 ],
						},
					},
					blockSelection: { start: null, end: null },
				};

				expect( getMultiSelectedBlockUids( state ) ).toEqual( [] );
			} );

			it( 'should return selected block uids if there is multi selection', () => {
				const state = {
					editor: {
						present: {
							blockOrder: [ 5, 4, 3, 2, 1 ],
						},
					},
					blockSelection: { start: 2, end: 4 },
				};

				expect( getMultiSelectedBlockUids( state ) ).toEqual( [ 4, 3, 2 ] );
			} );
		} );

		describe( 'getMultiSelectedBlocksStartUid', () => {
			it( 'returns null if there is no multi selection', () => {
				const state = {
					editor: {
						present: {
							blockOrder: [ 123, 23 ],
						},
					},
					blockSelection: { start: null, end: null },
				};

				expect( getMultiSelectedBlocksStartUid( state ) ).toBeNull();
			} );

			it( 'returns multi selection start', () => {
				const state = {
					editor: {
						present: {
							blockOrder: [ 5, 4, 3, 2, 1 ],
						},
					},
					blockSelection: { start: 2, end: 4 },
				};

				expect( getMultiSelectedBlocksStartUid( state ) ).toBe( 2 );
			} );
		} );

		describe( 'getMultiSelectedBlocksEndUid', () => {
			it( 'returns null if there is no multi selection', () => {
				const state = {
					editor: {
						present: {
							blockOrder: [ 123, 23 ],
						},
					},
					blockSelection: { start: null, end: null },
				};

				expect( getMultiSelectedBlocksEndUid( state ) ).toBeNull();
			} );

			it( 'returns multi selection end', () => {
				const state = {
					editor: {
						present: {
							blockOrder: [ 5, 4, 3, 2, 1 ],
						},
					},
					blockSelection: { start: 2, end: 4 },
				};

				expect( getMultiSelectedBlocksEndUid( state ) ).toBe( 4 );
			} );
		} );

		describe( 'isBlockSelected', () => {
			it( 'should return true if the block is selected', () => {
				const state = {
					blockSelection: { start: 123, end: 123 },
				};

				expect( isBlockSelected( state, 123 ) ).toBe( true );
			} );

			it( 'should return false if a multi-selection range exists', () => {
				const state = {
					blockSelection: { start: 123, end: 124 },
				};

				expect( isBlockSelected( state, 123 ) ).toBe( false );
			} );

			it( 'should return false if the block is not selected', () => {
				const state = {
					blockSelection: { start: null, end: null },
				};

				expect( isBlockSelected( state, 23 ) ).toBe( false );
			} );
		} );

		describe( 'isBlockWithinSelection', () => {
			it( 'should return true if the block is selected but not the last', () => {
				const state = {
					blockSelection: { start: 5, end: 3 },
					editor: {
						present: {
							blockOrder: [ 5, 4, 3, 2, 1 ],
						},
					},
				};

				expect( isBlockWithinSelection( state, 4 ) ).toBe( true );
			} );

			it( 'should return false if the block is the last selected', () => {
				const state = {
					blockSelection: { start: 5, end: 3 },
					editor: {
						present: {
							blockOrder: [ 5, 4, 3, 2, 1 ],
						},
					},
				};

				expect( isBlockWithinSelection( state, 3 ) ).toBe( false );
			} );

			it( 'should return false if the block is not selected', () => {
				const state = {
					blockSelection: { start: 5, end: 3 },
					editor: {
						present: {
							blockOrder: [ 5, 4, 3, 2, 1 ],
						},
					},
				};

				expect( isBlockWithinSelection( state, 2 ) ).toBe( false );
			} );

			it( 'should return false if there is no selection', () => {
				const state = {
					blockSelection: {},
					editor: {
						present: {
							blockOrder: [ 5, 4, 3, 2, 1 ],
						},
					},
				};

				expect( isBlockWithinSelection( state, 4 ) ).toBe( false );
			} );
		} );

		describe( 'isBlockMultiSelected', () => {
			const state = {
				editor: {
					present: {
						blockOrder: [ 5, 4, 3, 2, 1 ],
					},
				},
				blockSelection: { start: 2, end: 4 },
			};

			it( 'should return true if the block is multi selected', () => {
				expect( isBlockMultiSelected( state, 3 ) ).toBe( true );
			} );

			it( 'should return false if the block is not multi selected', () => {
				expect( isBlockMultiSelected( state, 5 ) ).toBe( false );
			} );
		} );

		describe( 'isFirstMultiSelectedBlock', () => {
			const state = {
				editor: {
					present: {
						blockOrder: [ 5, 4, 3, 2, 1 ],
					},
				},
				blockSelection: { start: 2, end: 4 },
			};

			it( 'should return true if the block is first in multi selection', () => {
				expect( isFirstMultiSelectedBlock( state, 4 ) ).toBe( true );
			} );

			it( 'should return false if the block is not first in multi selection', () => {
				expect( isFirstMultiSelectedBlock( state, 3 ) ).toBe( false );
			} );
		} );

		describe( 'getBlockFocus', () => {
			it( 'should return the block focus if the block is selected', () => {
				const state = {
					blockSelection: {
						start: 123,
						end: 123,
						focus: { editable: 'cite' },
					},
				};

				expect( getBlockFocus( state, 123 ) ).toEqual( { editable: 'cite' } );
			} );

			it( 'should return the block focus for the start if the block is multi-selected', () => {
				const state = {
					blockSelection: {
						start: 123,
						end: 124,
						focus: { editable: 'cite' },
					},
				};

				expect( getBlockFocus( state, 123 ) ).toEqual( { editable: 'cite' } );
			} );

			it( 'should return null for the end if the block is multi-selected', () => {
				const state = {
					blockSelection: {
						start: 123,
						end: 124,
						focus: { editable: 'cite' },
					},
				};

				expect( getBlockFocus( state, 124 ) ).toEqual( null );
			} );

			it( 'should return null if the block is not selected', () => {
				const state = {
					blockSelection: {
						start: 123,
						end: 123,
						focus: { editable: 'cite' },
					},
				};

				expect( getBlockFocus( state, 23 ) ).toEqual( null );
			} );
		} );
	} );
} );
