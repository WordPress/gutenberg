/**
 * Internal dependencies
 */
import reducer, {
	fetchReusableBlocks,
	updateReusableBlock,
	saveReusableBlock,
	convertBlockToStatic,
	convertBlockToReusable,
	getReusableBlock,
	isSavingReusableBlock,
	getReusableBlocks,
} from '../reusable-blocks';

describe( 'reusableBlocks', () => {
	describe( 'reducer', () => {
		it( 'should start out empty', () => {
			const state = reducer( undefined, {} );
			expect( state ).toEqual( {
				data: {},
				isSaving: {},
			} );
		} );

		it( 'should add fetched reusable blocks', () => {
			const reusableBlock = {
				id: '358b59ee-bab3-4d6f-8445-e8c6971a5605',
				name: 'My cool block',
				type: 'core/paragraph',
				attributes: {
					content: 'Hello!',
				},
			};

			const state = reducer( {}, {
				type: 'FETCH_REUSABLE_BLOCKS_SUCCESS',
				reusableBlocks: [ reusableBlock ],
			} );

			expect( state ).toEqual( {
				data: {
					[ reusableBlock.id ]: reusableBlock,
				},
				isSaving: {},
			} );
		} );

		it( 'should add a reusable block', () => {
			const reusableBlock = {
				id: '358b59ee-bab3-4d6f-8445-e8c6971a5605',
				name: 'My cool block',
				type: 'core/paragraph',
				attributes: {
					content: 'Hello!',
				},
			};

			const state = reducer( {}, {
				type: 'UPDATE_REUSABLE_BLOCK',
				id: reusableBlock.id,
				reusableBlock,
			} );

			expect( state ).toEqual( {
				data: {
					[ reusableBlock.id ]: reusableBlock,
				},
				isSaving: {},
			} );
		} );

		it( 'should update a reusable block', () => {
			const id = '358b59ee-bab3-4d6f-8445-e8c6971a5605';
			const initialState = {
				data: {
					[ id ]: {
						id,
						name: 'My cool block',
						type: 'core/paragraph',
						attributes: {
							content: 'Hello!',
							dropCap: true,
						},
					},
				},
				isSaving: {},
			};

			const state = reducer( initialState, {
				type: 'UPDATE_REUSABLE_BLOCK',
				id,
				reusableBlock: {
					name: 'My better block',
					attributes: {
						content: 'Yo!',
					},
				},
			} );

			expect( state ).toEqual( {
				data: {
					[ id ]: {
						id,
						name: 'My better block',
						type: 'core/paragraph',
						attributes: {
							content: 'Yo!',
							dropCap: true,
						},
					},
				},
				isSaving: {},
			} );
		} );

		it( 'should indicate that a reusable block is saving', () => {
			const id = '358b59ee-bab3-4d6f-8445-e8c6971a5605';
			const initialState = {
				data: {},
				isSaving: {},
			};

			const state = reducer( initialState, {
				type: 'SAVE_REUSABLE_BLOCK',
				id,
			} );

			expect( state ).toEqual( {
				data: {},
				isSaving: {
					[ id ]: true,
				},
			} );
		} );

		it( 'should stop indicating that a reusable block is saving when the save succeeded', () => {
			const id = '358b59ee-bab3-4d6f-8445-e8c6971a5605';
			const initialState = {
				data: {},
				isSaving: {
					[ id ]: true,
				},
			};

			const state = reducer( initialState, {
				type: 'SAVE_REUSABLE_BLOCK_SUCCESS',
				id,
			} );

			expect( state ).toEqual( {
				data: {},
				isSaving: {},
			} );
		} );

		it( 'should stop indicating that a reusable block is saving when there is an error', () => {
			const id = '358b59ee-bab3-4d6f-8445-e8c6971a5605';
			const initialState = {
				data: {},
				isSaving: {
					[ id ]: true,
				},
			};

			const state = reducer( initialState, {
				type: 'SAVE_REUSABLE_BLOCK_FAILURE',
				id,
			} );

			expect( state ).toEqual( {
				data: {},
				isSaving: {},
			} );
		} );
	} );

	describe( 'action creators', () => {
		describe( 'fetchReusableBlocks', () => {
			it( 'should return the FETCH_REUSABLE_BLOCKS action', () => {
				expect( fetchReusableBlocks() ).toEqual( {
					type: 'FETCH_REUSABLE_BLOCKS',
				} );
			} );

			it( 'should take an optional id argument', () => {
				const id = '358b59ee-bab3-4d6f-8445-e8c6971a5605';
				expect( fetchReusableBlocks( id ) ).toEqual( {
					type: 'FETCH_REUSABLE_BLOCKS',
					id,
				} );
			} );
		} );

		describe( 'updateReusableBlock', () => {
			it( 'should return the UPDATE_REUSABLE_BLOCK action', () => {
				const id = '358b59ee-bab3-4d6f-8445-e8c6971a5605';
				const reusableBlock = {
					id,
					name: 'My cool block',
					type: 'core/paragraph',
					attributes: {
						content: 'Hello!',
					},
				};
				expect( updateReusableBlock( id, reusableBlock ) ).toEqual( {
					type: 'UPDATE_REUSABLE_BLOCK',
					id,
					reusableBlock,
				} );
			} );
		} );

		describe( 'saveReusableBlock', () => {
			const id = '358b59ee-bab3-4d6f-8445-e8c6971a5605';
			expect( saveReusableBlock( id ) ).toEqual( {
				type: 'SAVE_REUSABLE_BLOCK',
				id,
			} );
		} );

		describe( 'convertBlockToStatic', () => {
			const uid = '358b59ee-bab3-4d6f-8445-e8c6971a5605';
			expect( convertBlockToStatic( uid ) ).toEqual( {
				type: 'CONVERT_BLOCK_TO_STATIC',
				uid,
			} );
		} );

		describe( 'convertBlockToReusable', () => {
			const uid = '358b59ee-bab3-4d6f-8445-e8c6971a5605';
			expect( convertBlockToReusable( uid ) ).toEqual( {
				type: 'CONVERT_BLOCK_TO_REUSABLE',
				uid,
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getReusableBlock', () => {
			it( 'should return a reusable block', () => {
				const id = '358b59ee-bab3-4d6f-8445-e8c6971a5605';
				const expectedReusableBlock = {
					id,
					name: 'My cool block',
					type: 'core/paragraph',
					attributes: {
						content: 'Hello!',
					},
				};
				const state = {
					reusableBlocks: {
						data: {
							[ id ]: expectedReusableBlock,
						},
					},
				};

				const actualReusableBlock = getReusableBlock( state, id );
				expect( actualReusableBlock ).toEqual( expectedReusableBlock );
			} );

			it( 'should return null when no reusable block exists', () => {
				const state = {
					reusableBlocks: {
						data: {},
					},
				};

				const reusableBlock = getReusableBlock( state, '358b59ee-bab3-4d6f-8445-e8c6971a5605' );
				expect( reusableBlock ).toBeNull();
			} );
		} );

		describe( 'isSavingReusableBlock', () => {
			it( 'should return false when the block is not being saved', () => {
				const state = {
					reusableBlocks: {
						isSaving: {},
					},
				};

				const isSaving = isSavingReusableBlock( state, '358b59ee-bab3-4d6f-8445-e8c6971a5605' );
				expect( isSaving ).toBe( false );
			} );

			it( 'should return true when the block is being saved', () => {
				const id = '358b59ee-bab3-4d6f-8445-e8c6971a5605';
				const state = {
					reusableBlocks: {
						isSaving: {
							[ id ]: true,
						},
					},
				};

				const isSaving = isSavingReusableBlock( state, id );
				expect( isSaving ).toBe( true );
			} );
		} );

		describe( 'getReusableBlocks', () => {
			it( 'should return an array of reusable blocks', () => {
				const reusableBlock1 = {
					id: '358b59ee-bab3-4d6f-8445-e8c6971a5605',
					name: 'My cool block',
					type: 'core/paragraph',
					attributes: {
						content: 'Hello!',
					},
				};
				const reusableBlock2 = {
					id: '687e1a87-cca1-41f2-a782-197ddaea9abf',
					name: 'My neat block',
					type: 'core/paragraph',
					attributes: {
						content: 'Goodbye!',
					},
				};
				const state = {
					reusableBlocks: {
						data: {
							[ reusableBlock1.id ]: reusableBlock1,
							[ reusableBlock2.id ]: reusableBlock2,
						},
					},
				};

				const reusableBlocks = getReusableBlocks( state );
				expect( reusableBlocks ).toEqual( [ reusableBlock1, reusableBlock2 ] );
			} );

			it( 'should return an empty array when no reusable blocks exist', () => {
				const state = {
					reusableBlocks: {
						data: {},
					},
				};

				const reusableBlocks = getReusableBlocks( state );
				expect( reusableBlocks ).toEqual( [] );
			} );
		} );
	} );
} );
