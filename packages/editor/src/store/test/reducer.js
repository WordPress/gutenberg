/**
 * External dependencies
 */
import { values, noop } from 'lodash';
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
	isUpdatingSamePostProperty,
	shouldOverwriteState,
	getPostRawValue,
	editor,
	initialEdits,
	currentPost,
	isTyping,
	isCaretWithinFormattedText,
	blockSelection,
	preferences,
	saving,
	blocksMode,
	insertionPoint,
	reusableBlocks,
	template,
	blockListSettings,
	autosave,
	postSavingLock,
	previewLink,
} from '../reducer';
import { INITIAL_EDITS_DEFAULTS } from '../defaults';

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
				type: 'EDIT_POST',
				edits: {},
			};
			const previousAction = {
				type: 'EDIT_POST',
				edits: {},
			};

			expect( isUpdatingSameBlockAttribute( action, previousAction ) ).toBe( false );
		} );

		it( 'should return false if not updating the same block', () => {
			const action = {
				type: 'UPDATE_BLOCK_ATTRIBUTES',
				clientId: '9db792c6-a25a-495d-adbd-97d56a4c4189',
				attributes: {
					foo: 10,
				},
			};
			const previousAction = {
				type: 'UPDATE_BLOCK_ATTRIBUTES',
				clientId: 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1',
				attributes: {
					foo: 20,
				},
			};

			expect( isUpdatingSameBlockAttribute( action, previousAction ) ).toBe( false );
		} );

		it( 'should return false if not updating the same block attributes', () => {
			const action = {
				type: 'UPDATE_BLOCK_ATTRIBUTES',
				clientId: '9db792c6-a25a-495d-adbd-97d56a4c4189',
				attributes: {
					foo: 10,
				},
			};
			const previousAction = {
				type: 'UPDATE_BLOCK_ATTRIBUTES',
				clientId: '9db792c6-a25a-495d-adbd-97d56a4c4189',
				attributes: {
					bar: 20,
				},
			};

			expect( isUpdatingSameBlockAttribute( action, previousAction ) ).toBe( false );
		} );

		it( 'should return true if updating the same block attributes', () => {
			const action = {
				type: 'UPDATE_BLOCK_ATTRIBUTES',
				clientId: '9db792c6-a25a-495d-adbd-97d56a4c4189',
				attributes: {
					foo: 10,
				},
			};
			const previousAction = {
				type: 'UPDATE_BLOCK_ATTRIBUTES',
				clientId: '9db792c6-a25a-495d-adbd-97d56a4c4189',
				attributes: {
					foo: 20,
				},
			};

			expect( isUpdatingSameBlockAttribute( action, previousAction ) ).toBe( true );
		} );
	} );

	describe( 'isUpdatingSamePostProperty()', () => {
		it( 'should return false if not editing post', () => {
			const action = {
				type: 'UPDATE_BLOCK_ATTRIBUTES',
				clientId: 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1',
				attributes: {
					foo: 10,
				},
			};
			const previousAction = {
				type: 'UPDATE_BLOCK_ATTRIBUTES',
				clientId: 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1',
				attributes: {
					foo: 10,
				},
			};

			expect( isUpdatingSamePostProperty( action, previousAction ) ).toBe( false );
		} );

		it( 'should return false if not editing the same post properties', () => {
			const action = {
				type: 'EDIT_POST',
				edits: {
					foo: 10,
				},
			};
			const previousAction = {
				type: 'EDIT_POST',
				edits: {
					bar: 20,
				},
			};

			expect( isUpdatingSamePostProperty( action, previousAction ) ).toBe( false );
		} );

		it( 'should return true if updating the same post properties', () => {
			const action = {
				type: 'EDIT_POST',
				edits: {
					foo: 10,
				},
			};
			const previousAction = {
				type: 'EDIT_POST',
				edits: {
					foo: 20,
				},
			};

			expect( isUpdatingSamePostProperty( action, previousAction ) ).toBe( true );
		} );
	} );

	describe( 'shouldOverwriteState()', () => {
		it( 'should return false if no previous action', () => {
			const action = {
				type: 'EDIT_POST',
				edits: {
					foo: 10,
				},
			};
			const previousAction = undefined;

			expect( shouldOverwriteState( action, previousAction ) ).toBe( false );
		} );

		it( 'should return false if the action types are different', () => {
			const action = {
				type: 'EDIT_POST',
				edits: {
					foo: 10,
				},
			};
			const previousAction = {
				type: 'EDIT_DIFFERENT_POST',
				edits: {
					foo: 20,
				},
			};

			expect( shouldOverwriteState( action, previousAction ) ).toBe( false );
		} );

		it( 'should return true if updating same block attribute', () => {
			const action = {
				type: 'UPDATE_BLOCK_ATTRIBUTES',
				clientId: '9db792c6-a25a-495d-adbd-97d56a4c4189',
				attributes: {
					foo: 10,
				},
			};
			const previousAction = {
				type: 'UPDATE_BLOCK_ATTRIBUTES',
				clientId: '9db792c6-a25a-495d-adbd-97d56a4c4189',
				attributes: {
					foo: 20,
				},
			};

			expect( shouldOverwriteState( action, previousAction ) ).toBe( true );
		} );

		it( 'should return true if updating same post property', () => {
			const action = {
				type: 'EDIT_POST',
				edits: {
					foo: 10,
				},
			};
			const previousAction = {
				type: 'EDIT_POST',
				edits: {
					foo: 20,
				},
			};

			expect( shouldOverwriteState( action, previousAction ) ).toBe( true );
		} );
	} );

	describe( 'getPostRawValue', () => {
		it( 'returns original value for non-rendered content', () => {
			const value = getPostRawValue( '' );

			expect( value ).toBe( '' );
		} );

		it( 'returns raw value for rendered content', () => {
			const value = getPostRawValue( { raw: '' } );

			expect( value ).toBe( '' );
		} );
	} );

	describe( 'editor()', () => {
		beforeAll( () => {
			registerBlockType( 'core/test-block', {
				save: noop,
				edit: noop,
				category: 'common',
				title: 'test block',
			} );
		} );

		afterAll( () => {
			unregisterBlockType( 'core/test-block' );
		} );

		it( 'should return history (empty edits, blocks) by default', () => {
			const state = editor( undefined, {} );

			expect( state.past ).toEqual( [] );
			expect( state.future ).toEqual( [] );
			expect( state.present.edits ).toEqual( {} );
			expect( state.present.blocks.byClientId ).toEqual( {} );
			expect( state.present.blocks.order ).toEqual( {} );
			expect( state.present.blocks.isDirty ).toBe( false );
		} );

		it( 'should key by reset blocks clientId', () => {
			const original = editor( undefined, {} );
			const state = editor( original, {
				type: 'RESET_BLOCKS',
				blocks: [ { clientId: 'bananas', innerBlocks: [] } ],
			} );

			expect( Object.keys( state.present.blocks.byClientId ) ).toHaveLength( 1 );
			expect( values( state.present.blocks.byClientId )[ 0 ].clientId ).toBe( 'bananas' );
			expect( state.present.blocks.order ).toEqual( {
				'': [ 'bananas' ],
				bananas: [],
			} );
		} );

		it( 'should key by reset blocks clientId, including inner blocks', () => {
			const original = editor( undefined, {} );
			const state = editor( original, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					clientId: 'bananas',
					innerBlocks: [ { clientId: 'apples', innerBlocks: [] } ],
				} ],
			} );

			expect( Object.keys( state.present.blocks.byClientId ) ).toHaveLength( 2 );
			expect( state.present.blocks.order ).toEqual( {
				'': [ 'bananas' ],
				apples: [],
				bananas: [ 'apples' ],
			} );
		} );

		it( 'should insert block', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					clientId: 'chicken',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				} ],
			} );
			const state = editor( original, {
				type: 'INSERT_BLOCKS',
				blocks: [ {
					clientId: 'ribs',
					name: 'core/freeform',
					innerBlocks: [],
				} ],
			} );

			expect( Object.keys( state.present.blocks.byClientId ) ).toHaveLength( 2 );
			expect( values( state.present.blocks.byClientId )[ 1 ].clientId ).toBe( 'ribs' );
			expect( state.present.blocks.order ).toEqual( {
				'': [ 'chicken', 'ribs' ],
				chicken: [],
				ribs: [],
			} );
		} );

		it( 'should replace the block', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					clientId: 'chicken',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				} ],
			} );
			const state = editor( original, {
				type: 'REPLACE_BLOCKS',
				clientIds: [ 'chicken' ],
				blocks: [ {
					clientId: 'wings',
					name: 'core/freeform',
					innerBlocks: [],
				} ],
			} );

			expect( Object.keys( state.present.blocks.byClientId ) ).toHaveLength( 1 );
			expect( values( state.present.blocks.byClientId )[ 0 ].name ).toBe( 'core/freeform' );
			expect( values( state.present.blocks.byClientId )[ 0 ].clientId ).toBe( 'wings' );
			expect( state.present.blocks.order ).toEqual( {
				'': [ 'wings' ],
				wings: [],
			} );
		} );

		it( 'should replace the nested block', () => {
			const nestedBlock = createBlock( 'core/test-block' );
			const wrapperBlock = createBlock( 'core/test-block', {}, [ nestedBlock ] );
			const replacementBlock = createBlock( 'core/test-block' );
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ wrapperBlock ],
			} );

			const state = editor( original, {
				type: 'REPLACE_BLOCKS',
				clientIds: [ nestedBlock.clientId ],
				blocks: [ replacementBlock ],
			} );

			expect( state.present.blocks.order ).toEqual( {
				'': [ wrapperBlock.clientId ],
				[ wrapperBlock.clientId ]: [ replacementBlock.clientId ],
				[ replacementBlock.clientId ]: [],
			} );
		} );

		it( 'should replace the block even if the new block clientId is the same', () => {
			const originalState = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					clientId: 'chicken',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				} ],
			} );
			const replacedState = editor( originalState, {
				type: 'REPLACE_BLOCKS',
				clientIds: [ 'chicken' ],
				blocks: [ {
					clientId: 'chicken',
					name: 'core/freeform',
					innerBlocks: [],
				} ],
			} );

			expect( Object.keys( replacedState.present.blocks.byClientId ) ).toHaveLength( 1 );
			expect( values( originalState.present.blocks.byClientId )[ 0 ].name ).toBe( 'core/test-block' );
			expect( values( replacedState.present.blocks.byClientId )[ 0 ].name ).toBe( 'core/freeform' );
			expect( values( replacedState.present.blocks.byClientId )[ 0 ].clientId ).toBe( 'chicken' );
			expect( replacedState.present.blocks.order ).toEqual( {
				'': [ 'chicken' ],
				chicken: [],
			} );

			const nestedBlock = {
				clientId: 'chicken',
				name: 'core/test-block',
				attributes: {},
				innerBlocks: [],
			};
			const wrapperBlock = createBlock( 'core/test-block', {}, [ nestedBlock ] );
			const replacementNestedBlock = {
				clientId: 'chicken',
				name: 'core/freeform',
				attributes: {},
				innerBlocks: [],
			};

			const originalNestedState = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ wrapperBlock ],
			} );

			const replacedNestedState = editor( originalNestedState, {
				type: 'REPLACE_BLOCKS',
				clientIds: [ nestedBlock.clientId ],
				blocks: [ replacementNestedBlock ],
			} );

			expect( replacedNestedState.present.blocks.order ).toEqual( {
				'': [ wrapperBlock.clientId ],
				[ wrapperBlock.clientId ]: [ replacementNestedBlock.clientId ],
				[ replacementNestedBlock.clientId ]: [],
			} );

			expect( originalNestedState.present.blocks.byClientId.chicken.name ).toBe( 'core/test-block' );
			expect( replacedNestedState.present.blocks.byClientId.chicken.name ).toBe( 'core/freeform' );
		} );

		it( 'should update the block', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					clientId: 'chicken',
					name: 'core/test-block',
					attributes: {},
					isValid: false,
					innerBlocks: [],
				} ],
			} );
			const state = editor( deepFreeze( original ), {
				type: 'UPDATE_BLOCK',
				clientId: 'chicken',
				updates: {
					attributes: { content: 'ribs' },
					isValid: true,
				},
			} );

			expect( state.present.blocks.byClientId.chicken ).toEqual( {
				clientId: 'chicken',
				name: 'core/test-block',
				isValid: true,
			} );

			expect( state.present.blocks.attributes.chicken ).toEqual( {
				content: 'ribs',
			} );
		} );

		it( 'should update the reusable block reference if the temporary id is swapped', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					clientId: 'chicken',
					name: 'core/block',
					attributes: {
						ref: 'random-clientId',
					},
					isValid: false,
					innerBlocks: [],
				} ],
			} );

			const state = editor( deepFreeze( original ), {
				type: 'SAVE_REUSABLE_BLOCK_SUCCESS',
				id: 'random-clientId',
				updatedId: 3,
			} );

			expect( state.present.blocks.byClientId.chicken ).toEqual( {
				clientId: 'chicken',
				name: 'core/block',
				isValid: false,
			} );

			expect( state.present.blocks.attributes.chicken ).toEqual( {
				ref: 3,
			} );
		} );

		it( 'should move the block up', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					clientId: 'chicken',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					clientId: 'ribs',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				} ],
			} );
			const state = editor( original, {
				type: 'MOVE_BLOCKS_UP',
				clientIds: [ 'ribs' ],
			} );

			expect( state.present.blocks.order[ '' ] ).toEqual( [ 'ribs', 'chicken' ] );
		} );

		it( 'should move the nested block up', () => {
			const movedBlock = createBlock( 'core/test-block' );
			const siblingBlock = createBlock( 'core/test-block' );
			const wrapperBlock = createBlock( 'core/test-block', {}, [ siblingBlock, movedBlock ] );
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ wrapperBlock ],
			} );
			const state = editor( original, {
				type: 'MOVE_BLOCKS_UP',
				clientIds: [ movedBlock.clientId ],
				rootClientId: wrapperBlock.clientId,
			} );

			expect( state.present.blocks.order ).toEqual( {
				'': [ wrapperBlock.clientId ],
				[ wrapperBlock.clientId ]: [ movedBlock.clientId, siblingBlock.clientId ],
				[ movedBlock.clientId ]: [],
				[ siblingBlock.clientId ]: [],
			} );
		} );

		it( 'should move multiple blocks up', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					clientId: 'chicken',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					clientId: 'ribs',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					clientId: 'veggies',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				} ],
			} );
			const state = editor( original, {
				type: 'MOVE_BLOCKS_UP',
				clientIds: [ 'ribs', 'veggies' ],
			} );

			expect( state.present.blocks.order[ '' ] ).toEqual( [ 'ribs', 'veggies', 'chicken' ] );
		} );

		it( 'should move multiple nested blocks up', () => {
			const movedBlockA = createBlock( 'core/test-block' );
			const movedBlockB = createBlock( 'core/test-block' );
			const siblingBlock = createBlock( 'core/test-block' );
			const wrapperBlock = createBlock( 'core/test-block', {}, [ siblingBlock, movedBlockA, movedBlockB ] );
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ wrapperBlock ],
			} );
			const state = editor( original, {
				type: 'MOVE_BLOCKS_UP',
				clientIds: [ movedBlockA.clientId, movedBlockB.clientId ],
				rootClientId: wrapperBlock.clientId,
			} );

			expect( state.present.blocks.order ).toEqual( {
				'': [ wrapperBlock.clientId ],
				[ wrapperBlock.clientId ]: [ movedBlockA.clientId, movedBlockB.clientId, siblingBlock.clientId ],
				[ movedBlockA.clientId ]: [],
				[ movedBlockB.clientId ]: [],
				[ siblingBlock.clientId ]: [],
			} );
		} );

		it( 'should not move the first block up', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					clientId: 'chicken',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					clientId: 'ribs',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				} ],
			} );
			const state = editor( original, {
				type: 'MOVE_BLOCKS_UP',
				clientIds: [ 'chicken' ],
			} );

			expect( state.present.blocks.order ).toBe( original.present.blocks.order );
		} );

		it( 'should move the block down', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					clientId: 'chicken',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					clientId: 'ribs',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				} ],
			} );
			const state = editor( original, {
				type: 'MOVE_BLOCKS_DOWN',
				clientIds: [ 'chicken' ],
			} );

			expect( state.present.blocks.order[ '' ] ).toEqual( [ 'ribs', 'chicken' ] );
		} );

		it( 'should move the nested block down', () => {
			const movedBlock = createBlock( 'core/test-block' );
			const siblingBlock = createBlock( 'core/test-block' );
			const wrapperBlock = createBlock( 'core/test-block', {}, [ movedBlock, siblingBlock ] );
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ wrapperBlock ],
			} );
			const state = editor( original, {
				type: 'MOVE_BLOCKS_DOWN',
				clientIds: [ movedBlock.clientId ],
				rootClientId: wrapperBlock.clientId,
			} );

			expect( state.present.blocks.order ).toEqual( {
				'': [ wrapperBlock.clientId ],
				[ wrapperBlock.clientId ]: [ siblingBlock.clientId, movedBlock.clientId ],
				[ movedBlock.clientId ]: [],
				[ siblingBlock.clientId ]: [],
			} );
		} );

		it( 'should move multiple blocks down', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					clientId: 'chicken',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					clientId: 'ribs',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					clientId: 'veggies',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				} ],
			} );
			const state = editor( original, {
				type: 'MOVE_BLOCKS_DOWN',
				clientIds: [ 'chicken', 'ribs' ],
			} );

			expect( state.present.blocks.order[ '' ] ).toEqual( [ 'veggies', 'chicken', 'ribs' ] );
		} );

		it( 'should move multiple nested blocks down', () => {
			const movedBlockA = createBlock( 'core/test-block' );
			const movedBlockB = createBlock( 'core/test-block' );
			const siblingBlock = createBlock( 'core/test-block' );
			const wrapperBlock = createBlock( 'core/test-block', {}, [ movedBlockA, movedBlockB, siblingBlock ] );
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ wrapperBlock ],
			} );
			const state = editor( original, {
				type: 'MOVE_BLOCKS_DOWN',
				clientIds: [ movedBlockA.clientId, movedBlockB.clientId ],
				rootClientId: wrapperBlock.clientId,
			} );

			expect( state.present.blocks.order ).toEqual( {
				'': [ wrapperBlock.clientId ],
				[ wrapperBlock.clientId ]: [ siblingBlock.clientId, movedBlockA.clientId, movedBlockB.clientId ],
				[ movedBlockA.clientId ]: [],
				[ movedBlockB.clientId ]: [],
				[ siblingBlock.clientId ]: [],
			} );
		} );

		it( 'should not move the last block down', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					clientId: 'chicken',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					clientId: 'ribs',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				} ],
			} );
			const state = editor( original, {
				type: 'MOVE_BLOCKS_DOWN',
				clientIds: [ 'ribs' ],
			} );

			expect( state.present.blocks.order ).toBe( original.present.blocks.order );
		} );

		it( 'should remove the block', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					clientId: 'chicken',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					clientId: 'ribs',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				} ],
			} );
			const state = editor( original, {
				type: 'REMOVE_BLOCKS',
				clientIds: [ 'chicken' ],
			} );

			expect( state.present.blocks.order[ '' ] ).toEqual( [ 'ribs' ] );
			expect( state.present.blocks.order ).not.toHaveProperty( 'chicken' );
			expect( state.present.blocks.byClientId ).toEqual( {
				ribs: {
					clientId: 'ribs',
					name: 'core/test-block',
				},
			} );
			expect( state.present.blocks.attributes ).toEqual( {
				ribs: {},
			} );
		} );

		it( 'should remove multiple blocks', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					clientId: 'chicken',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					clientId: 'ribs',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					clientId: 'veggies',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				} ],
			} );
			const state = editor( original, {
				type: 'REMOVE_BLOCKS',
				clientIds: [ 'chicken', 'veggies' ],
			} );

			expect( state.present.blocks.order[ '' ] ).toEqual( [ 'ribs' ] );
			expect( state.present.blocks.order ).not.toHaveProperty( 'chicken' );
			expect( state.present.blocks.order ).not.toHaveProperty( 'veggies' );
			expect( state.present.blocks.byClientId ).toEqual( {
				ribs: {
					clientId: 'ribs',
					name: 'core/test-block',
				},
			} );
			expect( state.present.blocks.attributes ).toEqual( {
				ribs: {},
			} );
		} );

		it( 'should cascade remove to include inner blocks', () => {
			const block = createBlock( 'core/test-block', {}, [
				createBlock( 'core/test-block', {}, [
					createBlock( 'core/test-block' ),
				] ),
			] );

			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ block ],
			} );

			const state = editor( original, {
				type: 'REMOVE_BLOCKS',
				clientIds: [ block.clientId ],
			} );

			expect( state.present.blocks.byClientId ).toEqual( {} );
			expect( state.present.blocks.order ).toEqual( {
				'': [],
			} );
		} );

		it( 'should insert at the specified index', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					clientId: 'kumquat',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					clientId: 'loquat',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				} ],
			} );

			const state = editor( original, {
				type: 'INSERT_BLOCKS',
				index: 1,
				blocks: [ {
					clientId: 'persimmon',
					name: 'core/freeform',
					innerBlocks: [],
				} ],
			} );

			expect( Object.keys( state.present.blocks.byClientId ) ).toHaveLength( 3 );
			expect( state.present.blocks.order[ '' ] ).toEqual( [ 'kumquat', 'persimmon', 'loquat' ] );
		} );

		it( 'should move block to lower index', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					clientId: 'chicken',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					clientId: 'ribs',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					clientId: 'veggies',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				} ],
			} );
			const state = editor( original, {
				type: 'MOVE_BLOCK_TO_POSITION',
				clientId: 'ribs',
				index: 0,
			} );

			expect( state.present.blocks.order[ '' ] ).toEqual( [ 'ribs', 'chicken', 'veggies' ] );
		} );

		it( 'should move block to higher index', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					clientId: 'chicken',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					clientId: 'ribs',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					clientId: 'veggies',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				} ],
			} );
			const state = editor( original, {
				type: 'MOVE_BLOCK_TO_POSITION',
				clientId: 'ribs',
				index: 2,
			} );

			expect( state.present.blocks.order[ '' ] ).toEqual( [ 'chicken', 'veggies', 'ribs' ] );
		} );

		it( 'should not move block if passed same index', () => {
			const original = editor( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					clientId: 'chicken',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					clientId: 'ribs',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				}, {
					clientId: 'veggies',
					name: 'core/test-block',
					attributes: {},
					innerBlocks: [],
				} ],
			} );
			const state = editor( original, {
				type: 'MOVE_BLOCK_TO_POSITION',
				clientId: 'ribs',
				index: 1,
			} );

			expect( state.present.blocks.order[ '' ] ).toEqual( [ 'chicken', 'ribs', 'veggies' ] );
		} );

		describe( 'edits()', () => {
			it( 'should save newly edited properties', () => {
				const original = editor( undefined, {
					type: 'EDIT_POST',
					edits: {
						status: 'draft',
						title: 'post title',
					},
				} );

				const state = editor( original, {
					type: 'EDIT_POST',
					edits: {
						tags: [ 1 ],
					},
				} );

				expect( state.present.edits ).toEqual( {
					status: 'draft',
					title: 'post title',
					tags: [ 1 ],
				} );
			} );

			it( 'should return same reference if no changed properties', () => {
				const original = editor( undefined, {
					type: 'EDIT_POST',
					edits: {
						status: 'draft',
						title: 'post title',
					},
				} );

				const state = editor( original, {
					type: 'EDIT_POST',
					edits: {
						status: 'draft',
					},
				} );

				expect( state.present.edits ).toBe( original.present.edits );
			} );

			it( 'should save modified properties', () => {
				const original = editor( undefined, {
					type: 'EDIT_POST',
					edits: {
						status: 'draft',
						title: 'post title',
						tags: [ 1 ],
					},
				} );

				const state = editor( original, {
					type: 'EDIT_POST',
					edits: {
						title: 'modified title',
						tags: [ 2 ],
					},
				} );

				expect( state.present.edits ).toEqual( {
					status: 'draft',
					title: 'modified title',
					tags: [ 2 ],
				} );
			} );

			it( 'should merge object values', () => {
				const original = editor( undefined, {
					type: 'EDIT_POST',
					edits: {
						meta: {
							a: 1,
						},
					},
				} );

				const state = editor( original, {
					type: 'EDIT_POST',
					edits: {
						meta: {
							b: 2,
						},
					},
				} );

				expect( state.present.edits ).toEqual( {
					meta: {
						a: 1,
						b: 2,
					},
				} );
			} );

			it( 'return state by reference on unchanging update', () => {
				const original = editor( undefined, {} );

				const state = editor( original, {
					type: 'UPDATE_POST',
					edits: {},
				} );

				expect( state.present.edits ).toBe( original.present.edits );
			} );

			it( 'unset reset post values which match by canonical value', () => {
				const original = editor( undefined, {
					type: 'EDIT_POST',
					edits: {
						title: 'modified title',
					},
				} );

				const state = editor( original, {
					type: 'RESET_POST',
					post: {
						title: {
							raw: 'modified title',
						},
					},
				} );

				expect( state.present.edits ).toEqual( {} );
			} );

			it( 'unset reset post values by deep match', () => {
				const original = editor( undefined, {
					type: 'EDIT_POST',
					edits: {
						title: 'modified title',
						meta: {
							a: 1,
							b: 2,
						},
					},
				} );

				const state = editor( original, {
					type: 'UPDATE_POST',
					edits: {
						title: 'modified title',
						meta: {
							a: 1,
							b: 2,
						},
					},
				} );

				expect( state.present.edits ).toEqual( {} );
			} );

			it( 'should omit content when resetting', () => {
				// Use case: When editing in Text mode, we defer to content on
				// the property, but we reset blocks by parse when switching
				// back to Visual mode.
				const original = deepFreeze( editor( undefined, {} ) );
				let state = editor( original, {
					type: 'EDIT_POST',
					edits: {
						content: 'bananas',
					},
				} );

				expect( state.present.edits ).toHaveProperty( 'content' );

				state = editor( original, {
					type: 'RESET_BLOCKS',
					blocks: [ {
						clientId: 'kumquat',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
					}, {
						clientId: 'loquat',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
					} ],
				} );

				expect( state.present.edits ).not.toHaveProperty( 'content' );
			} );
		} );

		describe( 'blocks', () => {
			it( 'should not reset any blocks that are not in the post', () => {
				const actions = [
					{
						type: 'RESET_BLOCKS',
						blocks: [
							{
								clientId: 'block1',
								innerBlocks: [
									{ clientId: 'block11', innerBlocks: [] },
									{ clientId: 'block12', innerBlocks: [] },
								],
							},
						],
					},
					{
						type: 'RECEIVE_BLOCKS',
						blocks: [
							{
								clientId: 'block2',
								innerBlocks: [
									{ clientId: 'block21', innerBlocks: [] },
									{ clientId: 'block22', innerBlocks: [] },
								],
							},
						],
					},
				];
				const original = deepFreeze( actions.reduce( editor, undefined ) );

				const state = editor( original, {
					type: 'RESET_BLOCKS',
					blocks: [
						{
							clientId: 'block3',
							innerBlocks: [
								{ clientId: 'block31', innerBlocks: [] },
								{ clientId: 'block32', innerBlocks: [] },
							],
						},
					],
				} );

				expect( state.present.blocks.byClientId ).toEqual( {
					block2: { clientId: 'block2' },
					block21: { clientId: 'block21' },
					block22: { clientId: 'block22' },
					block3: { clientId: 'block3' },
					block31: { clientId: 'block31' },
					block32: { clientId: 'block32' },
				} );
			} );

			describe( 'byClientId', () => {
				it( 'should ignore updates to non-existent block', () => {
					const original = deepFreeze( editor( undefined, {
						type: 'RESET_BLOCKS',
						blocks: [],
					} ) );
					const state = editor( original, {
						type: 'UPDATE_BLOCK_ATTRIBUTES',
						clientId: 'kumquat',
						attributes: {
							updated: true,
						},
					} );

					expect( state.present.blocks.byClientId ).toBe( original.present.blocks.byClientId );
				} );

				it( 'should return with same reference if no changes in updates', () => {
					const original = deepFreeze( editor( undefined, {
						type: 'RESET_BLOCKS',
						blocks: [ {
							clientId: 'kumquat',
							attributes: {
								updated: true,
							},
							innerBlocks: [],
						} ],
					} ) );
					const state = editor( original, {
						type: 'UPDATE_BLOCK_ATTRIBUTES',
						clientId: 'kumquat',
						attributes: {
							updated: true,
						},
					} );

					expect( state.present.blocks.byClientId ).toBe( state.present.blocks.byClientId );
				} );
			} );

			describe( 'attributes', () => {
				it( 'should return with attribute block updates', () => {
					const original = deepFreeze( editor( undefined, {
						type: 'RESET_BLOCKS',
						blocks: [ {
							clientId: 'kumquat',
							attributes: {},
							innerBlocks: [],
						} ],
					} ) );
					const state = editor( original, {
						type: 'UPDATE_BLOCK_ATTRIBUTES',
						clientId: 'kumquat',
						attributes: {
							updated: true,
						},
					} );

					expect( state.present.blocks.attributes.kumquat.updated ).toBe( true );
				} );

				it( 'should accumulate attribute block updates', () => {
					const original = deepFreeze( editor( undefined, {
						type: 'RESET_BLOCKS',
						blocks: [ {
							clientId: 'kumquat',
							attributes: {
								updated: true,
							},
							innerBlocks: [],
						} ],
					} ) );
					const state = editor( original, {
						type: 'UPDATE_BLOCK_ATTRIBUTES',
						clientId: 'kumquat',
						attributes: {
							moreUpdated: true,
						},
					} );

					expect( state.present.blocks.attributes.kumquat ).toEqual( {
						updated: true,
						moreUpdated: true,
					} );
				} );

				it( 'should ignore updates to non-existent block', () => {
					const original = deepFreeze( editor( undefined, {
						type: 'RESET_BLOCKS',
						blocks: [],
					} ) );
					const state = editor( original, {
						type: 'UPDATE_BLOCK_ATTRIBUTES',
						clientId: 'kumquat',
						attributes: {
							updated: true,
						},
					} );

					expect( state.present.blocks.attributes ).toBe( original.present.blocks.attributes );
				} );

				it( 'should return with same reference if no changes in updates', () => {
					const original = deepFreeze( editor( undefined, {
						type: 'RESET_BLOCKS',
						blocks: [ {
							clientId: 'kumquat',
							attributes: {
								updated: true,
							},
							innerBlocks: [],
						} ],
					} ) );
					const state = editor( original, {
						type: 'UPDATE_BLOCK_ATTRIBUTES',
						clientId: 'kumquat',
						attributes: {
							updated: true,
						},
					} );

					expect( state.present.blocks.attributes ).toBe( state.present.blocks.attributes );
				} );
			} );
		} );

		describe( 'withHistory', () => {
			it( 'should overwrite present history if updating same attributes', () => {
				let state;

				state = editor( state, {
					type: 'RESET_BLOCKS',
					blocks: [ {
						clientId: 'kumquat',
						attributes: {},
						innerBlocks: [],
					} ],
				} );

				expect( state.past ).toHaveLength( 1 );

				state = editor( state, {
					type: 'UPDATE_BLOCK_ATTRIBUTES',
					clientId: 'kumquat',
					attributes: {
						test: 1,
					},
				} );

				state = editor( state, {
					type: 'UPDATE_BLOCK_ATTRIBUTES',
					clientId: 'kumquat',
					attributes: {
						test: 2,
					},
				} );

				expect( state.past ).toHaveLength( 2 );
			} );

			it( 'should not overwrite present history if updating different attributes', () => {
				let state;

				state = editor( state, {
					type: 'RESET_BLOCKS',
					blocks: [ {
						clientId: 'kumquat',
						attributes: {},
						innerBlocks: [],
					} ],
				} );

				expect( state.past ).toHaveLength( 1 );

				state = editor( state, {
					type: 'UPDATE_BLOCK_ATTRIBUTES',
					clientId: 'kumquat',
					attributes: {
						test: 1,
					},
				} );

				state = editor( state, {
					type: 'UPDATE_BLOCK_ATTRIBUTES',
					clientId: 'kumquat',
					attributes: {
						other: 1,
					},
				} );

				expect( state.past ).toHaveLength( 3 );
			} );
		} );
	} );

	describe( 'initialEdits', () => {
		it( 'should default to initial edits', () => {
			const state = initialEdits( undefined, {} );

			expect( state ).toBe( INITIAL_EDITS_DEFAULTS );
		} );

		it( 'should return initial edits on post reset', () => {
			const state = initialEdits( undefined, {
				type: 'RESET_POST',
			} );

			expect( state ).toBe( INITIAL_EDITS_DEFAULTS );
		} );

		it( 'should return referentially equal state if setup includes no edits', () => {
			const original = initialEdits( undefined, {} );
			const state = initialEdits( deepFreeze( original ), {
				type: 'SETUP_EDITOR',
			} );

			expect( state ).toBe( original );
		} );

		it( 'should return referentially equal state if reset while having made no edits', () => {
			const original = initialEdits( undefined, {} );
			const state = initialEdits( deepFreeze( original ), {
				type: 'RESET_POST',
			} );

			expect( state ).toBe( original );
		} );

		it( 'should return setup edits', () => {
			const original = initialEdits( undefined, {} );
			const state = initialEdits( deepFreeze( original ), {
				type: 'SETUP_EDITOR',
				edits: {
					title: '',
					content: '',
				},
			} );

			expect( state ).toEqual( {
				title: '',
				content: '',
			} );
		} );

		it( 'should unset content on editor setup', () => {
			const original = initialEdits( undefined, {
				type: 'SETUP_EDITOR',
				edits: {
					title: '',
					content: '',
				},
			} );
			const state = initialEdits( deepFreeze( original ), {
				type: 'SETUP_EDITOR_STATE',
			} );

			expect( state ).toEqual( { title: '' } );
		} );

		it( 'should unset values on post update', () => {
			const original = initialEdits( undefined, {
				type: 'SETUP_EDITOR',
				edits: {
					title: '',
				},
			} );
			const state = initialEdits( deepFreeze( original ), {
				type: 'UPDATE_POST',
				edits: {
					title: '',
				},
			} );

			expect( state ).toEqual( {} );
		} );
	} );

	describe( 'currentPost()', () => {
		it( 'should reset a post object', () => {
			const original = deepFreeze( { title: 'unmodified' } );

			const state = currentPost( original, {
				type: 'RESET_POST',
				post: {
					title: 'new post',
				},
			} );

			expect( state ).toEqual( {
				title: 'new post',
			} );
		} );

		it( 'should update the post object with UPDATE_POST', () => {
			const original = deepFreeze( { title: 'unmodified', status: 'publish' } );

			const state = currentPost( original, {
				type: 'UPDATE_POST',
				edits: {
					title: 'updated post object from server',
				},
			} );

			expect( state ).toEqual( {
				title: 'updated post object from server',
				status: 'publish',
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

	describe( 'isCaretWithinFormattedText()', () => {
		it( 'should set the flag to true', () => {
			const state = isCaretWithinFormattedText( false, {
				type: 'ENTER_FORMATTED_TEXT',
			} );

			expect( state ).toBe( true );
		} );

		it( 'should set the flag to false', () => {
			const state = isCaretWithinFormattedText( true, {
				type: 'EXIT_FORMATTED_TEXT',
			} );

			expect( state ).toBe( false );
		} );
	} );

	describe( 'blockSelection()', () => {
		it( 'should return with block clientId as selected', () => {
			const state = blockSelection( undefined, {
				type: 'SELECT_BLOCK',
				clientId: 'kumquat',
				initialPosition: -1,
			} );

			expect( state ).toEqual( {
				start: 'kumquat',
				end: 'kumquat',
				initialPosition: -1,
				isMultiSelecting: false,
				isEnabled: true,
			} );
		} );

		it( 'should set multi selection', () => {
			const original = deepFreeze( { isMultiSelecting: false } );
			const state = blockSelection( original, {
				type: 'MULTI_SELECT',
				start: 'ribs',
				end: 'chicken',
			} );

			expect( state ).toEqual( {
				start: 'ribs',
				end: 'chicken',
				initialPosition: null,
				isMultiSelecting: false,
			} );
		} );

		it( 'should set continuous multi selection', () => {
			const original = deepFreeze( { isMultiSelecting: true } );
			const state = blockSelection( original, {
				type: 'MULTI_SELECT',
				start: 'ribs',
				end: 'chicken',
			} );

			expect( state ).toEqual( {
				start: 'ribs',
				end: 'chicken',
				initialPosition: null,
				isMultiSelecting: true,
			} );
		} );

		it( 'should start multi selection', () => {
			const original = deepFreeze( { start: 'ribs', end: 'ribs', isMultiSelecting: false } );
			const state = blockSelection( original, {
				type: 'START_MULTI_SELECT',
			} );

			expect( state ).toEqual( {
				start: 'ribs',
				end: 'ribs',
				initialPosition: null,
				isMultiSelecting: true,
			} );
		} );

		it( 'should return same reference if already multi-selecting', () => {
			const original = deepFreeze( { start: 'ribs', end: 'ribs', isMultiSelecting: true } );
			const state = blockSelection( original, {
				type: 'START_MULTI_SELECT',
			} );

			expect( state ).toBe( original );
		} );

		it( 'should end multi selection with selection', () => {
			const original = deepFreeze( { start: 'ribs', end: 'chicken', isMultiSelecting: true } );
			const state = blockSelection( original, {
				type: 'STOP_MULTI_SELECT',
			} );

			expect( state ).toEqual( {
				start: 'ribs',
				end: 'chicken',
				initialPosition: null,
				isMultiSelecting: false,
			} );
		} );

		it( 'should return same reference if already ended multi-selecting', () => {
			const original = deepFreeze( { start: 'ribs', end: 'chicken', isMultiSelecting: false } );
			const state = blockSelection( original, {
				type: 'STOP_MULTI_SELECT',
			} );

			expect( state ).toBe( original );
		} );

		it( 'should end multi selection without selection', () => {
			const original = deepFreeze( { start: 'ribs', end: 'ribs', isMultiSelecting: true } );
			const state = blockSelection( original, {
				type: 'STOP_MULTI_SELECT',
			} );

			expect( state ).toEqual( {
				start: 'ribs',
				end: 'ribs',
				initialPosition: null,
				isMultiSelecting: false,
			} );
		} );

		it( 'should not update the state if the block is already selected', () => {
			const original = deepFreeze( { start: 'ribs', end: 'ribs' } );

			const state1 = blockSelection( original, {
				type: 'SELECT_BLOCK',
				clientId: 'ribs',
			} );

			expect( state1 ).toBe( original );
		} );

		it( 'should unset multi selection', () => {
			const original = deepFreeze( { start: 'ribs', end: 'chicken' } );

			const state1 = blockSelection( original, {
				type: 'CLEAR_SELECTED_BLOCK',
			} );

			expect( state1 ).toEqual( {
				start: null,
				end: null,
				initialPosition: null,
				isMultiSelecting: false,
			} );
		} );

		it( 'should return same reference if clearing selection but no selection', () => {
			const original = deepFreeze( { start: null, end: null, isMultiSelecting: false } );

			const state1 = blockSelection( original, {
				type: 'CLEAR_SELECTED_BLOCK',
			} );

			expect( state1 ).toBe( original );
		} );

		it( 'should select inserted block', () => {
			const original = deepFreeze( { start: 'ribs', end: 'chicken' } );

			const state3 = blockSelection( original, {
				type: 'INSERT_BLOCKS',
				blocks: [ {
					clientId: 'ribs',
					name: 'core/freeform',
				} ],
				updateSelection: true,
			} );

			expect( state3 ).toEqual( {
				start: 'ribs',
				end: 'ribs',
				initialPosition: null,
				isMultiSelecting: false,
			} );
		} );

		it( 'should not select inserted block if updateSelection flag is false', () => {
			const original = deepFreeze( { start: 'a', end: 'b' } );

			const state3 = blockSelection( original, {
				type: 'INSERT_BLOCKS',
				blocks: [ {
					clientId: 'ribs',
					name: 'core/freeform',
				} ],
				updateSelection: false,
			} );

			expect( state3 ).toEqual( {
				start: 'a',
				end: 'b',
			} );
		} );

		it( 'should not update the state if the block moved is already selected', () => {
			const original = deepFreeze( { start: 'ribs', end: 'ribs' } );
			const state = blockSelection( original, {
				type: 'MOVE_BLOCKS_UP',
				clientIds: [ 'ribs' ],
			} );

			expect( state ).toBe( original );
		} );

		it( 'should replace the selected block', () => {
			const original = deepFreeze( { start: 'chicken', end: 'chicken' } );
			const state = blockSelection( original, {
				type: 'REPLACE_BLOCKS',
				clientIds: [ 'chicken' ],
				blocks: [ {
					clientId: 'wings',
					name: 'core/freeform',
				} ],
			} );

			expect( state ).toEqual( {
				start: 'wings',
				end: 'wings',
				initialPosition: null,
				isMultiSelecting: false,
			} );
		} );

		it( 'should not replace the selected block if we keep it when replacing blocks', () => {
			const original = deepFreeze( { start: 'chicken', end: 'chicken' } );
			const state = blockSelection( original, {
				type: 'REPLACE_BLOCKS',
				clientIds: [ 'chicken' ],
				blocks: [
					{
						clientId: 'chicken',
						name: 'core/freeform',
					},
					{
						clientId: 'wings',
						name: 'core/freeform',
					} ],
			} );

			expect( state ).toBe( original );
		} );

		it( 'should reset if replacing with empty set', () => {
			const original = deepFreeze( { start: 'chicken', end: 'chicken' } );
			const state = blockSelection( original, {
				type: 'REPLACE_BLOCKS',
				clientIds: [ 'chicken' ],
				blocks: [],
			} );

			expect( state ).toEqual( {
				start: null,
				end: null,
				initialPosition: null,
				isMultiSelecting: false,
			} );
		} );

		it( 'should keep the selected block', () => {
			const original = deepFreeze( { start: 'chicken', end: 'chicken' } );
			const state = blockSelection( original, {
				type: 'REPLACE_BLOCKS',
				clientIds: [ 'ribs' ],
				blocks: [ {
					clientId: 'wings',
					name: 'core/freeform',
				} ],
			} );

			expect( state ).toBe( original );
		} );

		it( 'should remove the selection if we are removing the selected block', () => {
			const original = deepFreeze( {
				start: 'chicken',
				end: 'chicken',
				initialPosition: null,
				isMultiSelecting: false,
			} );
			const state = blockSelection( original, {
				type: 'REMOVE_BLOCKS',
				clientIds: [ 'chicken' ],
			} );

			expect( state ).toEqual( {
				start: null,
				end: null,
				initialPosition: null,
				isMultiSelecting: false,
			} );
		} );

		it( 'should keep the selection if we are not removing the selected block', () => {
			const original = deepFreeze( {
				start: 'chicken',
				end: 'chicken',
				initialPosition: null,
				isMultiSelecting: false,
			} );
			const state = blockSelection( original, {
				type: 'REMOVE_BLOCKS',
				clientIds: [ 'ribs' ],
			} );

			expect( state ).toBe( original );
		} );
	} );

	describe( 'preferences()', () => {
		it( 'should apply all defaults', () => {
			const state = preferences( undefined, {} );

			expect( state ).toEqual( {
				insertUsage: {},
				isPublishSidebarEnabled: true,
			} );
		} );

		it( 'should disable the publish sidebar', () => {
			const original = deepFreeze( preferences( undefined, { } ) );
			const state = preferences( original, {
				type: 'DISABLE_PUBLISH_SIDEBAR',
			} );

			expect( state.isPublishSidebarEnabled ).toBe( false );
		} );

		it( 'should enable the publish sidebar', () => {
			const original = deepFreeze( preferences( { isPublishSidebarEnabled: false }, { } ) );
			const state = preferences( original, {
				type: 'ENABLE_PUBLISH_SIDEBAR',
			} );

			expect( state.isPublishSidebarEnabled ).toBe( true );
		} );

		it( 'should record recently used blocks', () => {
			const state = preferences( deepFreeze( { insertUsage: {} } ), {
				type: 'INSERT_BLOCKS',
				blocks: [ {
					clientId: 'bacon',
					name: 'core-embed/twitter',
				} ],
				time: 123456,
			} );

			expect( state ).toEqual( {
				insertUsage: {
					'core-embed/twitter': {
						time: 123456,
						count: 1,
						insert: { name: 'core-embed/twitter' },
					},
				},
			} );

			const twoRecentBlocks = preferences( deepFreeze( {
				insertUsage: {
					'core-embed/twitter': {
						time: 123456,
						count: 1,
						insert: { name: 'core-embed/twitter' },
					},
				},
			} ), {
				type: 'INSERT_BLOCKS',
				blocks: [ {
					clientId: 'eggs',
					name: 'core-embed/twitter',
				}, {
					clientId: 'bacon',
					name: 'core/block',
					attributes: { ref: 123 },
				} ],
				time: 123457,
			} );

			expect( twoRecentBlocks ).toEqual( {
				insertUsage: {
					'core-embed/twitter': {
						time: 123457,
						count: 2,
						insert: { name: 'core-embed/twitter' },
					},
					'core/block/123': {
						time: 123457,
						count: 1,
						insert: { name: 'core/block', ref: 123 },
					},
				},
			} );
		} );

		it( 'should remove recorded reusable blocks that are deleted', () => {
			const initialState = {
				insertUsage: {
					'core/block/123': {
						time: 1000,
						count: 1,
						insert: { name: 'core/block', ref: 123 },
					},
				},
			};

			const state = preferences( deepFreeze( initialState ), {
				type: 'REMOVE_REUSABLE_BLOCK',
				id: 123,
			} );

			expect( state ).toEqual( {
				insertUsage: {},
			} );
		} );
	} );

	describe( 'saving()', () => {
		it( 'should update when a request is started', () => {
			const state = saving( null, {
				type: 'REQUEST_POST_UPDATE_START',
			} );
			expect( state ).toEqual( {
				requesting: true,
				successful: false,
				error: null,
				options: {},
			} );
		} );

		it( 'should update when a request succeeds', () => {
			const state = saving( null, {
				type: 'REQUEST_POST_UPDATE_SUCCESS',
			} );
			expect( state ).toEqual( {
				requesting: false,
				successful: true,
				error: null,
				options: {},
			} );
		} );

		it( 'should update when a request fails', () => {
			const state = saving( null, {
				type: 'REQUEST_POST_UPDATE_FAILURE',
				error: {
					code: 'pretend_error',
					message: 'update failed',
				},
			} );
			expect( state ).toEqual( {
				requesting: false,
				successful: false,
				error: {
					code: 'pretend_error',
					message: 'update failed',
				},
				options: {},
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
			const value = blocksMode( deepFreeze( { chicken: 'html' } ), action );

			expect( value ).toEqual( { chicken: 'visual' } );
		} );
	} );

	describe( 'reusableBlocks()', () => {
		it( 'should start out empty', () => {
			const state = reusableBlocks( undefined, {} );
			expect( state ).toEqual( {
				data: {},
				isFetching: {},
				isSaving: {},
			} );
		} );

		it( 'should add received reusable blocks', () => {
			const state = reusableBlocks( {}, {
				type: 'RECEIVE_REUSABLE_BLOCKS',
				results: [ {
					reusableBlock: {
						id: 123,
						title: 'My cool block',
					},
					parsedBlock: {
						clientId: 'foo',
					},
				} ],
			} );

			expect( state ).toEqual( {
				data: {
					123: { clientId: 'foo', title: 'My cool block' },
				},
				isFetching: {},
				isSaving: {},
			} );
		} );

		it( 'should update a reusable block', () => {
			const initialState = {
				data: {
					123: { clientId: '', title: '' },
				},
				isFetching: {},
				isSaving: {},
			};

			const state = reusableBlocks( initialState, {
				type: 'UPDATE_REUSABLE_BLOCK_TITLE',
				id: 123,
				title: 'My block',
			} );

			expect( state ).toEqual( {
				data: {
					123: { clientId: '', title: 'My block' },
				},
				isFetching: {},
				isSaving: {},
			} );
		} );

		it( "should update the reusable block's id if it was temporary", () => {
			const initialState = {
				data: {
					reusable1: { clientId: '', title: '' },
				},
				isSaving: {},
			};

			const state = reusableBlocks( initialState, {
				type: 'SAVE_REUSABLE_BLOCK_SUCCESS',
				id: 'reusable1',
				updatedId: 123,
			} );

			expect( state ).toEqual( {
				data: {
					123: { clientId: '', title: '' },
				},
				isFetching: {},
				isSaving: {},
			} );
		} );

		it( 'should remove a reusable block', () => {
			const id = 123;
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
				isFetching: {},
				isSaving: {},
			};

			const state = reusableBlocks( deepFreeze( initialState ), {
				type: 'REMOVE_REUSABLE_BLOCK',
				id,
			} );

			expect( state ).toEqual( {
				data: {},
				isFetching: {},
				isSaving: {},
			} );
		} );

		it( 'should indicate that a reusable block is fetching', () => {
			const id = 123;
			const initialState = {
				data: {},
				isFetching: {},
				isSaving: {},
			};

			const state = reusableBlocks( initialState, {
				type: 'FETCH_REUSABLE_BLOCKS',
				id,
			} );

			expect( state ).toEqual( {
				data: {},
				isFetching: {
					[ id ]: true,
				},
				isSaving: {},
			} );
		} );

		it( 'should stop indicating that a reusable block is saving when the fetch succeeded', () => {
			const id = 123;
			const initialState = {
				data: {
					[ id ]: { id },
				},
				isFetching: {
					[ id ]: true,
				},
				isSaving: {},
			};

			const state = reusableBlocks( initialState, {
				type: 'FETCH_REUSABLE_BLOCKS_SUCCESS',
				id,
				updatedId: id,
			} );

			expect( state ).toEqual( {
				data: {
					[ id ]: { id },
				},
				isFetching: {},
				isSaving: {},
			} );
		} );

		it( 'should stop indicating that a reusable block is fetching when there is an error', () => {
			const id = 123;
			const initialState = {
				data: {},
				isFetching: {
					[ id ]: true,
				},
				isSaving: {},
			};

			const state = reusableBlocks( initialState, {
				type: 'FETCH_REUSABLE_BLOCKS_FAILURE',
				id,
			} );

			expect( state ).toEqual( {
				data: {},
				isFetching: {},
				isSaving: {},
			} );
		} );

		it( 'should indicate that a reusable block is saving', () => {
			const id = 123;
			const initialState = {
				data: {},
				isFetching: {},
				isSaving: {},
			};

			const state = reusableBlocks( initialState, {
				type: 'SAVE_REUSABLE_BLOCK',
				id,
			} );

			expect( state ).toEqual( {
				data: {},
				isFetching: {},
				isSaving: {
					[ id ]: true,
				},
			} );
		} );

		it( 'should stop indicating that a reusable block is saving when the save succeeded', () => {
			const id = 123;
			const initialState = {
				data: {
					[ id ]: { id },
				},
				isFetching: {},
				isSaving: {
					[ id ]: true,
				},
			};

			const state = reusableBlocks( initialState, {
				type: 'SAVE_REUSABLE_BLOCK_SUCCESS',
				id,
				updatedId: id,
			} );

			expect( state ).toEqual( {
				data: {
					[ id ]: { id },
				},
				isFetching: {},
				isSaving: {},
			} );
		} );

		it( 'should stop indicating that a reusable block is saving when there is an error', () => {
			const id = 123;
			const initialState = {
				data: {},
				isFetching: {},
				isSaving: {
					[ id ]: true,
				},
			};

			const state = reusableBlocks( initialState, {
				type: 'SAVE_REUSABLE_BLOCK_FAILURE',
				id,
			} );

			expect( state ).toEqual( {
				data: {},
				isFetching: {},
				isSaving: {},
			} );
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

	describe( 'autosave', () => {
		it( 'returns null by default', () => {
			const state = autosave( undefined, {} );

			expect( state ).toBe( null );
		} );

		it( 'returns subset of received autosave post properties', () => {
			const state = autosave( undefined, {
				type: 'RESET_AUTOSAVE',
				post: {
					title: {
						raw: 'The Title',
					},
					content: {
						raw: 'The Content',
					},
					excerpt: {
						raw: 'The Excerpt',
					},
					status: 'draft',
				},
			} );

			expect( state ).toEqual( {
				title: 'The Title',
				content: 'The Content',
				excerpt: 'The Excerpt',
			} );
		} );
	} );

	describe( 'postSavingLock', () => {
		it( 'returns empty object by default', () => {
			const state = postSavingLock( undefined, {} );

			expect( state ).toEqual( {} );
		} );

		it( 'returns correct post locks when locks added and removed', () => {
			let state = postSavingLock( undefined, {
				type: 'LOCK_POST_SAVING',
				lockName: 'test-lock',
			} );

			expect( state ).toEqual( {
				'test-lock': true,
			} );

			state = postSavingLock( deepFreeze( state ), {
				type: 'LOCK_POST_SAVING',
				lockName: 'test-lock-2',
			} );

			expect( state ).toEqual( {
				'test-lock': true,
				'test-lock-2': true,
			} );

			state = postSavingLock( deepFreeze( state ), {
				type: 'UNLOCK_POST_SAVING',
				lockName: 'test-lock',
			} );

			expect( state ).toEqual( {
				'test-lock-2': true,
			} );

			state = postSavingLock( deepFreeze( state ), {
				type: 'UNLOCK_POST_SAVING',
				lockName: 'test-lock-2',
			} );

			expect( state ).toEqual( {} );
		} );
	} );

	describe( 'previewLink', () => {
		it( 'returns null by default', () => {
			const state = previewLink( undefined, {} );

			expect( state ).toBe( null );
		} );

		it( 'returns preview link from save success', () => {
			const state = previewLink( null, {
				type: 'REQUEST_POST_UPDATE_SUCCESS',
				post: {
					preview_link: 'https://example.com/?p=2611&preview=true',
				},
			} );

			expect( state ).toBe( 'https://example.com/?p=2611&preview=true' );
		} );

		it( 'returns post link with query arg from save success if no preview link', () => {
			const state = previewLink( null, {
				type: 'REQUEST_POST_UPDATE_SUCCESS',
				post: {
					link: 'https://example.com/sample-post/',
				},
			} );

			expect( state ).toBe( 'https://example.com/sample-post/?preview=true' );
		} );

		it( 'returns same state if save success without preview link or post link', () => {
			// Bug: This can occur for post types which are defined as
			// `publicly_queryable => false` (non-viewable).
			//
			// See: https://github.com/WordPress/gutenberg/issues/12677
			const state = previewLink( null, {
				type: 'REQUEST_POST_UPDATE_SUCCESS',
				post: {
					preview_link: '',
				},
			} );

			expect( state ).toBe( null );
		} );

		it( 'returns resets on preview start', () => {
			const state = previewLink( 'https://example.com/sample-post/', {
				type: 'REQUEST_POST_UPDATE_START',
				options: {
					isPreview: true,
				},
			} );

			expect( state ).toBe( null );
		} );

		it( 'returns state on non-preview save start', () => {
			const state = previewLink( 'https://example.com/sample-post/', {
				type: 'REQUEST_POST_UPDATE_START',
				options: {},
			} );

			expect( state ).toBe( 'https://example.com/sample-post/' );
		} );
	} );
} );
