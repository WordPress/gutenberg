/**
 * External dependencies
 */
import { noop } from 'lodash';

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
import effects, { validateBlocksToTemplate } from '../effects';
import * as selectors from '../selectors';
import reducer from '../reducer';
import applyMiddlewares from '../middlewares';
import '../../';

describe( 'effects', () => {
	const defaultBlockSettings = {
		attributes: {
			content: {},
		},
		save: () => 'Saved',
		category: 'common',
		title: 'block title',
	};

	describe( '.MERGE_BLOCKS', () => {
		const handler = effects.MERGE_BLOCKS;
		const defaultGetBlock = selectors.getBlock;

		afterEach( () => {
			getBlockTypes().forEach( ( block ) => {
				unregisterBlockType( block.name );
			} );
			selectors.getBlock = defaultGetBlock;
		} );

		it( 'should only focus the blockA if the blockA has no merge function', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );
			const blockA = {
				clientId: 'chicken',
				name: 'core/test-block',
			};
			const blockB = {
				clientId: 'ribs',
				name: 'core/test-block',
			};
			selectors.getBlock = ( state, clientId ) => {
				return blockA.clientId === clientId ? blockA : blockB;
			};

			const dispatch = jest.fn();
			const getState = () => ( {} );
			handler( mergeBlocks( blockA.clientId, blockB.clientId ), { dispatch, getState } );

			expect( dispatch ).toHaveBeenCalledTimes( 1 );
			expect( dispatch ).toHaveBeenCalledWith( selectBlock( 'chicken' ) );
		} );

		it( 'should merge the blocks if blocks of the same type', () => {
			registerBlockType( 'core/test-block', {
				attributes: {
					content: {},
				},
				merge( attributes, attributesToMerge ) {
					return {
						content: attributes.content + ' ' + attributesToMerge.content,
					};
				},
				save: noop,
				category: 'common',
				title: 'test block',
			} );
			const blockA = {
				clientId: 'chicken',
				name: 'core/test-block',
				attributes: { content: 'chicken' },
			};
			const blockB = {
				clientId: 'ribs',
				name: 'core/test-block',
				attributes: { content: 'ribs' },
			};
			selectors.getBlock = ( state, clientId ) => {
				return blockA.clientId === clientId ? blockA : blockB;
			};
			const dispatch = jest.fn();
			const getState = () => ( {
				blockSelection: {
					start: {
						block: blockB.clientId,
						identifier: 'content',
						offset: 0,
					},
				},
			} );
			handler( mergeBlocks( blockA.clientId, blockB.clientId ), { dispatch, getState } );

			expect( dispatch ).toHaveBeenCalledTimes( 2 );
			expect( dispatch ).toHaveBeenCalledWith( selectionChange(
				blockA.clientId,
				'content',
				'chicken'.length + 1,
				'chicken'.length + 1,
			) );
			const lastCall = dispatch.mock.calls[ 1 ];
			expect( lastCall ).toHaveLength( 1 );
			const [ lastCallArgument ] = lastCall;
			const expectedGenerator = replaceBlocks( [ 'chicken', 'ribs' ], [ {
				clientId: 'chicken',
				name: 'core/test-block',
				attributes: { content: 'chicken ribs' },
			} ] );
			expect(
				Array.from( lastCallArgument )
			).toEqual(
				Array.from( expectedGenerator )
			);
		} );

		it( 'should not merge the blocks have different types without transformation', () => {
			registerBlockType( 'core/test-block', {
				attributes: {
					content: {},
				},
				merge( attributes, attributesToMerge ) {
					return {
						content: attributes.content + ' ' + attributesToMerge.content,
					};
				},
				save: noop,
				category: 'common',
				title: 'test block',
			} );
			registerBlockType( 'core/test-block-2', defaultBlockSettings );
			const blockA = {
				clientId: 'chicken',
				name: 'core/test-block',
				attributes: { content: 'chicken' },
			};
			const blockB = {
				clientId: 'ribs',
				name: 'core/test-block-2',
				attributes: { content: 'ribs' },
			};
			selectors.getBlock = ( state, clientId ) => {
				return blockA.clientId === clientId ? blockA : blockB;
			};
			const dispatch = jest.fn();
			const getState = () => ( {
				blockSelection: {
					start: {
						block: blockB.clientId,
						identifier: 'content',
						offset: 0,
					},
				},
			} );
			handler( mergeBlocks( blockA.clientId, blockB.clientId ), { dispatch, getState } );

			expect( dispatch ).not.toHaveBeenCalled();
		} );

		it( 'should transform and merge the blocks', () => {
			registerBlockType( 'core/test-block', {
				attributes: {
					content: {
						type: 'string',
					},
				},
				merge( attributes, attributesToMerge ) {
					return {
						content: attributes.content + ' ' + attributesToMerge.content,
					};
				},
				save: noop,
				category: 'common',
				title: 'test block',
			} );
			registerBlockType( 'core/test-block-2', {
				attributes: {
					content2: {
						type: 'string',
					},
				},
				transforms: {
					to: [ {
						type: 'block',
						blocks: [ 'core/test-block' ],
						transform: ( { content2 } ) => {
							return createBlock( 'core/test-block', {
								content: content2,
							} );
						},
					} ],
				},
				save: noop,
				category: 'common',
				title: 'test block 2',
			} );
			const blockA = {
				clientId: 'chicken',
				name: 'core/test-block',
				attributes: { content: 'chicken' },
			};
			const blockB = {
				clientId: 'ribs',
				name: 'core/test-block-2',
				attributes: { content2: 'ribs' },
			};
			selectors.getBlock = ( state, clientId ) => {
				return blockA.clientId === clientId ? blockA : blockB;
			};
			const dispatch = jest.fn();
			const getState = () => ( {
				blockSelection: {
					start: {
						block: blockB.clientId,
						identifier: 'content2',
						offset: 0,
					},
				},
			} );
			handler( mergeBlocks( blockA.clientId, blockB.clientId ), { dispatch, getState } );

			expect( dispatch ).toHaveBeenCalledTimes( 2 );
			expect( dispatch ).toHaveBeenCalledWith( selectionChange(
				blockA.clientId,
				'content',
				'chicken'.length + 1,
				'chicken'.length + 1,
			) );
			const expectedGenerator = replaceBlocks( [ 'chicken', 'ribs' ], [ {
				clientId: 'chicken',
				name: 'core/test-block',
				attributes: { content: 'chicken ribs' },
			} ] );
			const lastCall = dispatch.mock.calls[ 1 ];
			expect( lastCall ).toHaveLength( 1 );
			const [ lastCallArgument ] = lastCall;
			expect(
				Array.from( lastCallArgument )
			).toEqual(
				Array.from( expectedGenerator )
			);
		} );
	} );

	describe( 'validateBlocksToTemplate', () => {
		let store;
		beforeEach( () => {
			store = createRegistry().registerStore( 'test', {
				actions,
				selectors,
				reducer,
			} );
			applyMiddlewares( store );

			registerBlockType( 'core/test-block', defaultBlockSettings );
		} );

		afterEach( () => {
			getBlockTypes().forEach( ( block ) => {
				unregisterBlockType( block.name );
			} );
		} );

		it( 'should return undefined if no template assigned', () => {
			const result = validateBlocksToTemplate( resetBlocks( [
				createBlock( 'core/test-block' ),
			] ), store );

			expect( result ).toBe( undefined );
		} );

		it( 'should return undefined if invalid but unlocked', () => {
			store.dispatch( updateSettings( {
				template: [
					[ 'core/foo', {} ],
				],
			} ) );

			const result = validateBlocksToTemplate( resetBlocks( [
				createBlock( 'core/test-block' ),
			] ), store );

			expect( result ).toBe( undefined );
		} );

		it( 'should return undefined if locked and valid', () => {
			store.dispatch( updateSettings( {
				template: [
					[ 'core/test-block' ],
				],
				templateLock: 'all',
			} ) );

			const result = validateBlocksToTemplate( resetBlocks( [
				createBlock( 'core/test-block' ),
			] ), store );

			expect( result ).toBe( undefined );
		} );

		it( 'should return validity set action if invalid on default state', () => {
			store.dispatch( updateSettings( {
				template: [
					[ 'core/foo' ],
				],
				templateLock: 'all',
			} ) );

			const result = validateBlocksToTemplate( resetBlocks( [
				createBlock( 'core/test-block' ),
			] ), store );

			expect( result ).toEqual( setTemplateValidity( false ) );
		} );
	} );
} );
