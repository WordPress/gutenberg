/**
 * External dependencies
 */
import { noop } from 'lodash';
import deepFreeze from 'deep-freeze';

/**
 * WordPress dependencies
 */
import {
	getBlockTypes,
	unregisterBlockType,
	registerBlockType,
	createBlock,
} from '@wordpress/blocks';
import { createRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
import actions, {
	updateSettings,
	mergeBlocks,
	replaceBlocks,
	resetBlocks,
	selectBlock,
	selectionChange,
	setTemplateValidity,
} from '../actions';
import * as selectors from '../selectors';
import reducer from '../reducer';
import '../../';

describe( 'effects', () => {
	const defaultBlockSettings = {
		attributes: {
			content: {},
		},
		save: () => 'Saved',
		category: 'text',
		title: 'block title',
	};

	describe( '.MERGE_BLOCKS', () => {
		afterEach( () => {
			getBlockTypes().forEach( ( block ) => {
				unregisterBlockType( block.name );
			} );
		} );

		it( 'should only focus the blockA if the blockA has no merge function', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );
			const blockA = deepFreeze( {
				clientId: 'chicken',
				name: 'core/test-block',
			} );
			const blockB = deepFreeze( {
				clientId: 'ribs',
				name: 'core/test-block',
			} );

			const fulfillment = mergeBlocks( blockA.clientId, blockB.clientId );
			expect( fulfillment.next() ).toEqual( {
				done: false,
				value: {
					type: 'MERGE_BLOCKS',
					blocks: [ blockA.clientId, blockB.clientId ],
				},
			} );
			fulfillment.next();
			expect( fulfillment.next( blockA ) ).toEqual( {
				done: false,
				value: selectBlock( 'chicken' ),
			} );
			expect( fulfillment.next( blockA ).done ).toEqual( true );
		} );

		it( 'should merge the blocks if blocks of the same type', () => {
			registerBlockType( 'core/test-block', {
				attributes: {
					content: {},
				},
				merge( attributes, attributesToMerge ) {
					return {
						content:
							attributes.content +
							' ' +
							attributesToMerge.content,
					};
				},
				save: noop,
				category: 'text',
				title: 'test block',
			} );
			const blockA = deepFreeze( {
				clientId: 'chicken',
				name: 'core/test-block',
				attributes: { content: 'chicken' },
				innerBlocks: [],
			} );
			const blockB = deepFreeze( {
				clientId: 'ribs',
				name: 'core/test-block',
				attributes: { content: 'ribs' },
				innerBlocks: [],
			} );

			const fulfillment = mergeBlocks( blockA.clientId, blockB.clientId );
			// MERGE_BLOCKS
			fulfillment.next();
			// getBlock A
			fulfillment.next();
			fulfillment.next( blockA );
			// getBlock B
			fulfillment.next( blockB );
			// getSelectionStart
			fulfillment.next( {
				clientId: blockB.clientId,
				attributeKey: 'content',
				offset: 0,
			} );
			// selectionChange
			fulfillment.next(
				selectionChange(
					blockA.clientId,
					'content',
					'chicken'.length + 1,
					'chicken'.length + 1
				)
			);
			fulfillment.next();
			fulfillment.next();
			expect( fulfillment.next( blockA ).value ).toMatchObject( {
				type: 'REPLACE_BLOCKS',
				clientIds: [ 'chicken', 'ribs' ],
				blocks: [
					{
						clientId: 'chicken',
						name: 'core/test-block',
						attributes: { content: 'chicken ribs' },
					},
				],
			} );
		} );

		it( 'should not merge the blocks have different types without transformation', () => {
			registerBlockType( 'core/test-block', {
				attributes: {
					content: {},
				},
				merge( attributes, attributesToMerge ) {
					return {
						content:
							attributes.content +
							' ' +
							attributesToMerge.content,
					};
				},
				save: noop,
				category: 'text',
				title: 'test block',
			} );
			registerBlockType( 'core/test-block-2', defaultBlockSettings );
			const blockA = deepFreeze( {
				clientId: 'chicken',
				name: 'core/test-block',
				attributes: { content: 'chicken' },
				innerBlocks: [],
			} );
			const blockB = deepFreeze( {
				clientId: 'ribs',
				name: 'core/test-block-2',
				attributes: { content: 'ribs' },
				innerBlocks: [],
			} );

			const fulfillment = mergeBlocks( blockA.clientId, blockB.clientId );
			// MERGE_BLOCKS
			fulfillment.next();
			// getBlock A
			fulfillment.next();
			fulfillment.next( blockA );
			// getBlock B
			expect( fulfillment.next( blockB ).value ).toEqual( {} );
			// getSelectionStart
			fulfillment.next( {
				clientId: blockB.clientId,
				attributeKey: 'content',
				offset: 0,
			} );
			// Don't do anything else
			expect( fulfillment.next().done ).toBe( true );
		} );

		// it( 'should transform and merge the blocks', () => {
		// 	registerBlockType( 'core/test-block', {
		// 		attributes: {
		// 			content: {
		// 				type: 'string',
		// 			},
		// 		},
		// 		merge( attributes, attributesToMerge ) {
		// 			return {
		// 				content:
		// 					attributes.content +
		// 					' ' +
		// 					attributesToMerge.content,
		// 			};
		// 		},
		// 		save: noop,
		// 		category: 'text',
		// 		title: 'test block',
		// 	} );
		// 	registerBlockType( 'core/test-block-2', {
		// 		attributes: {
		// 			content2: {
		// 				type: 'string',
		// 			},
		// 		},
		// 		transforms: {
		// 			to: [
		// 				{
		// 					type: 'block',
		// 					blocks: [ 'core/test-block' ],
		// 					transform: ( { content2 } ) => {
		// 						return createBlock( 'core/test-block', {
		// 							content: content2,
		// 						} );
		// 					},
		// 				},
		// 			],
		// 		},
		// 		save: noop,
		// 		category: 'text',
		// 		title: 'test block 2',
		// 	} );
		// 	const blockA = deepFreeze( {
		// 		clientId: 'chicken',
		// 		name: 'core/test-block',
		// 		attributes: { content: 'chicken' },
		// 		innerBlocks: [],
		// 	} );
		// 	const blockB = deepFreeze( {
		// 		clientId: 'ribs',
		// 		name: 'core/test-block-2',
		// 		attributes: { content2: 'ribs' },
		// 		innerBlocks: [],
		// 	} );
		// 	selectors.getBlock = ( state, clientId ) => {
		// 		return blockA.clientId === clientId ? blockA : blockB;
		// 	};
		// 	const dispatch = jest.fn();
		// 	const getState = () => ( {
		// 		selectionStart: {
		// 			clientId: blockB.clientId,
		// 			attributeKey: 'content2',
		// 			offset: 0,
		// 		},
		// 	} );
		// 	handler( mergeBlocks( blockA.clientId, blockB.clientId ), {
		// 		dispatch,
		// 		getState,
		// 	} );
		//
		// 	expect( dispatch ).toHaveBeenCalledTimes( 2 );
		// 	expect( dispatch ).toHaveBeenCalledWith(
		// 		selectionChange(
		// 			blockA.clientId,
		// 			'content',
		// 			'chicken'.length + 1,
		// 			'chicken'.length + 1
		// 		)
		// 	);
		// 	const expectedGenerator = replaceBlocks(
		// 		[ 'chicken', 'ribs' ],
		// 		[
		// 			{
		// 				clientId: 'chicken',
		// 				name: 'core/test-block',
		// 				attributes: { content: 'chicken ribs' },
		// 			},
		// 		]
		// 	);
		// 	const lastCall = dispatch.mock.calls[ 1 ];
		// 	expect( lastCall ).toHaveLength( 1 );
		// 	const [ lastCallArgument ] = lastCall;
		// 	expect( Array.from( lastCallArgument ) ).toEqual(
		// 		Array.from( expectedGenerator )
		// 	);
		// } );
	} );
	//
	// describe( 'validateBlocksToTemplate', () => {
	// 	let store;
	// 	beforeEach( () => {
	// 		store = createRegistry().registerStore( 'test', {
	// 			actions,
	// 			selectors,
	// 			reducer,
	// 		} );
	//
	// 		registerBlockType( 'core/test-block', defaultBlockSettings );
	// 	} );
	//
	// 	afterEach( () => {
	// 		getBlockTypes().forEach( ( block ) => {
	// 			unregisterBlockType( block.name );
	// 		} );
	// 	} );
	//
	// 	it( 'should return undefined if no template assigned', () => {
	// 		const result = validateBlocksToTemplate(
	// 			resetBlocks( [ createBlock( 'core/test-block' ) ] ),
	// 			store
	// 		);
	//
	// 		expect( result ).toBe( undefined );
	// 	} );
	//
	// 	it( 'should return undefined if invalid but unlocked', () => {
	// 		store.dispatch(
	// 			updateSettings( {
	// 				template: [ [ 'core/foo', {} ] ],
	// 			} )
	// 		);
	//
	// 		const result = validateBlocksToTemplate(
	// 			resetBlocks( [ createBlock( 'core/test-block' ) ] ),
	// 			store
	// 		);
	//
	// 		expect( result ).toBe( undefined );
	// 	} );
	//
	// 	it( 'should return undefined if locked and valid', () => {
	// 		store.dispatch(
	// 			updateSettings( {
	// 				template: [ [ 'core/test-block' ] ],
	// 				templateLock: 'all',
	// 			} )
	// 		);
	//
	// 		const result = validateBlocksToTemplate(
	// 			resetBlocks( [ createBlock( 'core/test-block' ) ] ),
	// 			store
	// 		);
	//
	// 		expect( result ).toBe( undefined );
	// 	} );
	//
	// 	it( 'should return validity set action if invalid on default state', () => {
	// 		store.dispatch(
	// 			updateSettings( {
	// 				template: [ [ 'core/foo' ] ],
	// 				templateLock: 'all',
	// 			} )
	// 		);
	//
	// 		const result = validateBlocksToTemplate(
	// 			resetBlocks( [ createBlock( 'core/test-block' ) ] ),
	// 			store
	// 		);
	//
	// 		expect( result ).toEqual( setTemplateValidity( false ) );
	// 	} );
	// } );
} );
