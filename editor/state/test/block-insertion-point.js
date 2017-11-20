/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import reducer, {
	getBlockInsertionPoint,
	getBlockSiblingInserterPosition,
	isBlockInsertionPointVisible,
} from '../block-insertion-point';

describe( 'blockInsertionPoint', () => {
	describe( 'reducer', () => {
		it( 'should default to an empty object', () => {
			const state = reducer( undefined, {} );

			expect( state ).toEqual( {} );
		} );

		it( 'should set insertion point position', () => {
			const state = reducer( undefined, {
				type: 'SET_BLOCK_INSERTION_POINT',
				position: 5,
			} );

			expect( state ).toEqual( {
				position: 5,
			} );
		} );

		it( 'should clear insertion point position', () => {
			const original = reducer( undefined, {
				type: 'SET_BLOCK_INSERTION_POINT',
				position: 5,
			} );

			const state = reducer( deepFreeze( original ), {
				type: 'CLEAR_BLOCK_INSERTION_POINT',
			} );

			expect( state ).toEqual( {
				position: null,
			} );
		} );

		it( 'should show the insertion point', () => {
			const state = reducer( undefined, {
				type: 'SHOW_INSERTION_POINT',
			} );

			expect( state ).toEqual( { visible: true } );
		} );

		it( 'should clear the insertion point', () => {
			const state = reducer( deepFreeze( {} ), {
				type: 'HIDE_INSERTION_POINT',
			} );

			expect( state ).toEqual( { visible: false } );
		} );

		it( 'should merge position and visible', () => {
			const original = reducer( undefined, {
				type: 'SHOW_INSERTION_POINT',
			} );

			const state = reducer( deepFreeze( original ), {
				type: 'SET_BLOCK_INSERTION_POINT',
				position: 5,
			} );

			expect( state ).toEqual( {
				visible: true,
				position: 5,
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getBlockInsertionPoint', () => {
			it( 'should return the uid of the selected block', () => {
				const state = {
					currentPost: {},
					preferences: { mode: 'visual' },
					blockSelection: {
						start: 2,
						end: 2,
					},
					editor: {
						present: {
							blocksByUid: {
								2: { uid: 2 },
							},
							blockOrder: [ 1, 2, 3 ],
							edits: {},
						},
					},
					blockInsertionPoint: {},
				};

				expect( getBlockInsertionPoint( state ) ).toBe( 2 );
			} );

			it( 'should return the assigned insertion point', () => {
				const state = {
					preferences: { mode: 'visual' },
					blockSelection: {},
					editor: {
						present: {
							blockOrder: [ 1, 2, 3 ],
						},
					},
					blockInsertionPoint: {
						position: 2,
					},
				};

				expect( getBlockInsertionPoint( state ) ).toBe( 2 );
			} );

			it( 'should return the last multi selected uid', () => {
				const state = {
					preferences: { mode: 'visual' },
					blockSelection: {
						start: 1,
						end: 2,
					},
					editor: {
						present: {
							blockOrder: [ 1, 2, 3 ],
						},
					},
					blockInsertionPoint: {},
				};

				expect( getBlockInsertionPoint( state ) ).toBe( 2 );
			} );

			it( 'should return the last block if no selection', () => {
				const state = {
					preferences: { mode: 'visual' },
					blockSelection: { start: null, end: null },
					editor: {
						present: {
							blockOrder: [ 1, 2, 3 ],
						},
					},
					blockInsertionPoint: {},
				};

				expect( getBlockInsertionPoint( state ) ).toBe( 3 );
			} );

			it( 'should return the last block for the text mode', () => {
				const state = {
					preferences: { mode: 'text' },
					blockSelection: { start: 2, end: 2 },
					editor: {
						present: {
							blockOrder: [ 1, 2, 3 ],
						},
					},
					blockInsertionPoint: {},
				};

				expect( getBlockInsertionPoint( state ) ).toBe( 3 );
			} );
		} );

		describe( 'getBlockSiblingInserterPosition', () => {
			it( 'should return null if no sibling insertion point', () => {
				const state = {
					blockInsertionPoint: {},
				};

				expect( getBlockSiblingInserterPosition( state ) ).toBe( null );
			} );

			it( 'should return sibling insertion point', () => {
				const state = {
					blockInsertionPoint: {
						position: 5,
					},
				};

				expect( getBlockSiblingInserterPosition( state ) ).toBe( 5 );
			} );
		} );

		describe( 'isBlockInsertionPointVisible', () => {
			it( 'should return the value in state', () => {
				const state = {
					blockInsertionPoint: {
						visible: true,
					},
				};

				expect( isBlockInsertionPointVisible( state ) ).toBe( true );
			} );
		} );
	} );
} );
