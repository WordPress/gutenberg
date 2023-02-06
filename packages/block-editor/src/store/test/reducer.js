/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * WordPress dependencies
 */
import {
	registerBlockType,
	unregisterBlockType,
	createBlock,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import {
	hasSameKeys,
	isUpdatingSameBlockAttribute,
	blocks,
	isBlockInterfaceHidden,
	isTyping,
	draggedBlocks,
	selection,
	initialPosition,
	isMultiSelecting,
	preferences,
	blocksMode,
	insertionPoint,
	template,
	blockListSettings,
	lastBlockAttributesChange,
	lastBlockInserted,
} from '../reducer';

const noop = () => {};

describe( 'state', () => {
	describe( 'hasSameKeys()', () => {
		it( 'returns false if two objects do not have the same keys', () => {
			const a = { foo: 10 };
			const b = { bar: 10 };

			expect( hasSameKeys( a, b ) ).toBe( false );
		} );

		it( 'returns false if two objects have the same keys', () => {
			const a = { foo: 10 };
			const b = { foo: 20 };

			expect( hasSameKeys( a, b ) ).toBe( true );
		} );
	} );

	describe( 'isUpdatingSameBlockAttribute()', () => {
		it( 'should return false if not updating block attributes', () => {
			const action = {
				type: 'SELECT_BLOCK',
				clientId: '9db792c6-a25a-495d-adbd-97d56a4c4189',
			};
			const previousAction = {
				type: 'SELECT_BLOCK',
				clientId: '9db792c6-a25a-495d-adbd-97d56a4c4189',
			};

			expect(
				isUpdatingSameBlockAttribute( action, previousAction )
			).toBe( false );
		} );

		it( 'should return false if last action was not updating block attributes', () => {
			const action = {
				type: 'UPDATE_BLOCK_ATTRIBUTES',
				clientIds: [ '9db792c6-a25a-495d-adbd-97d56a4c4189' ],
				attributes: {
					foo: 10,
				},
			};
			const previousAction = {
				type: 'SELECT_BLOCK',
				clientId: '9db792c6-a25a-495d-adbd-97d56a4c4189',
			};

			expect(
				isUpdatingSameBlockAttribute( action, previousAction )
			).toBe( false );
		} );

		it( 'should return false if not updating the same block', () => {
			const action = {
				type: 'UPDATE_BLOCK_ATTRIBUTES',
				clientIds: [ '9db792c6-a25a-495d-adbd-97d56a4c4189' ],
				attributes: {
					foo: 10,
				},
			};
			const previousAction = {
				type: 'UPDATE_BLOCK_ATTRIBUTES',
				clientIds: [ 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1' ],
				attributes: {
					foo: 20,
				},
			};

			expect(
				isUpdatingSameBlockAttribute( action, previousAction )
			).toBe( false );
		} );

		it( 'should return false if not updating the same block attributes', () => {
			const action = {
				type: 'UPDATE_BLOCK_ATTRIBUTES',
				clientIds: [ '9db792c6-a25a-495d-adbd-97d56a4c4189' ],
				attributes: {
					foo: 10,
				},
			};
			const previousAction = {
				type: 'UPDATE_BLOCK_ATTRIBUTES',
				clientIds: [ '9db792c6-a25a-495d-adbd-97d56a4c4189' ],
				attributes: {
					bar: 20,
				},
			};

			expect(
				isUpdatingSameBlockAttribute( action, previousAction )
			).toBe( false );
		} );

		it( 'should return false if no previous action', () => {
			const action = {
				type: 'UPDATE_BLOCK_ATTRIBUTES',
				clientIds: [ '9db792c6-a25a-495d-adbd-97d56a4c4189' ],
				attributes: {
					foo: 10,
				},
			};
			const previousAction = undefined;

			expect(
				isUpdatingSameBlockAttribute( action, previousAction )
			).toBe( false );
		} );

		it( 'should return true if updating the same block attributes', () => {
			const action = {
				type: 'UPDATE_BLOCK_ATTRIBUTES',
				clientIds: [ '9db792c6-a25a-495d-adbd-97d56a4c4189' ],
				attributes: {
					foo: 10,
				},
			};
			const previousAction = {
				type: 'UPDATE_BLOCK_ATTRIBUTES',
				clientIds: [ '9db792c6-a25a-495d-adbd-97d56a4c4189' ],
				attributes: {
					foo: 20,
				},
			};

			expect(
				isUpdatingSameBlockAttribute( action, previousAction )
			).toBe( true );
		} );
	} );

	describe( 'blocks()', () => {
		beforeAll( () => {
			registerBlockType( 'core/test-block', {
				save: noop,
				edit: noop,
				category: 'text',
				title: 'test block',
			} );
		} );

		afterAll( () => {
			unregisterBlockType( 'core/test-block' );
		} );

		describe( 'replace inner blocks', () => {
			beforeAll( () => {
				registerBlockType( 'core/test-parent-block', {
					save: noop,
					edit: noop,
					category: 'text',
					title: 'test parent block',
				} );
				registerBlockType( 'core/test-child-block', {
					save: noop,
					edit: noop,
					category: 'text',
					title: 'test child block 1',
					attributes: {
						attr: {
							type: 'boolean',
						},
						attr2: {
							type: 'string',
						},
					},
				} );
			} );

			afterAll( () => {
				unregisterBlockType( 'core/test-parent-block' );
				unregisterBlockType( 'core/test-child-block' );
			} );
			it( 'can replace a child block', () => {
				const existingState = deepFreeze( {
					byClientId: new Map(
						Object.entries( {
							chicken: {
								clientId: 'chicken',
								name: 'core/test-parent-block',
								isValid: true,
							},
							'chicken-child': {
								clientId: 'chicken-child',
								name: 'core/test-child-block',
								isValid: true,
							},
						} )
					),
					attributes: new Map(
						Object.entries( {
							chicken: {},
							'chicken-child': {
								attr: true,
							},
						} )
					),
					order: new Map(
						Object.entries( {
							'': [ 'chicken' ],
							chicken: [ 'chicken-child' ],
							'chicken-child': [],
						} )
					),
					parents: new Map(
						Object.entries( {
							chicken: '',
							'chicken-child': 'chicken',
						} )
					),
					tree: new Map(
						Object.entries( {
							'': {},
							chicken: {},
							'chicken-child': {},
						} )
					),
					controlledInnerBlocks: {},
				} );

				const newChildBlock = createBlock( 'core/test-child-block', {
					attr: false,
					attr2: 'perfect',
				} );

				const { clientId: newChildBlockId } = newChildBlock;

				const action = {
					type: 'REPLACE_INNER_BLOCKS',
					rootClientId: 'chicken',
					blocks: [ newChildBlock ],
				};

				const state = blocks( existingState, action );

				const { tree, ...restState } = state;
				expect( restState ).toEqual( {
					isPersistentChange: true,
					isIgnoredChange: false,
					byClientId: new Map(
						Object.entries( {
							chicken: {
								clientId: 'chicken',
								name: 'core/test-parent-block',
								isValid: true,
							},
							[ newChildBlockId ]: {
								clientId: newChildBlockId,
								name: 'core/test-child-block',
								isValid: true,
							},
						} )
					),
					attributes: new Map(
						Object.entries( {
							chicken: {},
							[ newChildBlockId ]: {
								attr: false,
								attr2: 'perfect',
							},
						} )
					),
					order: new Map(
						Object.entries( {
							'': [ 'chicken' ],
							chicken: [ newChildBlockId ],
							[ newChildBlockId ]: [],
						} )
					),
					parents: new Map(
						Object.entries( {
							[ newChildBlockId ]: 'chicken',
							chicken: '',
						} )
					),
					controlledInnerBlocks: {},
				} );
				expect( state.tree.get( 'chicken' ) ).not.toBe(
					existingState.tree.get( 'chicken' )
				);
			} );

			it( 'can insert a child block', () => {
				const existingState = deepFreeze( {
					byClientId: new Map(
						Object.entries( {
							chicken: {
								clientId: 'chicken',
								name: 'core/test-parent-block',
								isValid: true,
							},
						} )
					),
					attributes: new Map(
						Object.entries( {
							chicken: {},
						} )
					),
					order: new Map(
						Object.entries( {
							'': [ 'chicken' ],
							chicken: [],
						} )
					),
					parents: new Map(
						Object.entries( {
							chicken: '',
						} )
					),
					tree: new Map(
						Object.entries( {
							'': {
								innerBlocks: [],
							},
							chicken: {},
						} )
					),
					controlledInnerBlocks: {},
				} );

				const newChildBlock = createBlock( 'core/test-child-block', {
					attr: false,
					attr2: 'perfect',
				} );

				const { clientId: newChildBlockId } = newChildBlock;

				const action = {
					type: 'REPLACE_INNER_BLOCKS',
					rootClientId: 'chicken',
					blocks: [ newChildBlock ],
				};

				const state = blocks( existingState, action );

				const { tree, ...restState } = state;
				expect( restState ).toEqual( {
					isPersistentChange: true,
					isIgnoredChange: false,
					byClientId: new Map(
						Object.entries( {
							chicken: {
								clientId: 'chicken',
								name: 'core/test-parent-block',
								isValid: true,
							},
							[ newChildBlockId ]: {
								clientId: newChildBlockId,
								name: 'core/test-child-block',
								isValid: true,
							},
						} )
					),
					attributes: new Map(
						Object.entries( {
							chicken: {},
							[ newChildBlockId ]: {
								attr: false,
								attr2: 'perfect',
							},
						} )
					),
					order: new Map(
						Object.entries( {
							'': [ 'chicken' ],
							chicken: [ newChildBlockId ],
							[ newChildBlockId ]: [],
						} )
					),
					parents: new Map(
						Object.entries( {
							[ newChildBlockId ]: 'chicken',
							chicken: '',
						} )
					),
					controlledInnerBlocks: {},
				} );
				expect( state.tree.get( 'chicken' ) ).not.toBe(
					existingState.tree.get( 'chicken' )
				);
				expect( state.tree.get( '' ).innerBlocks[ 0 ] ).toBe(
					state.tree.get( 'chicken' )
				);
				expect( state.tree.get( 'chicken' ).innerBlocks[ 0 ] ).toBe(
					state.tree.get( newChildBlockId )
				);
				expect( state.tree.get( newChildBlockId ) ).toEqual( {
					clientId: newChildBlockId,
					innerBlocks: [],
					isValid: true,
					name: 'core/test-child-block',
					attributes: {
						attr: false,
						attr2: 'perfect',
					},
				} );
			} );

			it( 'can replace multiple child blocks', () => {
				const existingState = deepFreeze( {
					byClientId: new Map(
						Object.entries( {
							chicken: {
								clientId: 'chicken',
								name: 'core/test-parent-block',
								isValid: true,
							},
							'chicken-child': {
								clientId: 'chicken-child',
								name: 'core/test-child-block',
								isValid: true,
							},
							'chicken-child-2': {
								clientId: 'chicken-child',
								name: 'core/test-child-block',
								isValid: true,
							},
						} )
					),
					attributes: new Map(
						Object.entries( {
							chicken: {},
							'chicken-child': {
								attr: true,
							},
							'chicken-child-2': {
								attr2: 'ok',
							},
						} )
					),
					order: new Map(
						Object.entries( {
							'': [ 'chicken' ],
							chicken: [ 'chicken-child', 'chicken-child-2' ],
							'chicken-child': [],
							'chicken-child-2': [],
						} )
					),
					parents: new Map(
						Object.entries( {
							chicken: '',
							'chicken-child': 'chicken',
							'chicken-child-2': 'chicken',
						} )
					),
					tree: new Map(),
					controlledInnerBlocks: {},
				} );

				const newChildBlock1 = createBlock( 'core/test-child-block', {
					attr: false,
					attr2: 'perfect',
				} );

				const newChildBlock2 = createBlock( 'core/test-child-block', {
					attr: true,
					attr2: 'not-perfect',
				} );

				const newChildBlock3 = createBlock( 'core/test-child-block', {
					attr2: 'hello',
				} );

				const { clientId: newChildBlockId1 } = newChildBlock1;
				const { clientId: newChildBlockId2 } = newChildBlock2;
				const { clientId: newChildBlockId3 } = newChildBlock3;

				const action = {
					type: 'REPLACE_INNER_BLOCKS',
					rootClientId: 'chicken',
					blocks: [ newChildBlock1, newChildBlock2, newChildBlock3 ],
				};

				const state = blocks( existingState, action );

				const { tree, ...restState } = state;
				expect( restState ).toEqual( {
					isPersistentChange: true,
					isIgnoredChange: false,
					byClientId: new Map(
						Object.entries( {
							chicken: {
								clientId: 'chicken',
								name: 'core/test-parent-block',
								isValid: true,
							},
							[ newChildBlockId1 ]: {
								clientId: newChildBlockId1,
								name: 'core/test-child-block',
								isValid: true,
							},
							[ newChildBlockId2 ]: {
								clientId: newChildBlockId2,
								name: 'core/test-child-block',
								isValid: true,
							},
							[ newChildBlockId3 ]: {
								clientId: newChildBlockId3,
								name: 'core/test-child-block',
								isValid: true,
							},
						} )
					),
					attributes: new Map(
						Object.entries( {
							chicken: {},
							[ newChildBlockId1 ]: {
								attr: false,
								attr2: 'perfect',
							},
							[ newChildBlockId2 ]: {
								attr: true,
								attr2: 'not-perfect',
							},
							[ newChildBlockId3 ]: {
								attr2: 'hello',
							},
						} )
					),
					order: new Map(
						Object.entries( {
							'': [ 'chicken' ],
							chicken: [
								newChildBlockId1,
								newChildBlockId2,
								newChildBlockId3,
							],
							[ newChildBlockId1 ]: [],
							[ newChildBlockId2 ]: [],
							[ newChildBlockId3 ]: [],
						} )
					),
					parents: new Map(
						Object.entries( {
							chicken: '',
							[ newChildBlockId1 ]: 'chicken',
							[ newChildBlockId2 ]: 'chicken',
							[ newChildBlockId3 ]: 'chicken',
						} )
					),
					controlledInnerBlocks: {},
				} );

				expect( state.tree.get( '' ).innerBlocks[ 0 ] ).toBe(
					state.tree.get( 'chicken' )
				);
				expect( state.tree.get( 'chicken' ).innerBlocks[ 0 ] ).toBe(
					state.tree.get( newChildBlockId1 )
				);
				expect( state.tree.get( 'chicken' ).innerBlocks[ 1 ] ).toBe(
					state.tree.get( newChildBlockId2 )
				);
				expect( state.tree.get( 'chicken' ).innerBlocks[ 2 ] ).toBe(
					state.tree.get( newChildBlockId3 )
				);
				expect( state.tree.get( newChildBlockId1 ) ).toEqual( {
					innerBlocks: [],
					clientId: newChildBlockId1,
					name: 'core/test-child-block',
					isValid: true,
					attributes: {
						attr: false,
						attr2: 'perfect',
					},
				} );
			} );

			it( 'can replace a child block that has other children', () => {
				const existingState = deepFreeze( {
					byClientId: new Map(
						Object.entries( {
							chicken: {
								clientId: 'chicken',
								name: 'core/test-parent-block',
								isValid: true,
							},
							'chicken-child': {
								clientId: 'chicken-child',
								name: 'core/test-child-block',
								isValid: true,
							},
							'chicken-grand-child': {
								clientId: 'chicken-child',
								name: 'core/test-block',
								isValid: true,
							},
						} )
					),
					attributes: new Map(
						Object.entries( {
							chicken: {},
							'chicken-child': {},
							'chicken-grand-child': {},
						} )
					),
					order: new Map(
						Object.entries( {
							'': [ 'chicken' ],
							chicken: [ 'chicken-child' ],
							'chicken-child': [ 'chicken-grand-child' ],
							'chicken-grand-child': [],
						} )
					),
					parents: new Map(
						Object.entries( {
							chicken: '',
							'chicken-child': 'chicken',
							'chicken-grand-child': 'chicken-child',
						} )
					),
					tree: new Map(
						Object.entries( {
							chicken: {},
						} )
					),
					controlledInnerBlocks: {},
				} );

				const newChildBlock = createBlock( 'core/test-block' );

				const { clientId: newChildBlockId } = newChildBlock;

				const action = {
					type: 'REPLACE_INNER_BLOCKS',
					rootClientId: 'chicken',
					blocks: [ newChildBlock ],
				};

				const state = blocks( existingState, action );

				const { tree, ...restState } = state;
				expect( restState ).toEqual( {
					isPersistentChange: true,
					isIgnoredChange: false,
					byClientId: new Map(
						Object.entries( {
							chicken: {
								clientId: 'chicken',
								name: 'core/test-parent-block',
								isValid: true,
							},
							[ newChildBlockId ]: {
								clientId: newChildBlockId,
								name: 'core/test-block',
								isValid: true,
							},
						} )
					),
					attributes: new Map(
						Object.entries( {
							chicken: {},
							[ newChildBlockId ]: {},
						} )
					),
					order: new Map(
						Object.entries( {
							'': [ 'chicken' ],
							chicken: [ newChildBlockId ],
							[ newChildBlockId ]: [],
						} )
					),
					parents: new Map(
						Object.entries( {
							chicken: '',
							[ newChildBlockId ]: 'chicken',
						} )
					),
					controlledInnerBlocks: {},
				} );

				// The block object of the parent should be updated.
				expect( state.tree.get( 'chicken' ) ).not.toBe(
					existingState.tree.get( 'chicken' )
				);
			} );
		} );

		it( 'should return empty byClientId, attributes, order by default', () => {
			const state = blocks( undefined, {} );

			expect( state ).toEqual( {
				byClientId: new Map(),
				attributes: new Map(),
				order: new Map(),
				parents: new Map(),
				isPersistentChange: true,
				isIgnoredChange: false,
				tree: new Map(),
				controlledInnerBlocks: {},
			} );
		} );

		it( 'should key by reset blocks clientId', () => {
			[ undefined, blocks( undefined, {} ) ].forEach( ( original ) => {
				const state = blocks( original, {
					type: 'RESET_BLOCKS',
					blocks: [ { clientId: 'bananas', innerBlocks: [] } ],
				} );

				expect( state.byClientId.size ).toBe( 1 );
				expect( state.byClientId.get( 'bananas' ).clientId ).toBe(
					'bananas'
				);
				expect( Object.fromEntries( state.order ) ).toEqual( {
					'': [ 'bananas' ],
					bananas: [],
				} );
				expect( state.tree.get( 'bananas' ) ).toEqual( {
					clientId: 'bananas',
					innerBlocks: [],
				} );
				expect( state.tree.get( '' ).innerBlocks[ 0 ] ).toBe(
					state.tree.get( 'bananas' )
				);
			} );
		} );

		it( 'should key by reset blocks clientId, including inner blocks', () => {
			const original = blocks( undefined, {} );
			const state = blocks( original, {
				type: 'RESET_BLOCKS',
				blocks: [
					{
						clientId: 'bananas',
						innerBlocks: [
							{ clientId: 'apples', innerBlocks: [] },
						],
					},
				],
			} );

			expect( state.byClientId.size ).toBe( 2 );
			expect( Object.fromEntries( state.order ) ).toEqual( {
				'': [ 'bananas' ],
				apples: [],
				bananas: [ 'apples' ],
			} );
		} );

		it( 'should insert block', () => {
			const original = blocks( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [
					{
						clientId: 'chicken',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
					},
				],
			} );
			const state = blocks( original, {
				type: 'INSERT_BLOCKS',
				blocks: [
					{
						clientId: 'ribs',
						name: 'core/freeform',
						innerBlocks: [],
					},
				],
			} );

			expect( state.byClientId.size ).toBe( 2 );
			expect( state.byClientId.get( 'ribs' ).clientId ).toBe( 'ribs' );
			expect( Object.fromEntries( state.order ) ).toEqual( {
				'': [ 'chicken', 'ribs' ],
				chicken: [],
				ribs: [],
			} );

			expect( state.tree.get( '' ).innerBlocks[ 0 ] ).toBe(
				state.tree.get( 'chicken' )
			);
			expect( state.tree.get( '' ).innerBlocks[ 1 ] ).toBe(
				state.tree.get( 'ribs' )
			);
			expect( state.tree.get( 'chicken' ) ).toEqual( {
				clientId: 'chicken',
				name: 'core/test-block',
				attributes: {},
				innerBlocks: [],
			} );
		} );

		it( 'should replace the block', () => {
			const original = blocks( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [
					{
						clientId: 'chicken',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
					},
				],
			} );
			const state = blocks( original, {
				type: 'REPLACE_BLOCKS',
				clientIds: [ 'chicken' ],
				blocks: [
					{
						clientId: 'wings',
						name: 'core/freeform',
						innerBlocks: [],
					},
				],
			} );

			expect( state.byClientId.size ).toBe( 1 );
			expect( state.byClientId.get( 'wings' ).name ).toBe(
				'core/freeform'
			);
			expect( state.byClientId.get( 'wings' ).clientId ).toBe( 'wings' );
			expect( Object.fromEntries( state.order ) ).toEqual( {
				'': [ 'wings' ],
				wings: [],
			} );
			expect( Object.fromEntries( state.parents ) ).toEqual( {
				wings: '',
			} );
			expect( state.tree.get( '' ).innerBlocks[ 0 ] ).toBe(
				state.tree.get( 'wings' )
			);
			expect( state.tree.get( 'wings' ) ).toEqual( {
				clientId: 'wings',
				name: 'core/freeform',
				innerBlocks: [],
			} );
		} );

		it( 'Replacing the block with an empty list should remove it', () => {
			const original = blocks( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [
					{
						clientId: 'chicken',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
					},
				],
			} );
			const state = blocks( original, {
				type: 'REPLACE_BLOCKS',
				clientIds: [ 'chicken' ],
				blocks: [],
			} );

			expect( state.byClientId.size ).toBe( 0 );
			expect( state.tree.get( '' ).innerBlocks ).toHaveLength( 0 );
		} );

		it( 'should replace the block and remove references to its inner blocks', () => {
			const original = blocks( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [
					{
						clientId: 'chicken',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [
							{
								clientId: 'child',
								name: 'core/test-block',
								attributes: {},
								innerBlocks: [],
							},
						],
					},
				],
			} );
			const state = blocks( original, {
				type: 'REPLACE_BLOCKS',
				clientIds: [ 'chicken' ],
				blocks: [
					{
						clientId: 'wings',
						name: 'core/freeform',
						innerBlocks: [],
					},
				],
			} );

			expect( state.byClientId.size ).toBe( 1 );
			expect( Object.fromEntries( state.order ) ).toEqual( {
				'': [ 'wings' ],
				wings: [],
			} );
			expect( Object.fromEntries( state.parents ) ).toEqual( {
				wings: '',
			} );
			expect( state.tree.get( '' ).innerBlocks[ 0 ] ).toBe(
				state.tree.get( 'wings' )
			);
			expect( state.tree.get( 'wings' ) ).toEqual( {
				clientId: 'wings',
				name: 'core/freeform',
				innerBlocks: [],
			} );
		} );

		it( 'should replace the nested block', () => {
			const nestedBlock = createBlock( 'core/test-block' );
			const wrapperBlock = createBlock( 'core/test-block', {}, [
				nestedBlock,
			] );
			const replacementBlock = createBlock( 'core/test-block' );
			const original = blocks( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ wrapperBlock ],
			} );

			const state = blocks( original, {
				type: 'REPLACE_BLOCKS',
				clientIds: [ nestedBlock.clientId ],
				blocks: [ replacementBlock ],
			} );

			expect( Object.fromEntries( state.order ) ).toEqual( {
				'': [ wrapperBlock.clientId ],
				[ wrapperBlock.clientId ]: [ replacementBlock.clientId ],
				[ replacementBlock.clientId ]: [],
			} );

			expect( Object.fromEntries( state.parents ) ).toEqual( {
				[ wrapperBlock.clientId ]: '',
				[ replacementBlock.clientId ]: wrapperBlock.clientId,
			} );

			expect(
				state.tree.get( wrapperBlock.clientId ).innerBlocks[ 0 ]
			).toBe( state.tree.get( replacementBlock.clientId ) );
			expect( state.tree.get( replacementBlock.clientId ) ).toEqual( {
				clientId: replacementBlock.clientId,
				name: 'core/test-block',
				innerBlocks: [],
				attributes: {},
				isValid: true,
			} );
		} );

		it( 'should replace the block even if the new block clientId is the same', () => {
			const originalState = blocks( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [
					{
						clientId: 'chicken',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
					},
				],
			} );
			const replacedState = blocks( originalState, {
				type: 'REPLACE_BLOCKS',
				clientIds: [ 'chicken' ],
				blocks: [
					{
						clientId: 'chicken',
						name: 'core/freeform',
						innerBlocks: [],
					},
				],
			} );

			expect( replacedState.byClientId.size ).toBe( 1 );
			expect( originalState.byClientId.get( 'chicken' ).name ).toBe(
				'core/test-block'
			);
			expect( replacedState.byClientId.get( 'chicken' ).name ).toBe(
				'core/freeform'
			);
			expect( replacedState.byClientId.get( 'chicken' ).clientId ).toBe(
				'chicken'
			);
			expect( Object.fromEntries( replacedState.order ) ).toEqual( {
				'': [ 'chicken' ],
				chicken: [],
			} );
			expect( originalState.tree.get( 'chicken' ) ).not.toBe(
				replacedState.tree.get( 'chicken' )
			);

			const nestedBlock = {
				clientId: 'chicken',
				name: 'core/test-block',
				attributes: {},
				innerBlocks: [],
			};
			const wrapperBlock = createBlock( 'core/test-block', {}, [
				nestedBlock,
			] );
			const replacementNestedBlock = {
				clientId: 'chicken',
				name: 'core/freeform',
				attributes: {},
				innerBlocks: [],
			};

			const originalNestedState = blocks( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ wrapperBlock ],
			} );

			const replacedNestedState = blocks( originalNestedState, {
				type: 'REPLACE_BLOCKS',
				clientIds: [ nestedBlock.clientId ],
				blocks: [ replacementNestedBlock ],
			} );

			expect( Object.fromEntries( replacedNestedState.order ) ).toEqual( {
				'': [ wrapperBlock.clientId ],
				[ wrapperBlock.clientId ]: [ replacementNestedBlock.clientId ],
				[ replacementNestedBlock.clientId ]: [],
			} );

			expect( originalNestedState.byClientId.get( 'chicken' ).name ).toBe(
				'core/test-block'
			);
			expect( replacedNestedState.byClientId.get( 'chicken' ).name ).toBe(
				'core/freeform'
			);
		} );

		it( 'should update the block', () => {
			const original = blocks( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [
					{
						clientId: 'chicken',
						name: 'core/test-block',
						attributes: {},
						isValid: false,
						innerBlocks: [],
					},
				],
			} );
			const state = blocks( deepFreeze( original ), {
				type: 'UPDATE_BLOCK',
				clientId: 'chicken',
				updates: {
					attributes: { content: 'ribs' },
					isValid: true,
				},
			} );

			expect( state.byClientId.get( 'chicken' ) ).toEqual( {
				clientId: 'chicken',
				name: 'core/test-block',
				isValid: true,
			} );

			expect( state.attributes.get( 'chicken' ) ).toEqual( {
				content: 'ribs',
			} );
			expect( state.tree.get( '' ).innerBlocks[ 0 ] ).toBe(
				state.tree.get( 'chicken' )
			);
			expect( state.tree.get( 'chicken' ) ).toEqual( {
				clientId: 'chicken',
				name: 'core/test-block',
				innerBlocks: [],
				attributes: {
					content: 'ribs',
				},
				isValid: true,
			} );
		} );

		it( 'should update the reusable block reference if the temporary id is swapped', () => {
			const original = blocks( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [
					{
						clientId: 'chicken',
						name: 'core/block',
						attributes: {
							ref: 'random-clientId',
						},
						isValid: false,
						innerBlocks: [],
					},
				],
			} );

			const state = blocks( deepFreeze( original ), {
				type: 'SAVE_REUSABLE_BLOCK_SUCCESS',
				id: 'random-clientId',
				updatedId: 3,
			} );

			expect( state.byClientId.get( 'chicken' ) ).toEqual( {
				clientId: 'chicken',
				name: 'core/block',
				isValid: false,
			} );

			expect( state.attributes.get( 'chicken' ) ).toEqual( {
				ref: 3,
			} );

			expect( state.tree.get( '' ).innerBlocks[ 0 ] ).toBe(
				state.tree.get( 'chicken' )
			);
			expect( state.tree.get( 'chicken' ) ).toEqual( {
				clientId: 'chicken',
				name: 'core/block',
				isValid: false,
				innerBlocks: [],
				attributes: {
					ref: 3,
				},
			} );
		} );

		it( 'should move the block up', () => {
			const original = blocks( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [
					{
						clientId: 'chicken',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
					},
					{
						clientId: 'ribs',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
					},
				],
			} );
			const state = blocks( original, {
				type: 'MOVE_BLOCKS_UP',
				clientIds: [ 'ribs' ],
			} );

			expect( state.order.get( '' ) ).toEqual( [ 'ribs', 'chicken' ] );
			expect( state.tree.get( '' ).innerBlocks[ 0 ] ).toBe(
				state.tree.get( 'ribs' )
			);
			expect( state.tree.get( '' ).innerBlocks[ 1 ] ).toBe(
				state.tree.get( 'chicken' )
			);
			expect( state.tree.get( 'chicken' ) ).toBe(
				original.tree.get( 'chicken' )
			);
		} );

		it( 'should move the nested block up', () => {
			const movedBlock = createBlock( 'core/test-block' );
			const siblingBlock = createBlock( 'core/test-block' );
			const wrapperBlock = createBlock( 'core/test-block', {}, [
				siblingBlock,
				movedBlock,
			] );
			const original = blocks( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ wrapperBlock ],
			} );
			const state = blocks( original, {
				type: 'MOVE_BLOCKS_UP',
				clientIds: [ movedBlock.clientId ],
				rootClientId: wrapperBlock.clientId,
			} );

			expect( Object.fromEntries( state.order ) ).toEqual( {
				'': [ wrapperBlock.clientId ],
				[ wrapperBlock.clientId ]: [
					movedBlock.clientId,
					siblingBlock.clientId,
				],
				[ movedBlock.clientId ]: [],
				[ siblingBlock.clientId ]: [],
			} );

			expect(
				state.tree.get( wrapperBlock.clientId ).innerBlocks[ 0 ]
			).toBe( state.tree.get( movedBlock.clientId ) );
			expect(
				state.tree.get( wrapperBlock.clientId ).innerBlocks[ 1 ]
			).toBe( state.tree.get( siblingBlock.clientId ) );
			expect( state.tree.get( movedBlock.clientId ) ).toBe(
				original.tree.get( movedBlock.clientId )
			);
		} );

		it( 'should move multiple blocks up', () => {
			const original = blocks( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [
					{
						clientId: 'chicken',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
					},
					{
						clientId: 'ribs',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
					},
					{
						clientId: 'veggies',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
					},
				],
			} );
			const state = blocks( original, {
				type: 'MOVE_BLOCKS_UP',
				clientIds: [ 'ribs', 'veggies' ],
			} );

			expect( state.order.get( '' ) ).toEqual( [
				'ribs',
				'veggies',
				'chicken',
			] );
		} );

		it( 'should move multiple nested blocks up', () => {
			const movedBlockA = createBlock( 'core/test-block' );
			const movedBlockB = createBlock( 'core/test-block' );
			const siblingBlock = createBlock( 'core/test-block' );
			const wrapperBlock = createBlock( 'core/test-block', {}, [
				siblingBlock,
				movedBlockA,
				movedBlockB,
			] );
			const original = blocks( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ wrapperBlock ],
			} );
			const state = blocks( original, {
				type: 'MOVE_BLOCKS_UP',
				clientIds: [ movedBlockA.clientId, movedBlockB.clientId ],
				rootClientId: wrapperBlock.clientId,
			} );

			expect( Object.fromEntries( state.order ) ).toEqual( {
				'': [ wrapperBlock.clientId ],
				[ wrapperBlock.clientId ]: [
					movedBlockA.clientId,
					movedBlockB.clientId,
					siblingBlock.clientId,
				],
				[ movedBlockA.clientId ]: [],
				[ movedBlockB.clientId ]: [],
				[ siblingBlock.clientId ]: [],
			} );
		} );

		it( 'should not move the first block up', () => {
			const original = blocks( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [
					{
						clientId: 'chicken',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
					},
					{
						clientId: 'ribs',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
					},
				],
			} );
			const state = blocks( original, {
				type: 'MOVE_BLOCKS_UP',
				clientIds: [ 'chicken' ],
			} );

			expect( state.order ).toBe( original.order );
		} );

		it( 'should move the block down', () => {
			const original = blocks( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [
					{
						clientId: 'chicken',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
					},
					{
						clientId: 'ribs',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
					},
				],
			} );
			const state = blocks( original, {
				type: 'MOVE_BLOCKS_DOWN',
				clientIds: [ 'chicken' ],
			} );

			expect( state.order.get( '' ) ).toEqual( [ 'ribs', 'chicken' ] );
		} );

		it( 'should move the nested block down', () => {
			const movedBlock = createBlock( 'core/test-block' );
			const siblingBlock = createBlock( 'core/test-block' );
			const wrapperBlock = createBlock( 'core/test-block', {}, [
				movedBlock,
				siblingBlock,
			] );
			const original = blocks( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ wrapperBlock ],
			} );
			const state = blocks( original, {
				type: 'MOVE_BLOCKS_DOWN',
				clientIds: [ movedBlock.clientId ],
				rootClientId: wrapperBlock.clientId,
			} );

			expect( Object.fromEntries( state.order ) ).toEqual( {
				'': [ wrapperBlock.clientId ],
				[ wrapperBlock.clientId ]: [
					siblingBlock.clientId,
					movedBlock.clientId,
				],
				[ movedBlock.clientId ]: [],
				[ siblingBlock.clientId ]: [],
			} );
		} );

		it( 'should move multiple blocks down', () => {
			const original = blocks( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [
					{
						clientId: 'chicken',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
					},
					{
						clientId: 'ribs',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
					},
					{
						clientId: 'veggies',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
					},
				],
			} );
			const state = blocks( original, {
				type: 'MOVE_BLOCKS_DOWN',
				clientIds: [ 'chicken', 'ribs' ],
			} );

			expect( state.order.get( '' ) ).toEqual( [
				'veggies',
				'chicken',
				'ribs',
			] );
		} );

		it( 'should move multiple nested blocks down', () => {
			const movedBlockA = createBlock( 'core/test-block' );
			const movedBlockB = createBlock( 'core/test-block' );
			const siblingBlock = createBlock( 'core/test-block' );
			const wrapperBlock = createBlock( 'core/test-block', {}, [
				movedBlockA,
				movedBlockB,
				siblingBlock,
			] );
			const original = blocks( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ wrapperBlock ],
			} );
			const state = blocks( original, {
				type: 'MOVE_BLOCKS_DOWN',
				clientIds: [ movedBlockA.clientId, movedBlockB.clientId ],
				rootClientId: wrapperBlock.clientId,
			} );

			expect( Object.fromEntries( state.order ) ).toEqual( {
				'': [ wrapperBlock.clientId ],
				[ wrapperBlock.clientId ]: [
					siblingBlock.clientId,
					movedBlockA.clientId,
					movedBlockB.clientId,
				],
				[ movedBlockA.clientId ]: [],
				[ movedBlockB.clientId ]: [],
				[ siblingBlock.clientId ]: [],
			} );
		} );

		it( 'should not move the last block down', () => {
			const original = blocks( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [
					{
						clientId: 'chicken',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
					},
					{
						clientId: 'ribs',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
					},
				],
			} );
			const state = blocks( original, {
				type: 'MOVE_BLOCKS_DOWN',
				clientIds: [ 'ribs' ],
			} );

			expect( state.order ).toBe( original.order );
		} );

		it( 'should remove the block', () => {
			const original = blocks( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [
					{
						clientId: 'chicken',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
					},
					{
						clientId: 'ribs',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
					},
				],
			} );
			const state = blocks( original, {
				type: 'REMOVE_BLOCKS',
				clientIds: [ 'chicken' ],
			} );

			expect( state.order.get( '' ) ).toEqual( [ 'ribs' ] );
			expect( Object.fromEntries( state.order ) ).not.toHaveProperty(
				'chicken'
			);
			expect( Object.fromEntries( state.parents ) ).toEqual( {
				ribs: '',
			} );
			expect( Object.fromEntries( state.byClientId ) ).toEqual( {
				ribs: {
					clientId: 'ribs',
					name: 'core/test-block',
				},
			} );
			expect( Object.fromEntries( state.attributes ) ).toEqual( {
				ribs: {},
			} );
			expect( state.tree.get( '' ).innerBlocks ).toHaveLength( 1 );
		} );

		it( 'should remove multiple blocks', () => {
			const original = blocks( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [
					{
						clientId: 'chicken',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
					},
					{
						clientId: 'ribs',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
					},
					{
						clientId: 'veggies',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
					},
				],
			} );
			const state = blocks( original, {
				type: 'REMOVE_BLOCKS',
				clientIds: [ 'chicken', 'veggies' ],
			} );

			expect( state.order.get( '' ) ).toEqual( [ 'ribs' ] );
			expect( Object.fromEntries( state.order ) ).not.toHaveProperty(
				'chicken'
			);
			expect( Object.fromEntries( state.order ) ).not.toHaveProperty(
				'veggies'
			);
			expect( Object.fromEntries( state.parents ) ).toEqual( {
				ribs: '',
			} );
			expect( Object.fromEntries( state.byClientId ) ).toEqual( {
				ribs: {
					clientId: 'ribs',
					name: 'core/test-block',
				},
			} );
			expect( Object.fromEntries( state.attributes ) ).toEqual( {
				ribs: {},
			} );
		} );

		it( 'should cascade remove to include inner blocks', () => {
			const block = createBlock( 'core/test-block', {}, [
				createBlock( 'core/test-block', {}, [
					createBlock( 'core/test-block' ),
				] ),
			] );

			const original = blocks( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ block ],
			} );

			const state = blocks( original, {
				type: 'REMOVE_BLOCKS',
				clientIds: [ block.clientId ],
			} );

			expect( state.byClientId ).toEqual( new Map() );
			expect( Object.fromEntries( state.order ) ).toEqual( {
				'': [],
			} );
			expect( Object.fromEntries( state.parents ) ).toEqual( {} );
		} );

		it( 'should insert at the specified index', () => {
			const original = blocks( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [
					{
						clientId: 'kumquat',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
					},
					{
						clientId: 'loquat',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
					},
				],
			} );

			const state = blocks( original, {
				type: 'INSERT_BLOCKS',
				index: 1,
				blocks: [
					{
						clientId: 'persimmon',
						name: 'core/freeform',
						innerBlocks: [],
					},
				],
			} );

			expect( state.byClientId.size ).toBe( 3 );
			expect( state.order.get( '' ) ).toEqual( [
				'kumquat',
				'persimmon',
				'loquat',
			] );
		} );

		it( 'should move block to lower index', () => {
			const original = blocks( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [
					{
						clientId: 'chicken',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
					},
					{
						clientId: 'ribs',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
					},
					{
						clientId: 'veggies',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
					},
				],
			} );
			const state = blocks( original, {
				type: 'MOVE_BLOCKS_TO_POSITION',
				clientIds: [ 'ribs' ],
				index: 0,
			} );

			expect( state.order.get( '' ) ).toEqual( [
				'ribs',
				'chicken',
				'veggies',
			] );
		} );

		it( 'should move block to higher index', () => {
			const original = blocks( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [
					{
						clientId: 'chicken',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
					},
					{
						clientId: 'ribs',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
					},
					{
						clientId: 'veggies',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
					},
				],
			} );
			const state = blocks( original, {
				type: 'MOVE_BLOCKS_TO_POSITION',
				clientIds: [ 'ribs' ],
				index: 2,
			} );

			expect( state.order.get( '' ) ).toEqual( [
				'chicken',
				'veggies',
				'ribs',
			] );
		} );

		it( 'should not move block if passed same index', () => {
			const original = blocks( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [
					{
						clientId: 'chicken',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
					},
					{
						clientId: 'ribs',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
					},
					{
						clientId: 'veggies',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
					},
				],
			} );
			const state = blocks( original, {
				type: 'MOVE_BLOCKS_TO_POSITION',
				clientIds: [ 'ribs' ],
				index: 1,
			} );

			expect( state.order.get( '' ) ).toEqual( [
				'chicken',
				'ribs',
				'veggies',
			] );
		} );

		it( 'should move multiple blocks', () => {
			const original = blocks( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [
					{
						clientId: 'chicken',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
					},
					{
						clientId: 'ribs',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
					},
					{
						clientId: 'veggies',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
					},
				],
			} );
			const state = blocks( original, {
				type: 'MOVE_BLOCKS_TO_POSITION',
				clientIds: [ 'ribs', 'veggies' ],
				index: 0,
			} );

			expect( state.order.get( '' ) ).toEqual( [
				'ribs',
				'veggies',
				'chicken',
			] );
		} );

		it( 'should move multiple blocks to different parent', () => {
			const original = blocks( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [
					{
						clientId: 'chicken',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
					},
					{
						clientId: 'ribs',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
					},
					{
						clientId: 'veggies',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
					},
				],
			} );
			const state = blocks( original, {
				type: 'MOVE_BLOCKS_TO_POSITION',
				clientIds: [ 'ribs', 'veggies' ],
				fromRootClientId: '',
				toRootClientId: 'chicken',
				index: 0,
			} );

			expect( state.order.get( '' ) ).toEqual( [ 'chicken' ] );
			expect( state.order.get( 'chicken' ) ).toEqual( [
				'ribs',
				'veggies',
			] );
		} );

		describe( 'blocks', () => {
			describe( 'byClientId', () => {
				it( 'should ignore updates to non-existent block', () => {
					const original = deepFreeze(
						blocks( undefined, {
							type: 'RESET_BLOCKS',
							blocks: [],
						} )
					);
					const state = blocks( original, {
						type: 'UPDATE_BLOCK_ATTRIBUTES',
						clientIds: [ 'kumquat' ],
						attributes: {
							updated: true,
						},
					} );

					expect( state.byClientId ).toBe( original.byClientId );
				} );

				it( 'should return with same reference if no changes in updates', () => {
					const original = deepFreeze(
						blocks( undefined, {
							type: 'RESET_BLOCKS',
							blocks: [
								{
									clientId: 'kumquat',
									attributes: {
										updated: true,
									},
									innerBlocks: [],
								},
							],
						} )
					);
					const state = blocks( original, {
						type: 'UPDATE_BLOCK_ATTRIBUTES',
						clientIds: [ 'kumquat' ],
						attributes: {
							updated: true,
						},
					} );

					expect( state.byClientId ).toBe( state.byClientId );
				} );
			} );

			describe( 'attributes', () => {
				it( 'should return with attribute block updates', () => {
					const original = deepFreeze(
						blocks( undefined, {
							type: 'RESET_BLOCKS',
							blocks: [
								{
									clientId: 'kumquat',
									attributes: {},
									innerBlocks: [],
								},
							],
						} )
					);
					const state = blocks( original, {
						type: 'UPDATE_BLOCK_ATTRIBUTES',
						clientIds: [ 'kumquat' ],
						attributes: {
							updated: true,
						},
					} );

					expect( state.attributes.get( 'kumquat' ).updated ).toBe(
						true
					);
				} );

				it( 'should not updated equal attributes', () => {
					const original = deepFreeze(
						blocks( undefined, {
							type: 'RESET_BLOCKS',
							blocks: [
								{
									clientId: 'kumquat',
									attributes: {},
									innerBlocks: [],
								},
							],
						} )
					);
					const state = blocks( original, {
						type: 'UPDATE_BLOCK_ATTRIBUTES',
						clientIds: [ 'kumquat' ],
						attributes: {
							updated: true,
						},
					} );
					const updatedState = blocks( state, {
						type: 'UPDATE_BLOCK_ATTRIBUTES',
						clientIds: [ 'kumquat' ],
						attributes: {
							updated: true,
						},
					} );

					expect( state.attributes.get( 'kumquat' ) ).toBe(
						updatedState.attributes.get( 'kumquat' )
					);
				} );

				it( 'should return with attribute block updates when attributes are unique by block', () => {
					const original = deepFreeze(
						blocks( undefined, {
							type: 'RESET_BLOCKS',
							blocks: [
								{
									clientId: 'kumquat',
									attributes: {},
									innerBlocks: [],
								},
							],
						} )
					);
					const state = blocks( original, {
						type: 'UPDATE_BLOCK_ATTRIBUTES',
						clientIds: [ 'kumquat' ],
						attributes: {
							kumquat: { updated: true },
						},
						uniqueByBlock: true,
					} );

					expect( state.attributes.get( 'kumquat' ).updated ).toBe(
						true
					);
				} );

				it( 'should accumulate attribute block updates', () => {
					const original = deepFreeze(
						blocks( undefined, {
							type: 'RESET_BLOCKS',
							blocks: [
								{
									clientId: 'kumquat',
									attributes: {
										updated: true,
									},
									innerBlocks: [],
								},
							],
						} )
					);
					const state = blocks( original, {
						type: 'UPDATE_BLOCK_ATTRIBUTES',
						clientIds: [ 'kumquat' ],
						attributes: {
							moreUpdated: true,
						},
					} );

					expect( state.attributes.get( 'kumquat' ) ).toEqual( {
						updated: true,
						moreUpdated: true,
					} );
				} );

				it( 'should ignore updates to non-existent block', () => {
					const original = deepFreeze(
						blocks( undefined, {
							type: 'RESET_BLOCKS',
							blocks: [],
						} )
					);
					const state = blocks( original, {
						type: 'UPDATE_BLOCK_ATTRIBUTES',
						clientIds: [ 'kumquat' ],
						attributes: {
							updated: true,
						},
					} );

					expect( state.attributes ).toBe( original.attributes );
				} );

				it( 'should return with same reference if no changes in updates', () => {
					const original = deepFreeze(
						blocks( undefined, {
							type: 'RESET_BLOCKS',
							blocks: [
								{
									clientId: 'kumquat',
									attributes: {
										updated: true,
									},
									innerBlocks: [],
								},
							],
						} )
					);
					const state = blocks( original, {
						type: 'UPDATE_BLOCK_ATTRIBUTES',
						clientIds: [ 'kumquat' ],
						attributes: {
							updated: true,
						},
					} );

					expect( state.attributes ).toBe( state.attributes );
				} );

				it( 'should handle undefined attributes', () => {
					const original = deepFreeze(
						blocks( undefined, {
							type: 'RESET_BLOCKS',
							blocks: [
								{
									clientId: 'kumquat',
									attributes: {},
									innerBlocks: [],
								},
							],
						} )
					);
					const state = blocks( original, {
						type: 'UPDATE_BLOCK_ATTRIBUTES',
						clientIds: [ 'kumquat' ],
					} );

					expect( state.attributes.get( 'kumquat' ) ).toEqual( {} );
				} );
			} );

			describe( 'isPersistentChange', () => {
				it( 'should default a changing state to true', () => {
					const state = deepFreeze( blocks( undefined, {} ) );

					expect( state.isPersistentChange ).toBe( true );
				} );

				it( 'should consider any non-exempt block change as persistent', () => {
					const original = deepFreeze(
						blocks( undefined, {
							type: 'RESET_BLOCKS',
							blocks: [],
						} )
					);

					const state = blocks( original, {
						type: 'UPDATE_BLOCK_ATTRIBUTES',
						clientIds: [ 'kumquat' ],
						attributes: {
							updated: true,
						},
					} );

					expect( state.isPersistentChange ).toBe( true );
				} );

				it( 'should consider any non-exempt block change as persistent across unchanging actions', () => {
					let original = deepFreeze(
						blocks( undefined, {
							type: 'RESET_BLOCKS',
							blocks: [
								{
									clientId: 'kumquat',
									attributes: {},
									innerBlocks: [],
								},
							],
						} )
					);
					original = blocks( original, {
						type: 'NOOP',
					} );
					original = blocks( original, {
						// While RECEIVE_BLOCKS changes state, it's considered
						// as ignored, confirmed by this test.
						type: 'RECEIVE_BLOCKS',
						blocks: [],
					} );

					const state = blocks( original, {
						type: 'UPDATE_BLOCK_ATTRIBUTES',
						clientIds: [ 'kumquat' ],
						attributes: {
							updated: false,
						},
					} );

					expect( state.isPersistentChange ).toBe( true );
				} );

				it( 'should consider same block attribute update as exempt', () => {
					let original = deepFreeze(
						blocks( undefined, {
							type: 'RESET_BLOCKS',
							blocks: [
								{
									clientId: 'kumquat',
									attributes: {},
									innerBlocks: [],
								},
							],
						} )
					);
					original = blocks( original, {
						type: 'UPDATE_BLOCK_ATTRIBUTES',
						clientIds: [ 'kumquat' ],
						attributes: {
							updated: false,
						},
					} );

					const state = blocks( original, {
						type: 'UPDATE_BLOCK_ATTRIBUTES',
						clientIds: [ 'kumquat' ],
						attributes: {
							updated: true,
						},
					} );

					expect( state.isPersistentChange ).toBe( false );
				} );

				it( 'should flag an explicitly marked persistent change', () => {
					let original = deepFreeze(
						blocks( undefined, {
							type: 'RESET_BLOCKS',
							blocks: [
								{
									clientId: 'kumquat',
									attributes: {},
									innerBlocks: [],
								},
							],
						} )
					);
					original = blocks( original, {
						type: 'UPDATE_BLOCK_ATTRIBUTES',
						clientIds: [ 'kumquat' ],
						attributes: {
							updated: false,
						},
					} );
					original = blocks( original, {
						type: 'UPDATE_BLOCK_ATTRIBUTES',
						clientIds: [ 'kumquat' ],
						attributes: {
							updated: true,
						},
					} );

					const state = blocks( original, {
						type: 'MARK_LAST_CHANGE_AS_PERSISTENT',
					} );

					expect( state.isPersistentChange ).toBe( true );
				} );

				it( 'should retain reference for same state, same persistence', () => {
					const original = deepFreeze(
						blocks( undefined, {
							type: 'RESET_BLOCKS',
							blocks: [],
						} )
					);

					const state = blocks( original, {
						type: '__INERT__',
					} );

					expect( state ).toBe( original );
				} );
			} );

			describe( 'isIgnoredChange', () => {
				it( 'should consider received blocks as ignored change', () => {
					const resetState = blocks( undefined, {
						type: 'random action',
					} );
					const state = blocks( resetState, {
						type: 'RECEIVE_BLOCKS',
						blocks: [
							{
								clientId: 'kumquat',
								attributes: {},
								innerBlocks: [],
							},
						],
					} );

					expect( state.isIgnoredChange ).toBe( true );
				} );
			} );

			describe( 'controlledInnerBlocks', () => {
				it( 'should remove the content of the block if it switches from controlled to uncontrolled or opposite', () => {
					const original = blocks( undefined, {
						type: 'RESET_BLOCKS',
						blocks: [
							{
								clientId: 'chicken',
								name: 'core/test-block',
								attributes: {},
								innerBlocks: [
									{
										clientId: 'child',
										name: 'core/test-block',
										attributes: {},
										innerBlocks: [],
									},
								],
							},
						],
					} );

					const state = blocks( original, {
						type: 'SET_HAS_CONTROLLED_INNER_BLOCKS',
						clientId: 'chicken',
						hasControlledInnerBlocks: true,
					} );

					expect( state.controlledInnerBlocks.chicken ).toBe( true );
					// The previous content of the block should be removed
					expect( state.byClientId.child ).toBeUndefined();
					expect( state.tree.get( 'child' ) ).toBeUndefined();
					expect( state.tree.get( 'chicken' ).innerBlocks ).toEqual(
						[]
					);
				} );
				it( 'should preserve the controlled blocks in state and re-attach them in other pieces of state(order, tree, etc..), when we replace inner blocks', () => {
					const initialState = {
						byClientId: new Map(
							Object.entries( {
								'group-id': {
									clientId: 'group-id',
									name: 'core/group',
									isValid: true,
								},
								'reusable-id': {
									clientId: 'reusable-id',
									name: 'core/block',
									isValid: true,
								},
								'paragraph-id': {
									clientId: 'paragraph-id',
									name: 'core/paragraph',
									isValid: true,
								},
							} )
						),
						order: new Map(
							Object.entries( {
								'': [ 'group-id' ],
								'group-id': [ 'reusable-id' ],
								'reusable-id': [ 'paragraph-id' ],
								'paragraph-id': [],
							} )
						),
						controlledInnerBlocks: {
							'reusable-id': true,
						},
						parents: new Map(
							Object.entries( {
								'group-id': '',
								'reusable-id': 'group-id',
								'paragraph-id': 'reusable-id',
							} )
						),
						tree: new Map(
							Object.entries( {
								'group-id': {
									clientId: 'group-id',
									name: 'core/group',
									isValid: true,
									innerBlocks: [
										{
											clientId: 'reusable-id',
											name: 'core/block',
											isValid: true,
											attributes: {
												ref: 687,
											},
											innerBlocks: [],
										},
									],
								},
								'reusable-id': {
									clientId: 'reusable-id',
									name: 'core/block',
									isValid: true,
									attributes: {
										ref: 687,
									},
									innerBlocks: [],
								},
								'': {
									innerBlocks: [
										{
											clientId: 'group-id',
											name: 'core/group',
											isValid: true,
											innerBlocks: [
												{
													clientId: 'reusable-id',
													name: 'core/block',
													isValid: true,
													attributes: {
														ref: 687,
													},
													innerBlocks: [],
												},
											],
										},
									],
								},
								'paragraph-id': {
									clientId: 'paragraph-id',
									name: 'core/paragraph',
									isValid: true,
									innerBlocks: [],
								},
								'controlled||reusable-id': {
									innerBlocks: [
										{
											clientId: 'paragraph-id',
											name: 'core/paragraph',
											isValid: true,
											innerBlocks: [],
										},
									],
								},
							} )
						),
					};
					// We will dispatch an action that replaces the inner
					// blocks with the same inner blocks, which contain
					// a controlled block (`reusable-id`).
					const action = {
						type: 'REPLACE_INNER_BLOCKS',
						rootClientId: 'group-id',
						blocks: [
							{
								clientId: 'reusable-id',
								name: 'core/block',
								isValid: true,
								attributes: {
									ref: 687,
								},
								innerBlocks: [],
							},
						],
						updateSelection: false,
					};
					const state = blocks( initialState, action );
					expect( Object.fromEntries( state.order ) ).toEqual(
						expect.objectContaining(
							Object.fromEntries( initialState.order )
						)
					);
					expect( Object.fromEntries( state.tree ) ).toEqual(
						expect.objectContaining(
							Object.fromEntries( initialState.tree )
						)
					);
				} );
			} );
		} );
	} );

	describe( 'insertionPoint', () => {
		it( 'should default to null', () => {
			const state = insertionPoint( undefined, {} );

			expect( state ).toBe( null );
		} );

		it( 'should set insertion point', () => {
			const state = insertionPoint( null, {
				type: 'SHOW_INSERTION_POINT',
				rootClientId: 'clientId1',
				index: 0,
			} );

			expect( state ).toEqual( {
				rootClientId: 'clientId1',
				index: 0,
			} );
		} );

		it( 'should clear the insertion point', () => {
			const original = deepFreeze( {
				rootClientId: 'clientId1',
				index: 0,
			} );
			const state = insertionPoint( original, {
				type: 'HIDE_INSERTION_POINT',
			} );

			expect( state ).toBe( null );
		} );
	} );

	describe( 'isBlockInterfaceHidden()', () => {
		it( 'should set the hide block interface flag to true', () => {
			const state = isBlockInterfaceHidden( false, {
				type: 'HIDE_BLOCK_INTERFACE',
			} );

			expect( state ).toBe( true );
		} );

		it( 'should set the hide block interface flag to false', () => {
			const state = isBlockInterfaceHidden( false, {
				type: 'SHOW_BLOCK_INTERFACE',
			} );

			expect( state ).toBe( false );
		} );
	} );

	describe( 'isTyping()', () => {
		it( 'should set the typing flag to true', () => {
			const state = isTyping( false, {
				type: 'START_TYPING',
			} );

			expect( state ).toBe( true );
		} );

		it( 'should set the typing flag to false', () => {
			const state = isTyping( false, {
				type: 'STOP_TYPING',
			} );

			expect( state ).toBe( false );
		} );
	} );

	describe( 'draggedBlocks', () => {
		it( 'should store the dragged client ids when a user starts dragging blocks', () => {
			const clientIds = [ 'block-1', 'block-2', 'block-3' ];
			const state = draggedBlocks( [], {
				type: 'START_DRAGGING_BLOCKS',
				clientIds,
			} );

			expect( state ).toBe( clientIds );
		} );

		it( 'should set the state to an empty array when a user stops dragging blocks', () => {
			const previousState = [ 'block-1', 'block-2', 'block-3' ];
			const state = draggedBlocks( previousState, {
				type: 'STOP_DRAGGING_BLOCKS',
			} );

			expect( state ).toEqual( [] );
		} );
	} );

	describe( 'initialPosition()', () => {
		it( 'should return with block clientId as selected', () => {
			const state = initialPosition( undefined, {
				type: 'SELECT_BLOCK',
				initialPosition: -1,
			} );

			expect( state ).toBe( -1 );
		} );

		it( 'should allow setting null value in multi selection', () => {
			const state = initialPosition( undefined, {
				type: 'MULTI_SELECT',
				initialPosition: null,
			} );

			expect( state ).toBe( null );
		} );
	} );

	describe( 'isMultiSelecting()', () => {
		it( 'should start multi selection', () => {
			const state = isMultiSelecting( false, {
				type: 'START_MULTI_SELECT',
			} );

			expect( state ).toBe( true );
		} );

		it( 'should end multi selection with selection', () => {
			const state = isMultiSelecting( true, {
				type: 'STOP_MULTI_SELECT',
			} );

			expect( state ).toBe( false );
		} );
	} );

	describe( 'selection()', () => {
		it( 'should set multi selection', () => {
			const action = {
				type: 'MULTI_SELECT',
				start: 'ribs',
				end: 'chicken',
			};
			const state = selection( undefined, action );

			expect( state.selectionStart ).toEqual( { clientId: 'ribs' } );
			expect( state.selectionEnd ).toEqual( { clientId: 'chicken' } );
		} );

		it( 'should reset selection', () => {
			const start = { clientId: 'a' };
			const end = { clientId: 'b' };
			const action = {
				type: 'RESET_SELECTION',
				selectionStart: start,
				selectionEnd: end,
			};
			const state = selection( undefined, action );

			expect( state.selectionStart ).toEqual( start );
			expect( state.selectionEnd ).toEqual( end );
		} );

		it( 'should change selection', () => {
			const action = {
				type: 'SELECTION_CHANGE',
				clientId: 'a',
				attributeKey: 'content',
				startOffset: 1,
				endOffset: 2,
			};
			const state = selection( undefined, action );

			expect( state.selectionStart ).toEqual( {
				clientId: 'a',
				attributeKey: 'content',
				offset: 1,
			} );
			expect( state.selectionEnd ).toEqual( {
				clientId: 'a',
				attributeKey: 'content',
				offset: 2,
			} );
		} );

		it( 'should return with block clientId as selected', () => {
			const action = {
				type: 'SELECT_BLOCK',
				clientId: 'kumquat',
			};
			const state = selection( undefined, action );
			const expected = { clientId: 'kumquat' };

			expect( state.selectionStart ).toEqual( expected );
			expect( state.selectionEnd ).toEqual( expected );
		} );

		it( 'should not update the state if the block is already selected', () => {
			const clientId = 'ribs';
			const original = deepFreeze( {
				selectionStart: { clientId },
				selectionEnd: { clientId },
			} );
			const action = {
				type: 'SELECT_BLOCK',
				clientId,
			};
			const state = selection( original, action );

			expect( state.selectionStart ).toBe( original.selectionStart );
			expect( state.selectionEnd ).toBe( original.selectionEnd );
		} );

		it( 'should unset selection', () => {
			const clientId = 'ribs';
			const original = deepFreeze( {
				selectionStart: { clientId },
				selectionEnd: { clientId },
			} );
			const action = {
				type: 'CLEAR_SELECTED_BLOCK',
			};

			const state = selection( original, action );

			expect( state.selectionStart ).toEqual( {} );
			expect( state.selectionEnd ).toEqual( {} );
		} );

		it( 'should return same reference if clearing selection but no selection', () => {
			const original = deepFreeze( {
				selectionStart: {},
				selectionEnd: {},
			} );
			const action = {
				type: 'CLEAR_SELECTED_BLOCK',
			};

			const state = selection( original, action );

			expect( state.selectionStart ).toBe( original.selectionStart );
			expect( state.selectionEnd ).toBe( original.selectionEnd );
		} );

		it( 'should select inserted block', () => {
			const action = {
				type: 'INSERT_BLOCKS',
				blocks: [ { clientId: 'ribs' } ],
				updateSelection: true,
			};
			const state = selection( undefined, action );
			const expected = { clientId: 'ribs' };

			expect( state.selectionStart ).toEqual( expected );
			expect( state.selectionEnd ).toEqual( expected );
		} );

		it( 'should not update the state if the block moved is already selected', () => {
			const original = deepFreeze( {
				selectionStart: { clientId: 'ribs' },
				selectionEnd: { clientId: 'ribs' },
			} );
			const action = {
				type: 'MOVE_BLOCKS_UP',
				clientIds: [ 'ribs' ],
			};

			const state = selection( original, action );

			expect( state.selectionStart ).toBe( original.selectionStart );
			expect( state.selectionEnd ).toBe( original.selectionEnd );
		} );

		it( 'should replace the selected block', () => {
			const original = deepFreeze( {
				selectionStart: { clientId: 'chicken' },
				selectionEnd: { clientId: 'chicken' },
			} );
			const action = {
				type: 'REPLACE_BLOCKS',
				clientIds: [ 'chicken' ],
				blocks: [ { clientId: 'wings' } ],
			};
			const state = selection( original, action );
			const expected = {
				selectionStart: { clientId: 'wings' },
				selectionEnd: { clientId: 'wings' },
			};

			expect( state.selectionStart ).toEqual( expected.selectionStart );
			expect( state.selectionEnd ).toEqual( expected.selectionEnd );
		} );

		it( 'should not replace the selected block if we keep it at the end when replacing blocks', () => {
			const original = deepFreeze( {
				selectionStart: { clientId: 'wings' },
				selectionEnd: { clientId: 'wings' },
			} );
			const action = {
				type: 'REPLACE_BLOCKS',
				clientIds: [ 'wings' ],
				blocks: [ { clientId: 'chicken' }, { clientId: 'wings' } ],
			};
			const state = selection( original, action );

			expect( state.selectionStart ).toBe( original.selectionStart );
			expect( state.selectionEnd ).toBe( original.selectionEnd );
		} );

		it( 'should replace the selected block if we keep it not at the end when replacing blocks', () => {
			const original = deepFreeze( {
				selectionStart: { clientId: 'chicken' },
				selectionEnd: { clientId: 'chicken' },
			} );
			const action = {
				type: 'REPLACE_BLOCKS',
				clientIds: [ 'chicken' ],
				blocks: [ { clientId: 'chicken' }, { clientId: 'wings' } ],
			};
			const state = selection( original, action );
			const expected = {
				selectionStart: { clientId: 'wings' },
				selectionEnd: { clientId: 'wings' },
			};

			expect( state.selectionStart ).toEqual( expected.selectionStart );
			expect( state.selectionEnd ).toEqual( expected.selectionEnd );
		} );

		it( 'should replace the selected block when is explicitly passed (`indexToSelect`)', () => {
			const original = deepFreeze( {
				selectionStart: { clientId: 'chicken' },
				selectionEnd: { clientId: 'chicken' },
			} );
			const action = {
				type: 'REPLACE_BLOCKS',
				clientIds: [ 'chicken' ],
				blocks: [
					{ clientId: 'rigas' },
					{ clientId: 'chicken' },
					{ clientId: 'wings' },
				],
				indexToSelect: 0,
			};
			const state = selection( original, action );
			expect( state ).toEqual(
				expect.objectContaining( {
					selectionStart: { clientId: 'rigas' },
					selectionEnd: { clientId: 'rigas' },
				} )
			);
		} );

		it( 'should reset if replacing with empty set', () => {
			const original = deepFreeze( {
				selectionStart: { clientId: 'chicken' },
				selectionEnd: { clientId: 'chicken' },
			} );
			const action = {
				type: 'REPLACE_BLOCKS',
				clientIds: [ 'chicken' ],
				blocks: [],
			};

			const state = selection( original, action );

			expect( state.selectionStart ).toEqual( {} );
			expect( state.selectionEnd ).toEqual( {} );
		} );

		it( 'should keep the selected block', () => {
			const original = deepFreeze( {
				selectionStart: { clientId: 'chicken' },
				selectionEnd: { clientId: 'chicken' },
			} );
			const action = {
				type: 'REPLACE_BLOCKS',
				clientIds: [ 'ribs' ],
				blocks: [ { clientId: 'wings' } ],
			};
			const state = selection( original, action );

			expect( state.selectionStart ).toBe( original.selectionStart );
			expect( state.selectionEnd ).toBe( original.selectionEnd );
		} );

		it( 'should remove the selection if we are removing the selected block', () => {
			const original = deepFreeze( {
				selectionStart: { clientId: 'chicken' },
				selectionEnd: { clientId: 'chicken' },
			} );
			const action = {
				type: 'REMOVE_BLOCKS',
				clientIds: [ 'chicken' ],
			};

			const state = selection( original, action );

			expect( state.selectionStart ).toEqual( {} );
			expect( state.selectionEnd ).toEqual( {} );
		} );

		it( 'should keep the selection if we are not removing the selected block', () => {
			const original = deepFreeze( {
				selectionStart: { clientId: 'chicken' },
				selectionEnd: { clientId: 'chicken' },
			} );
			const action = {
				type: 'REMOVE_BLOCKS',
				clientIds: [ 'ribs' ],
			};

			const state = selection( original, action );

			expect( state.selectionStart ).toEqual( original.selectionStart );
			expect( state.selectionEnd ).toEqual( original.selectionEnd );
		} );

		it( 'should update the selection on inner blocks replace if updateSelection is true', () => {
			const original = deepFreeze( {
				selectionStart: { clientId: 'chicken' },
				selectionEnd: { clientId: 'chicken' },
			} );
			const action = {
				type: 'REPLACE_INNER_BLOCKS',
				blocks: [ { clientId: 'another-block' } ],
				rootClientId: 'parent',
				updateSelection: true,
			};
			const state = selection( original, action );
			const expected = {
				selectionStart: { clientId: 'another-block' },
				selectionEnd: { clientId: 'another-block' },
			};

			expect( state.selectionStart ).toEqual( expected.selectionStart );
			expect( state.selectionEnd ).toEqual( expected.selectionEnd );
		} );

		it( 'should keep the same selection on RESET_BLOCKS if the selected blocks continue to exist', () => {
			const original = deepFreeze( {
				selectionStart: { clientId: 'chicken' },
				selectionEnd: { clientId: 'cow' },
			} );
			const action = {
				type: 'RESET_BLOCKS',
				blocks: [
					{ clientId: 'another-block' },
					{ clientId: 'chicken' },
					{ clientId: 'this-is-a-block-too' },
					{ clientId: 'cow' },
				],
			};
			const state = selection( original, action );

			expect( state.selectionStart ).toEqual( original.selectionStart );
			expect( state.selectionEnd ).toEqual( original.selectionEnd );
		} );

		it( 'should collapse the selection on RESET_BLOCKS if the selection start exists, but the end does not', () => {
			const original = deepFreeze( {
				selectionStart: { clientId: 'chicken' },
				selectionEnd: { clientId: 'cow' },
			} );
			const action = {
				type: 'RESET_BLOCKS',
				blocks: [
					{ clientId: 'another-block' },
					{ clientId: 'chicken' },
					{ clientId: 'this-is-a-block-too' },
				],
			};
			const state = selection( original, action );

			expect( state.selectionStart ).toEqual( original.selectionStart );
			expect( state.selectionEnd ).toEqual( original.selectionStart );
		} );

		it( 'should clear the selection on RESET_BLOCKS if the blocks currently selected are removed', () => {
			const original = deepFreeze( {
				selectionStart: { clientId: 'chicken' },
				selectionEnd: { clientId: 'cow' },
			} );
			const action = {
				type: 'RESET_BLOCKS',
				blocks: [
					{ clientId: 'another-block' },
					{ clientId: 'this-is-a-block-too' },
				],
			};
			const state = selection( original, action );

			expect( state.selectionStart ).toEqual( {} );
			expect( state.selectionEnd ).toEqual( {} );
		} );
	} );

	describe( 'preferences()', () => {
		it( 'should apply all defaults', () => {
			const state = preferences( undefined, {} );

			expect( state ).toEqual( {
				insertUsage: {},
			} );
		} );
		it( 'should record recently used blocks', () => {
			const state = preferences( deepFreeze( { insertUsage: {} } ), {
				type: 'INSERT_BLOCKS',
				blocks: [
					{
						clientId: 'bacon',
						name: 'core/embed',
					},
				],
				time: 123456,
			} );

			expect( state ).toEqual( {
				insertUsage: {
					'core/embed': {
						time: 123456,
						count: 1,
						insert: { name: 'core/embed' },
					},
				},
			} );

			const twoRecentBlocks = preferences(
				deepFreeze( {
					insertUsage: {
						'core/embed': {
							time: 123456,
							count: 1,
							insert: { name: 'core/embed' },
						},
					},
				} ),
				{
					type: 'INSERT_BLOCKS',
					blocks: [
						{
							clientId: 'eggs',
							name: 'core/embed',
						},
						{
							clientId: 'bacon',
							name: 'core/block',
							attributes: { ref: 123 },
						},
					],
					time: 123457,
				}
			);

			expect( twoRecentBlocks ).toEqual( {
				insertUsage: {
					'core/embed': {
						time: 123457,
						count: 2,
						insert: { name: 'core/embed' },
					},
					'core/block/123': {
						time: 123457,
						count: 1,
						insert: { name: 'core/block', ref: 123 },
					},
				},
			} );
		} );
		describe( 'block variations handling', () => {
			const blockWithVariations = 'core/test-block-with-variations';
			beforeAll( () => {
				const variations = [
					{
						name: 'apple',
						attributes: { fruit: 'apple' },
					},
					{ name: 'orange', attributes: { fruit: 'orange' } },
				].map( ( variation ) => ( {
					...variation,
					isActive: ( blockAttributes, variationAttributes ) =>
						blockAttributes?.fruit === variationAttributes.fruit,
				} ) );
				registerBlockType( blockWithVariations, {
					save: noop,
					edit: noop,
					title: 'Fruit with variations',
					variations,
				} );
			} );
			afterAll( () => {
				unregisterBlockType( blockWithVariations );
			} );
			it( 'should return proper results with both found or not found block variation matches', () => {
				const state = preferences( deepFreeze( { insertUsage: {} } ), {
					type: 'INSERT_BLOCKS',
					blocks: [
						{
							clientId: 'no match',
							name: blockWithVariations,
						},
						{
							clientId: 'not a variation match',
							name: blockWithVariations,
							attributes: { fruit: 'not in a variation' },
						},
						{
							clientId: 'orange',
							name: blockWithVariations,
							attributes: { fruit: 'orange' },
						},
						{
							clientId: 'apple',
							name: blockWithVariations,
							attributes: { fruit: 'apple' },
						},
					],
					time: 123456,
				} );

				const orangeVariationName = `${ blockWithVariations }/orange`;
				const appleVariationName = `${ blockWithVariations }/apple`;
				expect( state ).toEqual( {
					insertUsage: expect.objectContaining( {
						[ orangeVariationName ]: {
							time: 123456,
							count: 1,
							insert: { name: orangeVariationName },
						},
						[ appleVariationName ]: {
							time: 123456,
							count: 1,
							insert: { name: appleVariationName },
						},
						[ blockWithVariations ]: {
							time: 123456,
							count: 2,
							insert: { name: blockWithVariations },
						},
					} ),
				} );
			} );
		} );
	} );

	describe( 'blocksMode', () => {
		it( 'should set mode to html if not set', () => {
			const action = {
				type: 'TOGGLE_BLOCK_MODE',
				clientId: 'chicken',
			};
			const value = blocksMode( deepFreeze( {} ), action );

			expect( value ).toEqual( { chicken: 'html' } );
		} );

		it( 'should toggle mode to visual if set as html', () => {
			const action = {
				type: 'TOGGLE_BLOCK_MODE',
				clientId: 'chicken',
			};
			const value = blocksMode(
				deepFreeze( { chicken: 'html' } ),
				action
			);

			expect( value ).toEqual( { chicken: 'visual' } );
		} );
	} );

	describe( 'template', () => {
		it( 'should default to visible', () => {
			const state = template( undefined, {} );

			expect( state ).toEqual( { isValid: true } );
		} );

		it( 'should reset the validity flag', () => {
			const original = deepFreeze( { isValid: false, template: [] } );
			const state = template( original, {
				type: 'SET_TEMPLATE_VALIDITY',
				isValid: true,
			} );

			expect( state ).toEqual( { isValid: true, template: [] } );
		} );
	} );

	describe( 'blockListSettings', () => {
		it( 'should add new settings', () => {
			const original = deepFreeze( {} );

			const state = blockListSettings( original, {
				type: 'UPDATE_BLOCK_LIST_SETTINGS',
				clientId: '9db792c6-a25a-495d-adbd-97d56a4c4189',
				settings: {
					allowedBlocks: [ 'core/paragraph' ],
				},
			} );

			expect( state ).toEqual( {
				'9db792c6-a25a-495d-adbd-97d56a4c4189': {
					allowedBlocks: [ 'core/paragraph' ],
				},
			} );
		} );

		it( 'should return same reference if updated as the same', () => {
			const original = deepFreeze( {
				'9db792c6-a25a-495d-adbd-97d56a4c4189': {
					allowedBlocks: [ 'core/paragraph' ],
				},
			} );

			const state = blockListSettings( original, {
				type: 'UPDATE_BLOCK_LIST_SETTINGS',
				clientId: '9db792c6-a25a-495d-adbd-97d56a4c4189',
				settings: {
					allowedBlocks: [ 'core/paragraph' ],
				},
			} );

			expect( state ).toBe( original );
		} );

		it( 'should return same reference if updated settings not assigned and id not exists', () => {
			const original = deepFreeze( {} );

			const state = blockListSettings( original, {
				type: 'UPDATE_BLOCK_LIST_SETTINGS',
				clientId: '9db792c6-a25a-495d-adbd-97d56a4c4189',
			} );

			expect( state ).toBe( original );
		} );

		it( 'should update the settings of a block', () => {
			const original = deepFreeze( {
				'9db792c6-a25a-495d-adbd-97d56a4c4189': {
					allowedBlocks: [ 'core/paragraph' ],
				},
				'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1': {
					allowedBlocks: true,
				},
			} );

			const state = blockListSettings( original, {
				type: 'UPDATE_BLOCK_LIST_SETTINGS',
				clientId: '9db792c6-a25a-495d-adbd-97d56a4c4189',
				settings: {
					allowedBlocks: [ 'core/list' ],
				},
			} );

			expect( state ).toEqual( {
				'9db792c6-a25a-495d-adbd-97d56a4c4189': {
					allowedBlocks: [ 'core/list' ],
				},
				'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1': {
					allowedBlocks: true,
				},
			} );
		} );

		it( 'should remove existing settings if updated settings not assigned', () => {
			const original = deepFreeze( {
				'9db792c6-a25a-495d-adbd-97d56a4c4189': {
					allowedBlocks: [ 'core/paragraph' ],
				},
			} );

			const state = blockListSettings( original, {
				type: 'UPDATE_BLOCK_LIST_SETTINGS',
				clientId: '9db792c6-a25a-495d-adbd-97d56a4c4189',
			} );

			expect( state ).toEqual( {} );
		} );

		it( 'should remove the settings of a block when it is replaced', () => {
			const original = deepFreeze( {
				'9db792c6-a25a-495d-adbd-97d56a4c4189': {
					allowedBlocks: [ 'core/paragraph' ],
				},
				'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1': {
					allowedBlocks: true,
				},
			} );

			const state = blockListSettings( original, {
				type: 'REPLACE_BLOCKS',
				clientIds: [ 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1' ],
			} );

			expect( state ).toEqual( {
				'9db792c6-a25a-495d-adbd-97d56a4c4189': {
					allowedBlocks: [ 'core/paragraph' ],
				},
			} );
		} );

		it( 'should remove the settings of a block when it is removed', () => {
			const original = deepFreeze( {
				'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1': {
					allowedBlocks: true,
				},
			} );

			const state = blockListSettings( original, {
				type: 'REMOVE_BLOCKS',
				clientIds: [ 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1' ],
			} );

			expect( state ).toEqual( {} );
		} );
	} );

	describe( 'lastBlockAttributesChange', () => {
		it( 'defaults to null', () => {
			const state = lastBlockAttributesChange( undefined, {} );

			expect( state ).toBe( null );
		} );

		it( 'does not return updated value when block update does not include attributes', () => {
			const original = null;

			const state = lastBlockAttributesChange( original, {
				type: 'UPDATE_BLOCK',
				clientId: 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1',
				updates: {},
			} );

			expect( state ).toBe( original );
		} );

		it( 'returns updated value when block update includes attributes', () => {
			const original = null;

			const state = lastBlockAttributesChange( original, {
				type: 'UPDATE_BLOCK',
				clientId: 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1',
				updates: {
					attributes: {
						food: 'banana',
					},
				},
			} );

			expect( state ).toEqual( {
				'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1': { food: 'banana' },
			} );
		} );

		it( 'returns updated value when explicit block attributes update', () => {
			const original = null;

			const state = lastBlockAttributesChange( original, {
				type: 'UPDATE_BLOCK_ATTRIBUTES',
				clientIds: [ 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1' ],
				attributes: {
					food: 'banana',
				},
			} );

			expect( state ).toEqual( {
				'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1': { food: 'banana' },
			} );
		} );

		it( 'returns updated value when explicit block attributes update are unique by block id', () => {
			const original = null;

			const state = lastBlockAttributesChange( original, {
				type: 'UPDATE_BLOCK_ATTRIBUTES',
				clientIds: [ 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1' ],
				attributes: {
					'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1': { food: 'banana' },
				},
				uniqueByBlock: true,
			} );

			expect( state ).toEqual( {
				'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1': { food: 'banana' },
			} );
		} );
	} );

	describe( 'lastBlockInserted', () => {
		it( 'should contain client id if last block inserted is called with action INSERT_BLOCKS', () => {
			const expectedClientId = '62bfef6e-d5e9-43ba-b7f9-c77cf354141f';

			const action = {
				blocks: [
					{
						clientId: expectedClientId,
					},
				],
				meta: {
					source: 'inserter_menu',
				},
				type: 'INSERT_BLOCKS',
			};

			const state = lastBlockInserted( {}, action );

			expect( state.clientIds ).toContain( expectedClientId );
		} );

		it( 'should return inserter_menu source if last block inserted is called with action INSERT_BLOCKS', () => {
			const expectedSource = 'inserter_menu';

			const action = {
				blocks: [
					{
						clientId: '62bfef6e-d5e9-43ba-b7f9-c77cf354141f',
					},
				],
				meta: {
					source: expectedSource,
				},
				type: 'INSERT_BLOCKS',
			};

			const state = lastBlockInserted( {}, action );

			expect( state.source ).toBe( expectedSource );
		} );

		it( 'should return state if last block inserted is called with action INSERT_BLOCKS and block list is empty', () => {
			const expectedState = {
				clientIds: [ '9db792c6-a25a-495d-adbd-97d56a4c4189' ],
			};

			const action = {
				blocks: [],
				meta: {
					source: 'inserter_menu',
				},
				type: 'INSERT_BLOCKS',
			};

			const state = lastBlockInserted( expectedState, action );

			expect( state ).toEqual( expectedState );
		} );

		it( 'should return client ids of blocks when called with REPLACE_BLOCKS', () => {
			const clientIdOne = '62bfef6e-d5e9-43ba-b7f9-c77cf354141f';
			const clientIdTwo = '9db792c6-a25a-495d-adbd-97d56a4c4189';

			const action = {
				blocks: [
					{
						clientId: clientIdOne,
					},
					{
						clientId: clientIdTwo,
					},
				],
				type: 'REPLACE_BLOCKS',
			};

			const state = lastBlockInserted( {}, action );

			expect( state.clientIds ).toEqual( [ clientIdOne, clientIdTwo ] );
		} );

		it( 'should return client ids of all blocks when inner blocks are replaced with REPLACE_INNER_BLOCKS', () => {
			const clientIdOne = '62bfef6e-d5e9-43ba-b7f9-c77cf354141f';
			const clientIdTwo = '9db792c6-a25a-495d-adbd-97d56a4c4189';

			const action = {
				blocks: [
					{
						clientId: clientIdOne,
					},
					{
						clientId: clientIdTwo,
					},
				],
				type: 'REPLACE_INNER_BLOCKS',
			};

			const state = lastBlockInserted( {}, action );

			expect( state.clientIds ).toEqual( [ clientIdOne, clientIdTwo ] );
		} );

		it( 'should return empty state if last block inserted is called with action RESET_BLOCKS', () => {
			const expectedState = {};

			const action = {
				type: 'RESET_BLOCKS',
			};

			const state = lastBlockInserted( expectedState, action );

			expect( state ).toEqual( expectedState );
		} );
	} );
} );
