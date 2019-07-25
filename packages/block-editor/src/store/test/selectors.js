/**
 * External dependencies
 */
import { filter } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	registerBlockType,
	unregisterBlockType,
	setFreeformContentHandlerName,
} from '@wordpress/blocks';
import { RawHTML } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as selectors from '../selectors';

const {
	getBlockName,
	getBlock,
	getBlocks,
	getBlockCount,
	getClientIdsWithDescendants,
	getClientIdsOfDescendants,
	hasSelectedBlock,
	getSelectedBlock,
	getSelectedBlockClientId,
	getBlockRootClientId,
	getBlockHierarchyRootClientId,
	getGlobalBlockCount,
	getSelectedBlockClientIds,
	getMultiSelectedBlockClientIds,
	getMultiSelectedBlocks,
	getMultiSelectedBlocksStartClientId,
	getMultiSelectedBlocksEndClientId,
	getBlockOrder,
	getBlockIndex,
	getPreviousBlockClientId,
	getNextBlockClientId,
	isBlockSelected,
	hasSelectedInnerBlock,
	isBlockWithinSelection,
	hasMultiSelection,
	isBlockMultiSelected,
	isFirstMultiSelectedBlock,
	getBlockMode,
	isTyping,
	isCaretWithinFormattedText,
	getBlockInsertionPoint,
	isBlockInsertionPointVisible,
	isSelectionEnabled,
	canInsertBlockType,
	getInserterItems,
	isValidTemplate,
	getTemplate,
	getTemplateLock,
	getBlockListSettings,
	__experimentalGetLastBlockAttributeChanges,
	INSERTER_UTILITY_HIGH,
	INSERTER_UTILITY_MEDIUM,
	INSERTER_UTILITY_LOW,
} = selectors;

describe( 'selectors', () => {
	let cachedSelectors;

	beforeAll( () => {
		cachedSelectors = filter( selectors, ( selector ) => selector.clear );
	} );

	beforeEach( () => {
		registerBlockType( 'core/block', {
			save: () => null,
			category: 'reusable',
			title: 'Reusable Block Stub',
			supports: {
				inserter: false,
			},
		} );

		registerBlockType( 'core/test-block-a', {
			save: ( props ) => props.attributes.text,
			category: 'formatting',
			title: 'Test Block A',
			icon: 'test',
			keywords: [ 'testing' ],
		} );

		registerBlockType( 'core/test-block-b', {
			save: ( props ) => props.attributes.text,
			category: 'common',
			title: 'Test Block B',
			icon: 'test',
			keywords: [ 'testing' ],
			supports: {
				multiple: false,
			},
		} );

		registerBlockType( 'core/test-block-c', {
			save: ( props ) => props.attributes.text,
			category: 'common',
			title: 'Test Block C',
			icon: 'test',
			keywords: [ 'testing' ],
			parent: [ 'core/test-block-b' ],
		} );

		registerBlockType( 'core/test-freeform', {
			save: ( props ) => <RawHTML>{ props.attributes.content }</RawHTML>,
			category: 'common',
			title: 'Test Freeform Content Handler',
			icon: 'test',
			attributes: {
				content: {
					type: 'string',
				},
			},
		} );

		setFreeformContentHandlerName( 'core/test-freeform' );

		cachedSelectors.forEach( ( { clear } ) => clear() );
	} );

	afterEach( () => {
		unregisterBlockType( 'core/block' );
		unregisterBlockType( 'core/test-block-a' );
		unregisterBlockType( 'core/test-block-b' );
		unregisterBlockType( 'core/test-block-c' );
		unregisterBlockType( 'core/test-freeform' );

		setFreeformContentHandlerName( undefined );
	} );

	describe( 'getBlockName', () => {
		it( 'returns null if no block by clientId', () => {
			const state = {
				blocks: {
					byClientId: {},
					attributes: {},
					order: {},
					parents: {},
				},
			};

			const name = getBlockName( state, 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1' );

			expect( name ).toBe( null );
		} );

		it( 'returns block name', () => {
			const state = {
				blocks: {
					byClientId: {
						'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1': {
							clientId: 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1',
							name: 'core/paragraph',
						},
					},
					attributes: {
						'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1': {},
					},
					order: {
						'': [ 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1' ],
						'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1': [],
					},
					parents: {
						'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1': '',
					},
				},
			};

			const name = getBlockName( state, 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1' );

			expect( name ).toBe( 'core/paragraph' );
		} );
	} );

	describe( 'getBlock', () => {
		it( 'should return the block', () => {
			const state = {
				blocks: {
					byClientId: {
						123: { clientId: 123, name: 'core/paragraph' },
					},
					attributes: {
						123: {},
					},
					order: {
						'': [ 123 ],
						123: [],
					},
					parents: {
						123: '',
					},
					cache: {
						123: {},
					},
				},
			};

			expect( getBlock( state, 123 ) ).toEqual( {
				clientId: 123,
				name: 'core/paragraph',
				attributes: {},
				innerBlocks: [],
			} );
		} );

		it( 'should return null if the block is not present in state', () => {
			const state = {
				blocks: {
					byClientId: {},
					attributes: {},
					order: {},
					parents: {},
					cache: {},
				},
			};

			expect( getBlock( state, 123 ) ).toBe( null );
		} );

		it( 'should include inner blocks', () => {
			const state = {
				blocks: {
					byClientId: {
						123: { clientId: 123, name: 'core/paragraph' },
						456: { clientId: 456, name: 'core/paragraph' },
					},
					attributes: {
						123: {},
						456: {},
					},
					order: {
						'': [ 123 ],
						123: [ 456 ],
						456: [],
					},
					parents: {
						123: '',
						456: 123,
					},
					cache: {
						123: {},
						456: {},
					},
				},
			};

			expect( getBlock( state, 123 ) ).toEqual( {
				clientId: 123,
				name: 'core/paragraph',
				attributes: {},
				innerBlocks: [ {
					clientId: 456,
					name: 'core/paragraph',
					attributes: {},
					innerBlocks: [],
				} ],
			} );
		} );
	} );

	describe( 'getBlocks', () => {
		it( 'should return the ordered blocks', () => {
			const state = {
				blocks: {
					byClientId: {
						23: { clientId: 23, name: 'core/heading' },
						123: { clientId: 123, name: 'core/paragraph' },
					},
					attributes: {
						23: {},
						123: {},
					},
					order: {
						'': [ 123, 23 ],
					},
					parents: {
						123: '',
						23: '',
					},
					cache: {
						123: {},
						23: {},
					},
				},
			};

			expect( getBlocks( state ) ).toEqual( [
				{ clientId: 123, name: 'core/paragraph', attributes: {}, innerBlocks: [] },
				{ clientId: 23, name: 'core/heading', attributes: {}, innerBlocks: [] },
			] );
		} );
	} );

	describe( 'getClientIdsOfDescendants', () => {
		it( 'should return the ids of any descendants, given an array of clientIds', () => {
			const state = {
				blocks: {
					byClientId: {
						'uuid-2': { clientId: 'uuid-2', name: 'core/image' },
						'uuid-4': { clientId: 'uuid-4', name: 'core/paragraph' },
						'uuid-6': { clientId: 'uuid-6', name: 'core/paragraph' },
						'uuid-8': { clientId: 'uuid-8', name: 'core/block' },
						'uuid-10': { clientId: 'uuid-10', name: 'core/columns' },
						'uuid-12': { clientId: 'uuid-12', name: 'core/column' },
						'uuid-14': { clientId: 'uuid-14', name: 'core/column' },
						'uuid-16': { clientId: 'uuid-16', name: 'core/quote' },
						'uuid-18': { clientId: 'uuid-18', name: 'core/block' },
						'uuid-20': { clientId: 'uuid-20', name: 'core/gallery' },
						'uuid-22': { clientId: 'uuid-22', name: 'core/block' },
						'uuid-24': { clientId: 'uuid-24', name: 'core/columns' },
						'uuid-26': { clientId: 'uuid-26', name: 'core/column' },
						'uuid-28': { clientId: 'uuid-28', name: 'core/column' },
						'uuid-30': { clientId: 'uuid-30', name: 'core/paragraph' },
					},
					attributes: {
						'uuid-2': {},
						'uuid-4': {},
						'uuid-6': {},
						'uuid-8': {},
						'uuid-10': {},
						'uuid-12': {},
						'uuid-14': {},
						'uuid-16': {},
						'uuid-18': {},
						'uuid-20': {},
						'uuid-22': {},
						'uuid-24': {},
						'uuid-26': {},
						'uuid-28': {},
						'uuid-30': {},
					},
					order: {
						'': [ 'uuid-6', 'uuid-8', 'uuid-10', 'uuid-22' ],
						'uuid-2': [ ],
						'uuid-4': [ ],
						'uuid-6': [ ],
						'uuid-8': [ ],
						'uuid-10': [ 'uuid-12', 'uuid-14' ],
						'uuid-12': [ 'uuid-16' ],
						'uuid-14': [ 'uuid-18' ],
						'uuid-16': [ ],
						'uuid-18': [ 'uuid-24' ],
						'uuid-20': [ ],
						'uuid-22': [ ],
						'uuid-24': [ 'uuid-26', 'uuid-28' ],
						'uuid-26': [ ],
						'uuid-28': [ 'uuid-30' ],
					},
					parents: {
						'uuid-6': '',
						'uuid-8': '',
						'uuid-10': '',
						'uuid-22': '',
						'uuid-12': 'uuid-10',
						'uuid-14': 'uuid-10',
						'uuid-16': 'uuid-12',
						'uuid-18': 'uuid-14',
						'uuid-24': 'uuid-18',
						'uuid-26': 'uuid-24',
						'uuid-28': 'uuid-24',
						'uuid-30': 'uuid-28',
					},
				},
			};
			expect( getClientIdsOfDescendants( state, [ 'uuid-10' ] ) ).toEqual( [
				'uuid-12',
				'uuid-14',
				'uuid-16',
				'uuid-18',
				'uuid-24',
				'uuid-26',
				'uuid-28',
				'uuid-30',
			] );
		} );
	} );

	describe( 'getClientIdsWithDescendants', () => {
		it( 'should return the ids for top-level blocks and their descendants of any depth (for nested blocks).', () => {
			const state = {
				blocks: {
					byClientId: {
						'uuid-2': { clientId: 'uuid-2', name: 'core/image' },
						'uuid-4': { clientId: 'uuid-4', name: 'core/paragraph' },
						'uuid-6': { clientId: 'uuid-6', name: 'core/paragraph' },
						'uuid-8': { clientId: 'uuid-8', name: 'core/block' },
						'uuid-10': { clientId: 'uuid-10', name: 'core/columns' },
						'uuid-12': { clientId: 'uuid-12', name: 'core/column' },
						'uuid-14': { clientId: 'uuid-14', name: 'core/column' },
						'uuid-16': { clientId: 'uuid-16', name: 'core/quote' },
						'uuid-18': { clientId: 'uuid-18', name: 'core/block' },
						'uuid-20': { clientId: 'uuid-20', name: 'core/gallery' },
						'uuid-22': { clientId: 'uuid-22', name: 'core/block' },
						'uuid-24': { clientId: 'uuid-24', name: 'core/columns' },
						'uuid-26': { clientId: 'uuid-26', name: 'core/column' },
						'uuid-28': { clientId: 'uuid-28', name: 'core/column' },
						'uuid-30': { clientId: 'uuid-30', name: 'core/paragraph' },
					},
					attributes: {
						'uuid-2': {},
						'uuid-4': {},
						'uuid-6': {},
						'uuid-8': {},
						'uuid-10': {},
						'uuid-12': {},
						'uuid-14': {},
						'uuid-16': {},
						'uuid-18': {},
						'uuid-20': {},
						'uuid-22': {},
						'uuid-24': {},
						'uuid-26': {},
						'uuid-28': {},
						'uuid-30': {},
					},
					order: {
						'': [ 'uuid-6', 'uuid-8', 'uuid-10', 'uuid-22' ],
						'uuid-2': [ ],
						'uuid-4': [ ],
						'uuid-6': [ ],
						'uuid-8': [ ],
						'uuid-10': [ 'uuid-12', 'uuid-14' ],
						'uuid-12': [ 'uuid-16' ],
						'uuid-14': [ 'uuid-18' ],
						'uuid-16': [ ],
						'uuid-18': [ 'uuid-24' ],
						'uuid-20': [ ],
						'uuid-22': [ ],
						'uuid-24': [ 'uuid-26', 'uuid-28' ],
						'uuid-26': [ ],
						'uuid-28': [ 'uuid-30' ],
					},
					parents: {
						'uuid-6': '',
						'uuid-8': '',
						'uuid-10': '',
						'uuid-22': '',
						'uuid-12': 'uuid-10',
						'uuid-14': 'uuid-10',
						'uuid-16': 'uuid-12',
						'uuid-18': 'uuid-14',
						'uuid-24': 'uuid-18',
						'uuid-26': 'uuid-24',
						'uuid-28': 'uuid-24',
						'uuid-30': 'uuid-28',
					},
				},
			};
			expect( getClientIdsWithDescendants( state ) ).toEqual( [
				'uuid-6',
				'uuid-8',
				'uuid-10',
				'uuid-22',
				'uuid-12',
				'uuid-14',
				'uuid-16',
				'uuid-18',
				'uuid-24',
				'uuid-26',
				'uuid-28',
				'uuid-30',
			] );
		} );
	} );

	describe( 'getBlockCount', () => {
		it( 'should return the number of top-level blocks in the post', () => {
			const state = {
				blocks: {
					byClientId: {
						23: { clientId: 23, name: 'core/heading' },
						123: { clientId: 123, name: 'core/paragraph' },
					},
					attributes: {
						23: {},
						123: {},
					},
					order: {
						'': [ 123, 23 ],
					},
				},
			};

			expect( getBlockCount( state ) ).toBe( 2 );
		} );

		it( 'should return the number of blocks in a nested context', () => {
			const state = {
				blocks: {
					byClientId: {
						123: { clientId: 123, name: 'core/columns' },
						456: { clientId: 456, name: 'core/paragraph' },
						789: { clientId: 789, name: 'core/paragraph' },
					},
					attributes: {
						123: {},
						456: {},
						789: {},
					},
					order: {
						'': [ 123 ],
						123: [ 456, 789 ],
					},
					parents: {
						123: '',
						456: 123,
						789: 123,
					},
				},
			};

			expect( getBlockCount( state, '123' ) ).toBe( 2 );
		} );
	} );

	describe( 'hasSelectedBlock', () => {
		it( 'should return false if no selection', () => {
			const state = {
				blockSelection: {
					start: {},
					end: {},
				},
			};

			expect( hasSelectedBlock( state ) ).toBe( false );
		} );

		it( 'should return false if multi-selection', () => {
			const state = {
				blockSelection: {
					start: { clientId: 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1' },
					end: { clientId: '9db792c6-a25a-495d-adbd-97d56a4c4189' },
				},
			};

			expect( hasSelectedBlock( state ) ).toBe( false );
		} );

		it( 'should return true if singular selection', () => {
			const state = {
				blockSelection: {
					start: { clientId: 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1' },
					end: { clientId: 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1' },
				},
			};

			expect( hasSelectedBlock( state ) ).toBe( true );
		} );
	} );

	describe( 'getGlobalBlockCount', () => {
		const state = {
			blocks: {
				byClientId: {
					123: { clientId: 123, name: 'core/heading' },
					456: { clientId: 456, name: 'core/paragraph' },
					789: { clientId: 789, name: 'core/paragraph' },
				},
				attributes: {
					123: {},
					456: {},
					789: {},
				},
				order: {
					'': [ 123, 456 ],
				},
				parents: {
					123: '',
					456: '',
				},
			},
		};

		it( 'should return the global number of blocks in the post', () => {
			expect( getGlobalBlockCount( state ) ).toBe( 2 );
		} );

		it( 'should return the global number of blocks in the post of a given type', () => {
			expect( getGlobalBlockCount( state, 'core/paragraph' ) ).toBe( 1 );
		} );

		it( 'should return 0 if no blocks exist', () => {
			const emptyState = {
				blocks: {
					byClientId: {},
					attributes: {},
					order: {},
					parents: {},
				},
			};
			expect( getGlobalBlockCount( emptyState ) ).toBe( 0 );
			expect( getGlobalBlockCount( emptyState, 'core/heading' ) ).toBe( 0 );
		} );
	} );

	describe( 'getSelectedBlockClientId', () => {
		it( 'should return null if no block is selected', () => {
			const state = {
				blockSelection: { start: {}, end: {} },
			};

			expect( getSelectedBlockClientId( state ) ).toBe( null );
		} );

		it( 'should return null if there is multi selection', () => {
			const state = {
				blockSelection: { start: { clientId: 23 }, end: { clientId: 123 } },
			};

			expect( getSelectedBlockClientId( state ) ).toBe( null );
		} );

		it( 'should return the selected block ClientId', () => {
			const state = {
				blocks: {
					byClientId: {
						23: {
							name: 'fake block',
						},
					},
				},
				blockSelection: { start: { clientId: 23 }, end: { clientId: 23 } },
			};

			expect( getSelectedBlockClientId( state ) ).toEqual( 23 );
		} );
	} );

	describe( 'getSelectedBlock', () => {
		it( 'should return null if no block is selected', () => {
			const state = {
				blocks: {
					byClientId: {
						23: { clientId: 23, name: 'core/heading' },
						123: { clientId: 123, name: 'core/paragraph' },
					},
					attributes: {
						23: {},
						123: {},
					},
					order: {
						'': [ 23, 123 ],
						23: [],
						123: [],
					},
					parents: {
						23: '',
						123: '',
					},
				},
				blockSelection: { start: {}, end: {} },
			};

			expect( getSelectedBlock( state ) ).toBe( null );
		} );

		it( 'should return null if there is multi selection', () => {
			const state = {
				blocks: {
					byClientId: {
						23: { clientId: 23, name: 'core/heading' },
						123: { clientId: 123, name: 'core/paragraph' },
					},
					attributes: {
						23: {},
						123: {},
					},
					order: {
						'': [ 23, 123 ],
						23: [],
						123: [],
					},
					parents: {
						123: '',
						23: '',
					},
				},
				blockSelection: { start: { clientId: 23 }, end: { clientId: 123 } },
			};

			expect( getSelectedBlock( state ) ).toBe( null );
		} );

		it( 'should return the selected block', () => {
			const state = {
				blocks: {
					byClientId: {
						23: { clientId: 23, name: 'core/heading' },
						123: { clientId: 123, name: 'core/paragraph' },
					},
					attributes: {
						23: {},
						123: {},
					},
					order: {
						'': [ 23, 123 ],
						23: [],
						123: [],
					},
					parents: {
						123: '',
						23: '',
					},
					cache: {
						23: {},
					},
				},
				blockSelection: { start: { clientId: 23 }, end: { clientId: 23 } },
			};

			expect( getSelectedBlock( state ) ).toEqual( {
				clientId: 23,
				name: 'core/heading',
				attributes: {},
				innerBlocks: [],
			} );
		} );
	} );

	describe( 'getBlockRootClientId', () => {
		it( 'should return null if the block does not exist', () => {
			const state = {
				blocks: {
					order: {},
					parents: {},
				},
			};

			expect( getBlockRootClientId( state, 56 ) ).toBeNull();
		} );

		it( 'should return root ClientId relative the block ClientId', () => {
			const state = {
				blocks: {
					order: {
						'': [ 123, 23 ],
						123: [ 456, 56 ],
					},
					parents: {
						123: '',
						23: '',
						456: 123,
						56: 123,
					},
				},
			};

			expect( getBlockRootClientId( state, 56 ) ).toBe( 123 );
		} );
	} );

	describe( 'getBlockHierarchyRootClientId', () => {
		it( 'should return the given block if the block has no parents', () => {
			const state = {
				blocks: {
					order: {},
					parents: {},
				},
			};

			expect( getBlockHierarchyRootClientId( state, '56' ) ).toBe( '56' );
		} );

		it( 'should return root ClientId relative the block ClientId', () => {
			const state = {
				blocks: {
					order: {
						'': [ 'a', 'b' ],
						a: [ 'c', 'd' ],
					},
					parents: {
						a: '',
						b: '',
						c: 'a',
						d: 'a',
					},
				},
			};

			expect( getBlockHierarchyRootClientId( state, 'c' ) ).toBe( 'a' );
		} );

		it( 'should return the top level root ClientId relative the block ClientId', () => {
			const state = {
				blocks: {
					order: {
						'': [ 'a', 'b' ],
						a: [ 'c', 'd' ],
						d: [ 'e' ],
					},
					parents: {
						a: '',
						b: '',
						c: 'a',
						d: 'a',
						e: 'd',
					},
				},
			};

			expect( getBlockHierarchyRootClientId( state, 'e' ) ).toBe( 'a' );
		} );
	} );

	describe( 'getSelectedBlockClientIds', () => {
		it( 'should return empty if there is no selection', () => {
			const state = {
				blocks: {
					order: {
						'': [ 123, 23 ],
					},
					parents: {
						123: '',
						23: '',
					},
				},
				blockSelection: { start: {}, end: {} },
			};

			expect( getSelectedBlockClientIds( state ) ).toEqual( [] );
		} );

		it( 'should return the selected block clientId if there is a selection', () => {
			const state = {
				blocks: {
					order: {
						'': [ 5, 4, 3, 2, 1 ],
					},
					parents: {
						1: '',
						2: '',
						3: '',
						4: '',
						5: '',
					},
				},
				blockSelection: { start: { clientId: 2 }, end: { clientId: 2 } },
			};

			expect( getSelectedBlockClientIds( state ) ).toEqual( [ 2 ] );
		} );

		it( 'should return selected block clientIds if there is multi selection', () => {
			const state = {
				blocks: {
					order: {
						'': [ 5, 4, 3, 2, 1 ],
					},
					parents: {
						1: '',
						2: '',
						3: '',
						4: '',
						5: '',
					},
				},
				blockSelection: { start: { clientId: 2 }, end: { clientId: 4 } },
			};

			expect( getSelectedBlockClientIds( state ) ).toEqual( [ 4, 3, 2 ] );
		} );

		it( 'should return selected block clientIds if there is multi selection (nested context)', () => {
			const state = {
				blocks: {
					order: {
						'': [ 5, 4, 3, 2, 1 ],
						4: [ 9, 8, 7, 6 ],
					},
					parents: {
						1: '',
						2: '',
						3: '',
						4: '',
						5: '',
						6: 4,
						7: 4,
						8: 4,
						9: 4,
					},
				},
				blockSelection: { start: { clientId: 7 }, end: { clientId: 9 } },
			};

			expect( getSelectedBlockClientIds( state ) ).toEqual( [ 9, 8, 7 ] );
		} );
	} );

	describe( 'getMultiSelectedBlockClientIds', () => {
		it( 'should return empty if there is no multi selection', () => {
			const state = {
				blocks: {
					order: {
						'': [ 123, 23 ],
					},
					parents: {
						23: '',
						123: '',
					},
				},
				blockSelection: { start: {}, end: {} },
			};

			expect( getMultiSelectedBlockClientIds( state ) ).toEqual( [] );
		} );

		it( 'should return selected block clientIds if there is multi selection', () => {
			const state = {
				blocks: {
					order: {
						'': [ 5, 4, 3, 2, 1 ],
					},
					parents: {
						1: '',
						2: '',
						3: '',
						4: '',
						5: '',
					},
				},
				blockSelection: { start: { clientId: 2 }, end: { clientId: 4 } },
			};

			expect( getMultiSelectedBlockClientIds( state ) ).toEqual( [ 4, 3, 2 ] );
		} );

		it( 'should return selected block clientIds if there is multi selection (nested context)', () => {
			const state = {
				blocks: {
					order: {
						'': [ 5, 4, 3, 2, 1 ],
						4: [ 9, 8, 7, 6 ],
					},
					parents: {
						1: '',
						2: '',
						3: '',
						4: '',
						5: '',
						6: 4,
						7: 4,
						8: 4,
						9: 4,
					},
				},
				blockSelection: { start: { clientId: 7 }, end: { clientId: 9 } },
			};

			expect( getMultiSelectedBlockClientIds( state ) ).toEqual( [ 9, 8, 7 ] );
		} );
	} );

	describe( 'getMultiSelectedBlocks', () => {
		it( 'should return the same reference on subsequent invocations of empty selection', () => {
			const state = {
				blocks: {
					byClientId: {},
					attributes: {},
					order: {},
					parents: {},
				},
				blockSelection: { start: {}, end: {} },
			};

			expect(
				getMultiSelectedBlocks( state )
			).toBe( getMultiSelectedBlocks( state ) );
		} );
	} );

	describe( 'getMultiSelectedBlocksStartClientId', () => {
		it( 'returns null if there is no multi selection', () => {
			const state = {
				blockSelection: { start: {}, end: {} },
			};

			expect( getMultiSelectedBlocksStartClientId( state ) ).toBeNull();
		} );

		it( 'returns multi selection start', () => {
			const state = {
				blockSelection: { start: { clientId: 2 }, end: { clientId: 4 } },
			};

			expect( getMultiSelectedBlocksStartClientId( state ) ).toBe( 2 );
		} );
	} );

	describe( 'getMultiSelectedBlocksEndClientId', () => {
		it( 'returns null if there is no multi selection', () => {
			const state = {
				blockSelection: { start: {}, end: {} },
			};

			expect( getMultiSelectedBlocksEndClientId( state ) ).toBeNull();
		} );

		it( 'returns multi selection end', () => {
			const state = {
				blockSelection: { start: { clientId: 2 }, end: { clientId: 4 } },
			};

			expect( getMultiSelectedBlocksEndClientId( state ) ).toBe( 4 );
		} );
	} );

	describe( 'getBlockOrder', () => {
		it( 'should return the ordered block ClientIds of top-level blocks by default', () => {
			const state = {
				blocks: {
					order: {
						'': [ 123, 23 ],
					},
					parents: {
						23: '',
						123: '',
					},
				},
			};

			expect( getBlockOrder( state ) ).toEqual( [ 123, 23 ] );
		} );

		it( 'should return the ordered block ClientIds at a specified rootClientId', () => {
			const state = {
				blocks: {
					order: {
						'': [ 123, 23 ],
						123: [ 456 ],
					},
					parents: {
						23: '',
						123: '',
						456: 123,
					},
				},
			};

			expect( getBlockOrder( state, '123' ) ).toEqual( [ 456 ] );
		} );
	} );

	describe( 'getBlockIndex', () => {
		it( 'should return the block order', () => {
			const state = {
				blocks: {
					order: {
						'': [ 123, 23 ],
					},
					parents: {
						23: '',
						123: '',
					},
				},
			};

			expect( getBlockIndex( state, 23 ) ).toBe( 1 );
		} );

		it( 'should return the block order (nested context)', () => {
			const state = {
				blocks: {
					order: {
						'': [ 123, 23 ],
						123: [ 456, 56 ],
					},
					parents: {
						23: '',
						123: '',
						56: 123,
						456: 123,
					},
				},
			};

			expect( getBlockIndex( state, 56, '123' ) ).toBe( 1 );
		} );
	} );

	describe( 'getPreviousBlockClientId', () => {
		it( 'should return the previous block', () => {
			const state = {
				blocks: {
					order: {
						'': [ 123, 23 ],
					},
					parents: {
						23: '',
						123: '',
					},
				},
			};

			expect( getPreviousBlockClientId( state, 23 ) ).toEqual( 123 );
		} );

		it( 'should return the previous block (nested context)', () => {
			const state = {
				blocks: {
					order: {
						'': [ 123, 23 ],
						123: [ 456, 56 ],
					},
					parents: {
						23: '',
						123: '',
						456: 123,
						56: 123,
					},
				},
			};

			expect( getPreviousBlockClientId( state, 56, '123' ) ).toEqual( 456 );
		} );

		it( 'should return null for the first block', () => {
			const state = {
				blocks: {
					order: {
						'': [ 123, 23 ],
					},
					parents: {
						23: '',
						123: '',
					},
				},
			};

			expect( getPreviousBlockClientId( state, 123 ) ).toBeNull();
		} );

		it( 'should return null for the first block (nested context)', () => {
			const state = {
				blocks: {
					order: {
						'': [ 123, 23 ],
						123: [ 456, 56 ],
					},
					parents: {
						23: '',
						123: '',
						456: 123,
						56: 123,
					},
				},
			};

			expect( getPreviousBlockClientId( state, 456, '123' ) ).toBeNull();
		} );
	} );

	describe( 'getNextBlockClientId', () => {
		it( 'should return the following block', () => {
			const state = {
				blocks: {
					order: {
						'': [ 123, 23 ],
					},
					parents: {
						23: '',
						123: '',
					},
				},
			};

			expect( getNextBlockClientId( state, 123 ) ).toEqual( 23 );
		} );

		it( 'should return the following block (nested context)', () => {
			const state = {
				blocks: {
					order: {
						'': [ 123, 23 ],
						123: [ 456, 56 ],
					},
					parents: {
						23: '',
						123: '',
						456: 123,
						56: 123,
					},
				},
			};

			expect( getNextBlockClientId( state, 456, '123' ) ).toEqual( 56 );
		} );

		it( 'should return null for the last block', () => {
			const state = {
				blocks: {
					order: {
						'': [ 123, 23 ],
					},
					parents: {
						23: '',
						123: '',
					},
				},
			};

			expect( getNextBlockClientId( state, 23 ) ).toBeNull();
		} );

		it( 'should return null for the last block (nested context)', () => {
			const state = {
				blocks: {
					order: {
						'': [ 123, 23 ],
						123: [ 456, 56 ],
					},
					parents: {
						23: '',
						123: '',
						456: 123,
						56: 123,
					},
				},
			};

			expect( getNextBlockClientId( state, 56, '123' ) ).toBeNull();
		} );
	} );

	describe( 'isBlockSelected', () => {
		it( 'should return true if the block is selected', () => {
			const state = {
				blockSelection: { start: { clientId: 123 }, end: { clientId: 123 } },
			};

			expect( isBlockSelected( state, 123 ) ).toBe( true );
		} );

		it( 'should return false if a multi-selection range exists', () => {
			const state = {
				blockSelection: { start: { clientId: 123 }, end: { clientId: 124 } },
			};

			expect( isBlockSelected( state, 123 ) ).toBe( false );
		} );

		it( 'should return false if the block is not selected', () => {
			const state = {
				blockSelection: { start: {}, end: {} },
			};

			expect( isBlockSelected( state, 23 ) ).toBe( false );
		} );
	} );

	describe( 'hasSelectedInnerBlock', () => {
		it( 'should return false if the selected block is a child of the given ClientId', () => {
			const state = {
				blockSelection: { start: { clientId: 5 }, end: { clientId: 5 } },
				blocks: {
					order: {
						4: [ 3, 2, 1 ],
					},
					parents: {
						1: 4,
						2: 4,
						3: 4,
					},
				},
			};

			expect( hasSelectedInnerBlock( state, 4 ) ).toBe( false );
		} );

		it( 'should return true if the selected block is a child of the given ClientId', () => {
			const state = {
				blockSelection: { start: { clientId: 3 }, end: { clientId: 3 } },
				blocks: {
					order: {
						4: [ 3, 2, 1 ],
					},
					parents: {
						1: 4,
						2: 4,
						3: 4,
					},
				},
			};

			expect( hasSelectedInnerBlock( state, 4 ) ).toBe( true );
		} );

		it( 'should return true if a multi selection exists that contains children of the block with the given ClientId', () => {
			const state = {
				blocks: {
					order: {
						6: [ 5, 4, 3, 2, 1 ],
					},
					parents: {
						1: 6,
						2: 6,
						3: 6,
						4: 6,
						5: 6,
					},
				},
				blockSelection: { start: { clientId: 2 }, end: { clientId: 4 } },
			};
			expect( hasSelectedInnerBlock( state, 6 ) ).toBe( true );
		} );

		it( 'should return false if a multi selection exists bot does not contains children of the block with the given ClientId', () => {
			const state = {
				blocks: {
					order: {
						3: [ 2, 1 ],
						6: [ 5, 4 ],
					},
					parents: {
						1: 3,
						2: 3,
						4: 6,
						5: 6,
					},
				},
				blockSelection: { start: { clientId: 5 }, end: { clientId: 4 } },
			};
			expect( hasSelectedInnerBlock( state, 3 ) ).toBe( false );
		} );
	} );

	describe( 'isBlockWithinSelection', () => {
		it( 'should return true if the block is selected but not the last', () => {
			const state = {
				blockSelection: { start: { clientId: 5 }, end: { clientId: 3 } },
				blocks: {
					order: {
						'': [ 5, 4, 3, 2, 1 ],
					},
					parents: {
						1: '',
						2: '',
						3: '',
						4: '',
						5: '',
					},
				},
			};

			expect( isBlockWithinSelection( state, 4 ) ).toBe( true );
		} );

		it( 'should return false if the block is the last selected', () => {
			const state = {
				blockSelection: { start: { clientId: 5 }, end: { clientId: 3 } },
				blocks: {
					order: {
						'': [ 5, 4, 3, 2, 1 ],
					},
					parents: {
						1: '',
						2: '',
						3: '',
						4: '',
						5: '',
					},
				},
			};

			expect( isBlockWithinSelection( state, 3 ) ).toBe( false );
		} );

		it( 'should return false if the block is not selected', () => {
			const state = {
				blockSelection: { start: { clientId: 5 }, end: { clientId: 3 } },
				blocks: {
					order: {
						'': [ 5, 4, 3, 2, 1 ],
					},
					parents: {
						1: '',
						2: '',
						3: '',
						4: '',
						5: '',
					},
				},
			};

			expect( isBlockWithinSelection( state, 2 ) ).toBe( false );
		} );

		it( 'should return false if there is no selection', () => {
			const state = {
				blockSelection: { start: {}, end: {} },
				blocks: {
					order: {
						'': [ 5, 4, 3, 2, 1 ],
					},
					parents: {
						1: '',
						2: '',
						3: '',
						4: '',
						5: '',
					},
				},
			};

			expect( isBlockWithinSelection( state, 4 ) ).toBe( false );
		} );
	} );

	describe( 'hasMultiSelection', () => {
		it( 'should return false if no selection', () => {
			const state = {
				blockSelection: {
					start: {},
					end: {},
				},
			};

			expect( hasMultiSelection( state ) ).toBe( false );
		} );

		it( 'should return false if singular selection', () => {
			const state = {
				blockSelection: {
					start: { clientId: 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1' },
					end: { clientId: 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1' },
				},
			};

			expect( hasMultiSelection( state ) ).toBe( false );
		} );

		it( 'should return true if multi-selection', () => {
			const state = {
				blockSelection: {
					start: { clientId: 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1' },
					end: { clientId: '9db792c6-a25a-495d-adbd-97d56a4c4189' },
				},
			};

			expect( hasMultiSelection( state ) ).toBe( true );
		} );
	} );

	describe( 'isBlockMultiSelected', () => {
		const state = {
			blocks: {
				order: {
					'': [ 5, 4, 3, 2, 1 ],
				},
				parents: {
					1: '',
					2: '',
					3: '',
					4: '',
					5: '',
				},
			},
			blockSelection: { start: { clientId: 2 }, end: { clientId: 4 } },
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
			blocks: {
				order: {
					'': [ 5, 4, 3, 2, 1 ],
				},
				parents: {
					1: '',
					2: '',
					3: '',
					4: '',
					5: '',
				},
			},
			blockSelection: { start: { clientId: 2 }, end: { clientId: 4 } },
		};

		it( 'should return true if the block is first in multi selection', () => {
			expect( isFirstMultiSelectedBlock( state, 4 ) ).toBe( true );
		} );

		it( 'should return false if the block is not first in multi selection', () => {
			expect( isFirstMultiSelectedBlock( state, 3 ) ).toBe( false );
		} );
	} );

	describe( 'getBlockMode', () => {
		it( 'should return "visual" if unset', () => {
			const state = {
				blocksMode: {},
			};

			expect( getBlockMode( state, 123 ) ).toEqual( 'visual' );
		} );

		it( 'should return the block mode', () => {
			const state = {
				blocksMode: {
					123: 'html',
				},
			};

			expect( getBlockMode( state, 123 ) ).toEqual( 'html' );
		} );
	} );

	describe( 'isTyping', () => {
		it( 'should return the isTyping flag if the block is selected', () => {
			const state = {
				isTyping: true,
			};

			expect( isTyping( state ) ).toBe( true );
		} );

		it( 'should return false if the block is not selected', () => {
			const state = {
				isTyping: false,
			};

			expect( isTyping( state ) ).toBe( false );
		} );
	} );

	describe( 'isCaretWithinFormattedText', () => {
		it( 'returns true if the isCaretWithinFormattedText state is also true', () => {
			const state = {
				isCaretWithinFormattedText: true,
			};

			expect( isCaretWithinFormattedText( state ) ).toBe( true );
		} );

		it( 'returns false if the isCaretWithinFormattedText state is also false', () => {
			const state = {
				isCaretWithinFormattedText: false,
			};

			expect( isCaretWithinFormattedText( state ) ).toBe( false );
		} );
	} );

	describe( 'isSelectionEnabled', () => {
		it( 'should return true if selection is enable', () => {
			const state = {
				blockSelection: {
					isEnabled: true,
				},
			};

			expect( isSelectionEnabled( state ) ).toBe( true );
		} );

		it( 'should return false if selection is disabled', () => {
			const state = {
				blockSelection: {
					isEnabled: false,
				},
			};

			expect( isSelectionEnabled( state ) ).toBe( false );
		} );
	} );

	describe( 'getBlockInsertionPoint', () => {
		it( 'should return the explicitly assigned insertion point', () => {
			const state = {
				blockSelection: {
					start: { clientId: 'clientId2' },
					end: { clientId: 'clientId2' },
				},
				blocks: {
					byClientId: {
						clientId1: { clientId: 'clientId1' },
						clientId2: { clientId: 'clientId2' },
					},
					attributes: {
						clientId1: {},
						clientId2: {},
					},
					order: {
						'': [ 'clientId1' ],
						clientId1: [ 'clientId2' ],
						clientId2: [],
					},
					parents: {
						clientId1: '',
						clientId2: 'clientId1',
					},
				},
				insertionPoint: {
					rootClientId: undefined,
					index: 0,
				},
			};

			expect( getBlockInsertionPoint( state ) ).toEqual( {
				rootClientId: undefined,
				index: 0,
			} );
		} );

		it( 'should return an object for the selected block', () => {
			const state = {
				blockSelection: {
					start: { clientId: 'clientId1' },
					end: { clientId: 'clientId1' },
				},
				blocks: {
					byClientId: {
						clientId1: { clientId: 'clientId1' },
					},
					attributes: {
						clientId1: {},
					},
					order: {
						'': [ 'clientId1' ],
						clientId1: [],
					},
					parents: {
						clientId1: '',
					},
				},
				insertionPoint: null,
			};

			expect( getBlockInsertionPoint( state ) ).toEqual( {
				rootClientId: undefined,
				index: 1,
			} );
		} );

		it( 'should return an object for the nested selected block', () => {
			const state = {
				blockSelection: {
					start: { clientId: 'clientId2' },
					end: { clientId: 'clientId2' },
				},
				blocks: {
					byClientId: {
						clientId1: { clientId: 'clientId1' },
						clientId2: { clientId: 'clientId2' },
					},
					attributes: {
						clientId1: {},
						clientId2: {},
					},
					order: {
						'': [ 'clientId1' ],
						clientId1: [ 'clientId2' ],
						clientId2: [],
					},
					parents: {
						clientId1: '',
						clientId2: 'clientId1',
					},
				},
				insertionPoint: null,
			};

			expect( getBlockInsertionPoint( state ) ).toEqual( {
				rootClientId: 'clientId1',
				index: 1,
			} );
		} );

		it( 'should return an object for the last multi selected clientId', () => {
			const state = {
				blockSelection: {
					start: { clientId: 'clientId1' },
					end: { clientId: 'clientId2' },
				},
				blocks: {
					byClientId: {
						clientId1: { clientId: 'clientId1' },
						clientId2: { clientId: 'clientId2' },
					},
					attributes: {
						clientId1: {},
						clientId2: {},
					},
					order: {
						'': [ 'clientId1', 'clientId2' ],
						clientId1: [],
						clientId2: [],
					},
					parents: {
						clientId1: '',
						clientId2: '',
					},
				},
				insertionPoint: null,
			};

			expect( getBlockInsertionPoint( state ) ).toEqual( {
				rootClientId: undefined,
				index: 2,
			} );
		} );

		it( 'should return an object for the last block if no selection', () => {
			const state = {
				blockSelection: {
					start: {},
					end: {},
				},
				blocks: {
					byClientId: {
						clientId1: { clientId: 'clientId1' },
						clientId2: { clientId: 'clientId2' },
					},
					attributes: {
						clientId1: {},
						clientId2: {},
					},
					order: {
						'': [ 'clientId1', 'clientId2' ],
						clientId1: [],
						clientId2: [],
					},
					parents: {
						clientId1: '',
						clientId2: '',
					},
				},
				insertionPoint: null,
			};

			expect( getBlockInsertionPoint( state ) ).toEqual( {
				rootClientId: undefined,
				index: 2,
			} );
		} );
	} );

	describe( 'isBlockInsertionPointVisible', () => {
		it( 'should return false if no assigned insertion point', () => {
			const state = {
				insertionPoint: null,
			};

			expect( isBlockInsertionPointVisible( state ) ).toBe( false );
		} );

		it( 'should return true if assigned insertion point', () => {
			const state = {
				insertionPoint: {
					rootClientId: undefined,
					index: 5,
				},
			};

			expect( isBlockInsertionPointVisible( state ) ).toBe( true );
		} );
	} );

	describe( 'canInsertBlockType', () => {
		it( 'should deny blocks that are not registered', () => {
			const state = {
				blocks: {
					byClientId: {},
					attributes: {},
				},
				blockListSettings: {},
				settings: {},
			};
			expect( canInsertBlockType( state, 'core/invalid' ) ).toBe( false );
		} );

		it( 'should deny blocks that are not allowed by the editor', () => {
			const state = {
				blocks: {
					byClientId: {},
					attributes: {},
				},
				blockListSettings: {},
				settings: {
					allowedBlockTypes: [],
				},
			};
			expect( canInsertBlockType( state, 'core/test-block-a' ) ).toBe( false );
		} );

		it( 'should allow blocks that are allowed by the editor', () => {
			const state = {
				blocks: {
					byClientId: {},
					attributes: {},
				},
				blockListSettings: {},
				settings: {
					allowedBlockTypes: [ 'core/test-block-a' ],
				},
			};
			expect( canInsertBlockType( state, 'core/test-block-a' ) ).toBe( true );
		} );

		it( 'should deny blocks when the editor has a template lock', () => {
			const state = {
				blocks: {
					byClientId: {},
					attributes: {},
				},
				blockListSettings: {},
				settings: {
					templateLock: 'all',
				},
			};
			expect( canInsertBlockType( state, 'core/test-block-a' ) ).toBe( false );
		} );

		it( 'should deny blocks that restrict parent from being inserted into the root', () => {
			const state = {
				blocks: {
					byClientId: {},
					attributes: {},
				},
				blockListSettings: {},
				settings: {},
			};
			expect( canInsertBlockType( state, 'core/test-block-c' ) ).toBe( false );
		} );

		it( 'should deny blocks that restrict parent from being inserted into a restricted parent', () => {
			const state = {
				blocks: {
					byClientId: {
						block1: { name: 'core/test-block-a' },
					},
					attributes: {
						block1: {},
					},
				},
				blockListSettings: {},
				settings: {},
			};
			expect( canInsertBlockType( state, 'core/test-block-c', 'block1' ) ).toBe( false );
		} );

		it( 'should allow blocks that restrict parent to be inserted into an allowed parent', () => {
			const state = {
				blocks: {
					byClientId: {
						block1: { name: 'core/test-block-b' },
					},
					attributes: {
						block1: {},
					},
				},
				blockListSettings: {},
				settings: {},
			};
			expect( canInsertBlockType( state, 'core/test-block-c', 'block1' ) ).toBe( true );
		} );

		it( 'should deny restricted blocks from being inserted into a block that restricts allowedBlocks', () => {
			const state = {
				blocks: {
					byClientId: {
						block1: { name: 'core/test-block-a' },
					},
					attributes: {
						block1: {},
					},
				},
				blockListSettings: {
					block1: {
						allowedBlocks: [ 'core/test-block-c' ],
					},
				},
				settings: {},
			};
			expect( canInsertBlockType( state, 'core/test-block-b', 'block1' ) ).toBe( false );
		} );

		it( 'should allow allowed blocks to be inserted into a block that restricts allowedBlocks', () => {
			const state = {
				blocks: {
					byClientId: {
						block1: { name: 'core/test-block-a' },
					},
					attributes: {
						block1: {},
					},
				},
				blockListSettings: {
					block1: {
						allowedBlocks: [ 'core/test-block-b' ],
					},
				},
				settings: {},
			};
			expect( canInsertBlockType( state, 'core/test-block-b', 'block1' ) ).toBe( true );
		} );

		it( 'should prioritise parent over allowedBlocks', () => {
			const state = {
				blocks: {
					byClientId: {
						block1: { name: 'core/test-block-b' },
					},
					attributes: {
						block1: {},
					},
				},
				blockListSettings: {
					block1: {
						allowedBlocks: [],
					},
				},
				settings: {},
			};
			expect( canInsertBlockType( state, 'core/test-block-c', 'block1' ) ).toBe( true );
		} );
	} );

	describe( 'getInserterItems', () => {
		it( 'should properly list block type and reusable block items', () => {
			const state = {
				blocks: {
					byClientId: {
						block1: { name: 'core/test-block-a' },
					},
					attributes: {
						block1: {},
					},
					order: {},
					parents: {},
					cache: {},
				},
				settings: {
					__experimentalReusableBlocks: [
						{ id: 1, isTemporary: false, clientId: 'block1', title: 'Reusable Block 1' },
					],
				},
				// Intentionally include a test case which considers
				// `insertUsage` as not present within preferences.
				//
				// See: https://github.com/WordPress/gutenberg/issues/14580
				preferences: {},
				blockListSettings: {},
			};
			const items = getInserterItems( state );
			const testBlockAItem = items.find( ( item ) => item.id === 'core/test-block-a' );
			expect( testBlockAItem ).toEqual( {
				id: 'core/test-block-a',
				name: 'core/test-block-a',
				initialAttributes: {},
				title: 'Test Block A',
				icon: {
					src: 'test',
				},
				category: 'formatting',
				keywords: [ 'testing' ],
				isDisabled: false,
				utility: 0,
				frecency: 0,
				hasChildBlocksWithInserterSupport: false,
			} );
			const reusableBlockItem = items.find( ( item ) => item.id === 'core/block/1' );
			expect( reusableBlockItem ).toEqual( {
				id: 'core/block/1',
				name: 'core/block',
				initialAttributes: { ref: 1 },
				title: 'Reusable Block 1',
				icon: {
					src: 'test',
				},
				category: 'reusable',
				keywords: [],
				isDisabled: false,
				utility: 0,
				frecency: 0,
			} );
		} );

		it( 'should not list a reusable block item if it is being inserted inside it self', () => {
			const state = {
				blocks: {
					byClientId: {
						block1ref: {
							name: 'core/block',
							clientId: 'block1ref',
						},
						itselfBlock1: { name: 'core/test-block-a' },
						itselfBlock2: { name: 'core/test-block-b' },
					},
					attributes: {
						block1ref: {
							attributes: {
								ref: 1,
							},
						},
						itselfBlock1: {},
						itselfBlock2: {},
					},
					order: {
						'': [ 'block1ref' ],
					},
					parents: {
						block1ref: '',
					},
					cache: {
						block1ref: {},
					},
				},
				settings: {
					__experimentalReusableBlocks: [
						{ id: 1, isTemporary: false, clientId: 'itselfBlock1', title: 'Reusable Block 1' },
						{ id: 2, isTemporary: false, clientId: 'itselfBlock2', title: 'Reusable Block 2' },
					],
				},
				preferences: {
					insertUsage: {},
				},
				blockListSettings: {},
			};
			const items = getInserterItems( state, 'itselfBlock1' );
			const reusableBlockItems = filter( items, [ 'name', 'core/block' ] );
			expect( reusableBlockItems ).toHaveLength( 1 );
			expect( reusableBlockItems[ 0 ] ).toEqual( {
				id: 'core/block/2',
				name: 'core/block',
				initialAttributes: { ref: 2 },
				title: 'Reusable Block 2',
				icon: {
					src: 'test',
				},
				category: 'reusable',
				keywords: [],
				isDisabled: false,
				utility: 0,
				frecency: 0,
			} );
		} );

		it( 'should not list a reusable block item if it is being inserted inside a descendent', () => {
			const state = {
				blocks: {
					byClientId: {
						block2ref: {
							name: 'core/block',
							clientId: 'block1ref',
						},
						referredBlock1: { name: 'core/test-block-a' },
						referredBlock2: { name: 'core/test-block-b' },
						childReferredBlock2: { name: 'core/test-block-a' },
						grandchildReferredBlock2: { name: 'core/test-block-b' },
					},
					attributes: {
						block2ref: {
							attributes: {
								ref: 2,
							},
						},
						referredBlock1: {},
						referredBlock2: {},
						childReferredBlock2: {},
						grandchildReferredBlock2: {},
					},
					order: {
						'': [ 'block2ref' ],
						referredBlock2: [ 'childReferredBlock2' ],
						childReferredBlock2: [ 'grandchildReferredBlock2' ],
					},
					parents: {
						block2ref: '',
						childReferredBlock2: 'referredBlock2',
						grandchildReferredBlock2: 'childReferredBlock2',
					},
					cache: {
						block2ref: {},
						childReferredBlock2: {},
						grandchildReferredBlock2: {},
					},
				},

				settings: {
					__experimentalReusableBlocks: [
						{ id: 1, isTemporary: false, clientId: 'referredBlock1', title: 'Reusable Block 1' },
						{ id: 2, isTemporary: false, clientId: 'referredBlock2', title: 'Reusable Block 2' },
					],
				},
				preferences: {
					insertUsage: {},
				},
				blockListSettings: {},
			};
			const items = getInserterItems( state, 'grandchildReferredBlock2' );
			const reusableBlockItems = filter( items, [ 'name', 'core/block' ] );
			expect( reusableBlockItems ).toHaveLength( 1 );
			expect( reusableBlockItems[ 0 ] ).toEqual( {
				id: 'core/block/1',
				name: 'core/block',
				initialAttributes: { ref: 1 },
				title: 'Reusable Block 1',
				icon: {
					src: 'test',
				},
				category: 'reusable',
				keywords: [],
				isDisabled: false,
				utility: 0,
				frecency: 0,
			} );
		} );
		it( 'should order items by descending utility and frecency', () => {
			const state = {
				blocks: {
					byClientId: {
						block1: { name: 'core/test-block-a' },
						block2: { name: 'core/test-block-a' },
					},
					attributes: {
						block1: {},
						block2: {},
					},
					order: {},
					parents: {},
					cache: {},
				},
				settings: {
					__experimentalReusableBlocks: [
						{ id: 1, isTemporary: false, clientId: 'block1', title: 'Reusable Block 1' },
						{ id: 2, isTemporary: false, clientId: 'block2', title: 'Reusable Block 2' },
					],
				},
				preferences: {
					insertUsage: {
						'core/block/1': { count: 10, time: 1000 },
						'core/block/2': { count: 20, time: 1000 },
					},
				},
				blockListSettings: {},
			};
			const itemIDs = getInserterItems( state ).map( ( item ) => item.id );
			expect( itemIDs ).toEqual( [
				'core/block/2',
				'core/block/1',
				'core/test-block-b',
				'core/test-freeform',
				'core/test-block-a',
			] );
		} );

		it( 'should correctly cache the return values', () => {
			const state = {
				blocks: {
					byClientId: {
						block1: { name: 'core/test-block-a' },
						block2: { name: 'core/test-block-a' },
						block3: { name: 'core/test-block-a' },
						block4: { name: 'core/test-block-a' },
					},
					attributes: {
						block1: {},
						block2: {},
						block3: {},
						block4: {},
					},
					order: {
						'': [ 'block3', 'block4' ],
					},
					parents: {
						block3: '',
						block4: '',
					},
					cache: {
						block1: {},
						block2: {},
						block3: {},
						block4: {},
					},
				},
				settings: {
					__experimentalReusableBlocks: [
						{ id: 1, isTemporary: false, clientId: 'block1', title: 'Reusable Block 1' },
						{ id: 2, isTemporary: false, clientId: 'block2', title: 'Reusable Block 2' },
					],
				},
				preferences: {
					insertUsage: {},
				},
				blockListSettings: {},
			};

			const stateSecondBlockRestricted = {
				...state,
				blockListSettings: {
					block4: {
						allowedBlocks: [ 'core/test-block-b' ],
					},
				},
			};

			const firstBlockFirstCall = getInserterItems( state, 'block3' );
			const firstBlockSecondCall = getInserterItems( stateSecondBlockRestricted, 'block3' );
			expect( firstBlockFirstCall ).toBe( firstBlockSecondCall );
			expect( firstBlockFirstCall.map( ( item ) => item.id ) ).toEqual( [
				'core/test-block-b',
				'core/test-freeform',
				'core/test-block-a',
				'core/block/1',
				'core/block/2',
			] );

			const secondBlockFirstCall = getInserterItems( state, 'block4' );
			const secondBlockSecondCall = getInserterItems( stateSecondBlockRestricted, 'block4' );
			expect( secondBlockFirstCall.map( ( item ) => item.id ) ).toEqual( [
				'core/test-block-b',
				'core/test-freeform',
				'core/test-block-a',
				'core/block/1',
				'core/block/2',
			] );
			expect( secondBlockSecondCall.map( ( item ) => item.id ) ).toEqual( [
				'core/test-block-b',
			] );
		} );

		it( 'should set isDisabled when a block with `multiple: false` has been used', () => {
			const state = {
				blocks: {
					byClientId: {
						block1: { clientId: 'block1', name: 'core/test-block-b' },
					},
					attributes: {
						block1: { attribute: {} },
					},
					order: {
						'': [ 'block1' ],
					},
					cache: {
						block1: {},
					},
				},
				preferences: {
					insertUsage: {},
				},
				blockListSettings: {},
				settings: {},
			};
			const items = getInserterItems( state );
			const testBlockBItem = items.find( ( item ) => item.id === 'core/test-block-b' );
			expect( testBlockBItem.isDisabled ).toBe( true );
		} );

		it( 'should give common blocks a low utility', () => {
			const state = {
				blocks: {
					byClientId: {},
					attributes: {},
					order: {},
					parents: {},
					cache: {},
				},
				preferences: {
					insertUsage: {},
				},
				blockListSettings: {},
				settings: {},
			};
			const items = getInserterItems( state );
			const testBlockBItem = items.find( ( item ) => item.id === 'core/test-block-b' );
			expect( testBlockBItem.utility ).toBe( INSERTER_UTILITY_LOW );
		} );

		it( 'should give used blocks a medium utility and set a frecency', () => {
			const state = {
				blocks: {
					byClientId: {},
					attributes: {},
					order: {},
					parents: {},
					cache: {},
				},
				preferences: {
					insertUsage: {
						'core/test-block-b': { count: 10, time: 1000 },
					},
				},
				blockListSettings: {},
				settings: {},
			};
			const items = getInserterItems( state );
			const reusableBlock2Item = items.find( ( item ) => item.id === 'core/test-block-b' );
			expect( reusableBlock2Item.utility ).toBe( INSERTER_UTILITY_MEDIUM );
			expect( reusableBlock2Item.frecency ).toBe( 2.5 );
		} );

		it( 'should give contextual blocks a high utility', () => {
			const state = {
				blocks: {
					byClientId: {
						block1: { name: 'core/test-block-b' },
					},
					attributes: {
						block1: { attribute: {} },
					},
					order: {
						'': [ 'block1' ],
					},
					parents: {
						block1: '',
					},
					cache: {
						block1: {},
					},
				},
				preferences: {
					insertUsage: {},
				},
				blockListSettings: {},
				settings: {},
			};
			const items = getInserterItems( state, 'block1' );
			const testBlockCItem = items.find( ( item ) => item.id === 'core/test-block-c' );
			expect( testBlockCItem.utility ).toBe( INSERTER_UTILITY_HIGH );
		} );
	} );

	describe( 'isValidTemplate', () => {
		it( 'should return true if template is valid', () => {
			const state = {
				template: { isValid: true },
			};

			expect( isValidTemplate( state ) ).toBe( true );
		} );

		it( 'should return false if template is not valid', () => {
			const state = {
				template: { isValid: false },
			};

			expect( isValidTemplate( state ) ).toBe( false );
		} );
	} );

	describe( 'getTemplate', () => {
		it( 'should return the template object', () => {
			const template = [];
			const state = {
				settings: { template },
			};

			expect( getTemplate( state ) ).toBe( template );
		} );
	} );

	describe( 'getTemplateLock', () => {
		it( 'should return the general template lock if no clientId was set', () => {
			const state = {
				settings: { templateLock: 'all' },
			};

			expect( getTemplateLock( state ) ).toBe( 'all' );
		} );

		it( 'should return null if the specified clientId was not found ', () => {
			const state = {
				settings: { templateLock: 'all' },
				blockListSettings: {
					chicken: {
						templateLock: 'insert',
					},
				},
			};

			expect( getTemplateLock( state, 'ribs' ) ).toBe( null );
		} );

		it( 'should return null if template lock was not set on the specified block', () => {
			const state = {
				settings: { templateLock: 'all' },
				blockListSettings: {
					chicken: {
						test: 'tes1t',
					},
				},
			};

			expect( getTemplateLock( state, 'ribs' ) ).toBe( null );
		} );

		it( 'should return the template lock for the specified clientId', () => {
			const state = {
				settings: { templateLock: 'all' },
				blockListSettings: {
					chicken: {
						templateLock: 'insert',
					},
				},
			};

			expect( getTemplateLock( state, 'chicken' ) ).toBe( 'insert' );
		} );
	} );

	describe( 'getBlockListSettings', () => {
		it( 'should return the settings of a block', () => {
			const state = {
				blockListSettings: {
					chicken: {
						setting1: false,
					},
					ribs: {
						setting2: true,
					},
				},
			};

			expect( getBlockListSettings( state, 'chicken' ) ).toEqual( {
				setting1: false,
			} );
		} );

		it( 'should return undefined if settings for the block don’t exist', () => {
			const state = {
				blockListSettings: {},
			};

			expect( getBlockListSettings( state, 'chicken' ) ).toBe( undefined );
		} );
	} );

	describe( '__experimentalGetLastBlockAttributeChanges', () => {
		it( 'returns the last block attributes change', () => {
			const state = {
				lastBlockAttributesChange: {
					block1: { fruit: 'bananas' },
				},
			};

			const result = __experimentalGetLastBlockAttributeChanges( state );

			expect( result ).toEqual( {
				block1: { fruit: 'bananas' },
			} );
		} );
	} );
} );
