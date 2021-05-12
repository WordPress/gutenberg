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
	getBlockParents,
	getBlockParentsByBlockName,
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
	isDraggingBlocks,
	getDraggedBlockClientIds,
	isBlockBeingDragged,
	isAncestorBeingDragged,
	isCaretWithinFormattedText,
	getBlockInsertionPoint,
	isBlockInsertionPointVisible,
	isSelectionEnabled,
	canInsertBlockType,
	canInsertBlocks,
	getInserterItems,
	getBlockTransformItems,
	isValidTemplate,
	getTemplate,
	getTemplateLock,
	getBlockListSettings,
	__experimentalGetBlockListSettingsForBlocks,
	__experimentalGetLastBlockAttributeChanges,
	getLowestCommonAncestorWithSelectedBlock,
	__experimentalGetActiveBlockIdByBlockNames: getActiveBlockIdByBlockNames,
	__experimentalGetParsedReusableBlock,
	__experimentalGetAllowedPatterns,
	__experimentalGetPatternsByBlockTypes,
	__unstableGetClientIdWithClientIdsTree,
	__unstableGetClientIdsTree,
	wasBlockJustInserted,
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
			category: 'design',
			title: 'Test Block A',
			icon: 'test',
			keywords: [ 'testing' ],
		} );

		registerBlockType( 'core/test-block-b', {
			save: ( props ) => props.attributes.text,
			category: 'text',
			title: 'Test Block B',
			icon: 'test',
			keywords: [ 'testing' ],
			supports: {
				multiple: false,
			},
		} );

		registerBlockType( 'core/test-block-c', {
			save: ( props ) => props.attributes.text,
			category: 'text',
			title: 'Test Block C',
			icon: 'test',
			keywords: [ 'testing' ],
			parent: [ 'core/test-block-b' ],
		} );

		registerBlockType( 'core/test-freeform', {
			save: ( props ) => <RawHTML>{ props.attributes.content }</RawHTML>,
			category: 'text',
			title: 'Test Freeform Content Handler',
			icon: 'test',
			attributes: {
				content: {
					type: 'string',
				},
			},
		} );

		registerBlockType( 'core/post-content-child', {
			save: () => null,
			category: 'text',
			title: 'Test Block Post Content Child',
			icon: 'test',
			keywords: [ 'testing' ],
			parent: [ 'core/post-content' ],
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
		unregisterBlockType( 'core/post-content-child' );

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

			const name = getBlockName(
				state,
				'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1'
			);

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

			const name = getBlockName(
				state,
				'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1'
			);

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
					controlledInnerBlocks: {},
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
					controlledInnerBlocks: {},
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
					controlledInnerBlocks: {},
				},
			};

			expect( getBlock( state, 123 ) ).toEqual( {
				clientId: 123,
				name: 'core/paragraph',
				attributes: {},
				innerBlocks: [
					{
						clientId: 456,
						name: 'core/paragraph',
						attributes: {},
						innerBlocks: [],
					},
				],
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
					controlledInnerBlocks: {},
				},
			};

			expect( getBlocks( state ) ).toEqual( [
				{
					clientId: 123,
					name: 'core/paragraph',
					attributes: {},
					innerBlocks: [],
				},
				{
					clientId: 23,
					name: 'core/heading',
					attributes: {},
					innerBlocks: [],
				},
			] );
		} );
		it( 'only returns a new value if the cache key of a direct child changes', () => {
			const cacheRef = {};
			const state = {
				blocks: {
					byClientId: {
						23: { clientId: 23, name: 'core/heading' },
					},
					attributes: {
						23: {},
					},
					order: {
						'': [ 23 ],
					},
					parents: {
						23: '',
					},
					cache: {
						23: cacheRef,
					},
					controlledInnerBlocks: {},
				},
			};
			const oldBlocks = getBlocks( state );

			const newStateSameCache = {
				blocks: {
					byClientId: {
						23: { clientId: 23, name: 'core/heading' },
					},
					attributes: {
						23: {},
					},
					order: {
						'': [ 23 ],
					},
					parents: {
						23: '',
					},
					cache: {
						23: cacheRef,
					},
					controlledInnerBlocks: {},
				},
			};
			// Makes sure blocks are referentially equal if the cache key stays the same.
			const newBlocks = getBlocks( newStateSameCache );
			expect( oldBlocks ).toBe( newBlocks );

			const newStateNewCache = {
				blocks: {
					byClientId: {
						23: { clientId: 23, name: 'core/heading' },
					},
					attributes: {
						23: {},
					},
					order: {
						'': [ 23 ],
					},
					parents: {
						23: '',
					},
					cache: {
						23: {},
					},
					controlledInnerBlocks: {},
				},
			};
			// Blocks are referentially different if the cache key changes.
			const newBlocksNewCache = getBlocks( newStateNewCache );
			expect( oldBlocks ).not.toBe( newBlocksNewCache );
		} );
	} );

	describe( 'getBlockParents', () => {
		it( 'should return parent blocks', () => {
			const state = {
				blocks: {
					parents: {
						'client-id-01': '',
						'client-id-02': 'client-id-01',
						'client-id-03': 'client-id-02',
						'client-id-04': 'client-id-03',
					},
					byClientId: {
						'client-id-01': {
							clientId: 'client-id-01',
							name: 'core/columns',
						},
						'client-id-02': {
							clientId: 'client-id-02',
							name: 'core/navigation',
						},
						'client-id-03': {
							clientId: 'client-id-03',
							name: 'core/navigation-link',
						},
						'client-id-04': {
							clientId: 'client-id-04',
							name: 'core/paragraph',
						},
					},
					cache: {
						'client-id-01': {},
						'client-id-02': {},
						'client-id-03': {},
						'client-id-04': {},
					},
					controlledInnerBlocks: {},
				},
			};

			expect( getBlockParents( state, 'client-id-04' ) ).toEqual( [
				'client-id-01',
				'client-id-02',
				'client-id-03',
			] );

			expect( getBlockParents( state, 'client-id-0' ) ).toEqual( [] );
		} );
	} );

	describe( 'getBlockParentsByBlockName', () => {
		const state = {
			blocks: {
				parents: {
					'client-id-01': '',
					'client-id-02': 'client-id-01',
					'client-id-03': 'client-id-02',
					'client-id-04': 'client-id-03',
					'client-id-05': 'client-id-04',
				},
				byClientId: {
					'client-id-01': {
						clientId: 'client-id-01',
						name: 'core/navigation',
					},
					'client-id-02': {
						clientId: 'client-id-02',
						name: 'core/columns',
					},
					'client-id-03': {
						clientId: 'client-id-03',
						name: 'core/navigation',
					},
					'client-id-04': {
						clientId: 'client-id-04',
						name: 'core/navigation-link',
					},
					'client-id-05': {
						clientId: 'client-id-05',
						name: 'core/navigation-link',
					},
				},
				cache: {
					'client-id-01': {},
					'client-id-02': {},
					'client-id-03': {},
					'client-id-04': {},
					'client-id-05': {},
				},
				controlledInnerBlocks: {},
			},
		};
		it( 'should return parent blocks', () => {
			expect(
				getBlockParentsByBlockName(
					state,
					'client-id-05',
					'core/navigation'
				)
			).toEqual( [ 'client-id-01', 'client-id-03' ] );

			expect(
				getBlockParentsByBlockName(
					state,
					'client-id-05',
					'core/columns'
				)
			).toEqual( [ 'client-id-02' ] );

			expect(
				getBlockParentsByBlockName(
					state,
					'client-id-5',
					'core/unknown-block'
				)
			).toEqual( [] );
		} );
		it( 'Should optionally accept an array of parent types and return parents of multiple types', () => {
			expect(
				getBlockParentsByBlockName( state, 'client-id-05', [
					'core/navigation',
				] )
			).toEqual( [ 'client-id-01', 'client-id-03' ] );

			expect(
				getBlockParentsByBlockName( state, 'client-id-05', [
					'core/columns',
					'core/navigation',
				] )
			).toEqual( [ 'client-id-01', 'client-id-02', 'client-id-03' ] );
		} );
	} );

	describe( 'getClientIdsOfDescendants', () => {
		it( 'should return the ids of any descendants, given an array of clientIds', () => {
			const state = {
				blocks: {
					byClientId: {
						'uuid-2': { clientId: 'uuid-2', name: 'core/image' },
						'uuid-4': {
							clientId: 'uuid-4',
							name: 'core/paragraph',
						},
						'uuid-6': {
							clientId: 'uuid-6',
							name: 'core/paragraph',
						},
						'uuid-8': { clientId: 'uuid-8', name: 'core/block' },
						'uuid-10': {
							clientId: 'uuid-10',
							name: 'core/columns',
						},
						'uuid-12': { clientId: 'uuid-12', name: 'core/column' },
						'uuid-14': { clientId: 'uuid-14', name: 'core/column' },
						'uuid-16': { clientId: 'uuid-16', name: 'core/quote' },
						'uuid-18': { clientId: 'uuid-18', name: 'core/block' },
						'uuid-20': {
							clientId: 'uuid-20',
							name: 'core/gallery',
						},
						'uuid-22': { clientId: 'uuid-22', name: 'core/block' },
						'uuid-24': {
							clientId: 'uuid-24',
							name: 'core/columns',
						},
						'uuid-26': { clientId: 'uuid-26', name: 'core/column' },
						'uuid-28': { clientId: 'uuid-28', name: 'core/column' },
						'uuid-30': {
							clientId: 'uuid-30',
							name: 'core/paragraph',
						},
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
						'uuid-2': [],
						'uuid-4': [],
						'uuid-6': [],
						'uuid-8': [],
						'uuid-10': [ 'uuid-12', 'uuid-14' ],
						'uuid-12': [ 'uuid-16' ],
						'uuid-14': [ 'uuid-18' ],
						'uuid-16': [],
						'uuid-18': [ 'uuid-24' ],
						'uuid-20': [],
						'uuid-22': [],
						'uuid-24': [ 'uuid-26', 'uuid-28' ],
						'uuid-26': [],
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
					controlledInnerBlocks: {},
				},
			};
			expect(
				getClientIdsOfDescendants( state, [ 'uuid-10' ] )
			).toEqual( [
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
						'uuid-4': {
							clientId: 'uuid-4',
							name: 'core/paragraph',
						},
						'uuid-6': {
							clientId: 'uuid-6',
							name: 'core/paragraph',
						},
						'uuid-8': { clientId: 'uuid-8', name: 'core/block' },
						'uuid-10': {
							clientId: 'uuid-10',
							name: 'core/columns',
						},
						'uuid-12': { clientId: 'uuid-12', name: 'core/column' },
						'uuid-14': { clientId: 'uuid-14', name: 'core/column' },
						'uuid-16': { clientId: 'uuid-16', name: 'core/quote' },
						'uuid-18': { clientId: 'uuid-18', name: 'core/block' },
						'uuid-20': {
							clientId: 'uuid-20',
							name: 'core/gallery',
						},
						'uuid-22': { clientId: 'uuid-22', name: 'core/block' },
						'uuid-24': {
							clientId: 'uuid-24',
							name: 'core/columns',
						},
						'uuid-26': { clientId: 'uuid-26', name: 'core/column' },
						'uuid-28': { clientId: 'uuid-28', name: 'core/column' },
						'uuid-30': {
							clientId: 'uuid-30',
							name: 'core/paragraph',
						},
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
						'uuid-2': [],
						'uuid-4': [],
						'uuid-6': [],
						'uuid-8': [],
						'uuid-10': [ 'uuid-12', 'uuid-14' ],
						'uuid-12': [ 'uuid-16' ],
						'uuid-14': [ 'uuid-18' ],
						'uuid-16': [],
						'uuid-18': [ 'uuid-24' ],
						'uuid-20': [],
						'uuid-22': [],
						'uuid-24': [ 'uuid-26', 'uuid-28' ],
						'uuid-26': [],
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
				selection: {
					selectionStart: {},
					selectionEnd: {},
				},
			};

			expect( hasSelectedBlock( state ) ).toBe( false );
		} );

		it( 'should return false if multi-selection', () => {
			const state = {
				selection: {
					selectionStart: {
						clientId: 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1',
					},
					selectionEnd: {
						clientId: '9db792c6-a25a-495d-adbd-97d56a4c4189',
					},
				},
			};

			expect( hasSelectedBlock( state ) ).toBe( false );
		} );

		it( 'should return true if singular selection', () => {
			const state = {
				selection: {
					selectionStart: {
						clientId: 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1',
					},
					selectionEnd: {
						clientId: 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1',
					},
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
			expect( getGlobalBlockCount( emptyState, 'core/heading' ) ).toBe(
				0
			);
		} );
	} );

	describe( 'getSelectedBlockClientId', () => {
		it( 'should return null if no block is selected', () => {
			const state = {
				selection: {
					selectionStart: {},
					selectionEnd: {},
				},
			};

			expect( getSelectedBlockClientId( state ) ).toBe( null );
		} );

		it( 'should return null if there is multi selection', () => {
			const state = {
				selection: {
					selectionStart: { clientId: 23 },
					selectionEnd: { clientId: 123 },
				},
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
				selection: {
					selectionStart: { clientId: 23 },
					selectionEnd: { clientId: 23 },
				},
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
				selection: {
					selectionStart: {},
					selectionEnd: {},
				},
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
				selection: {
					selectionStart: { clientId: 23 },
					selectionEnd: { clientId: 123 },
				},
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
					controlledInnerBlocks: {},
				},
				selection: {
					selectionStart: { clientId: 23 },
					selectionEnd: { clientId: 23 },
				},
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
				selection: {
					selectionStart: {},
					selectionEnd: {},
				},
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
				selection: {
					selectionStart: { clientId: 2 },
					selectionEnd: { clientId: 2 },
				},
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
				selection: {
					selectionStart: { clientId: 2 },
					selectionEnd: { clientId: 4 },
				},
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
				selection: {
					selectionStart: { clientId: 7 },
					selectionEnd: { clientId: 9 },
				},
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
				selection: {
					selectionStart: {},
					selectionEnd: {},
				},
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
				selection: {
					selectionStart: { clientId: 2 },
					selectionEnd: { clientId: 4 },
				},
			};

			expect( getMultiSelectedBlockClientIds( state ) ).toEqual( [
				4,
				3,
				2,
			] );
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
				selection: {
					selectionStart: { clientId: 7 },
					selectionEnd: { clientId: 9 },
				},
			};

			expect( getMultiSelectedBlockClientIds( state ) ).toEqual( [
				9,
				8,
				7,
			] );
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
				selection: {
					selectionStart: {},
					selectionEnd: {},
				},
			};

			expect( getMultiSelectedBlocks( state ) ).toBe(
				getMultiSelectedBlocks( state )
			);
		} );
	} );

	describe( 'getMultiSelectedBlocksStartClientId', () => {
		it( 'returns null if there is no multi selection', () => {
			const state = {
				selection: {
					selectionStart: {},
					selectionEnd: {},
				},
			};

			expect( getMultiSelectedBlocksStartClientId( state ) ).toBeNull();
		} );

		it( 'returns multi selection start', () => {
			const state = {
				selection: {
					selectionStart: { clientId: 2 },
					selectionEnd: { clientId: 4 },
				},
			};

			expect( getMultiSelectedBlocksStartClientId( state ) ).toBe( 2 );
		} );
	} );

	describe( 'getMultiSelectedBlocksEndClientId', () => {
		it( 'returns null if there is no multi selection', () => {
			const state = {
				selection: {
					selectionStart: {},
					selectionEnd: {},
				},
			};

			expect( getMultiSelectedBlocksEndClientId( state ) ).toBeNull();
		} );

		it( 'returns multi selection end', () => {
			const state = {
				selection: {
					selectionStart: { clientId: 2 },
					selectionEnd: { clientId: 4 },
				},
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

			expect( getPreviousBlockClientId( state, 56, '123' ) ).toEqual(
				456
			);
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
				selection: {
					selectionStart: { clientId: 123 },
					selectionEnd: { clientId: 123 },
				},
			};

			expect( isBlockSelected( state, 123 ) ).toBe( true );
		} );

		it( 'should return false if a multi-selection range exists', () => {
			const state = {
				selection: {
					selectionStart: { clientId: 123 },
					selectionEnd: { clientId: 124 },
				},
			};

			expect( isBlockSelected( state, 123 ) ).toBe( false );
		} );

		it( 'should return false if the block is not selected', () => {
			const state = {
				selection: {
					selectionStart: {},
					selectionEnd: {},
				},
			};

			expect( isBlockSelected( state, 23 ) ).toBe( false );
		} );
	} );

	describe( 'hasSelectedInnerBlock', () => {
		it( 'should return false if the selected block is a child of the given ClientId', () => {
			const state = {
				selection: {
					selectionStart: { clientId: 5 },
					selectionEnd: { clientId: 5 },
				},
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
				selection: {
					selectionStart: { clientId: 3 },
					selectionEnd: { clientId: 3 },
				},
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
				selection: {
					selectionStart: { clientId: 2 },
					selectionEnd: { clientId: 4 },
				},
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
				selection: {
					selectionStart: { clientId: 5 },
					selectionEnd: { clientId: 4 },
				},
			};
			expect( hasSelectedInnerBlock( state, 3 ) ).toBe( false );
		} );
	} );

	describe( 'isBlockWithinSelection', () => {
		it( 'should return true if the block is selected but not the last', () => {
			const state = {
				selection: {
					selectionStart: { clientId: 5 },
					selectionEnd: { clientId: 3 },
				},
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
				selection: {
					selectionStart: { clientId: 5 },
					selectionEnd: { clientId: 3 },
				},
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
				selection: {
					selectionStart: { clientId: 5 },
					selectionEnd: { clientId: 3 },
				},
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
				selection: {
					selectionStart: {},
					selectionEnd: {},
				},
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
				selection: {
					selectionStart: {},
					selectionEnd: {},
				},
			};

			expect( hasMultiSelection( state ) ).toBe( false );
		} );

		it( 'should return false if singular selection', () => {
			const state = {
				selection: {
					selectionStart: {
						clientId: 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1',
					},
					selectionEnd: {
						clientId: 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1',
					},
				},
			};

			expect( hasMultiSelection( state ) ).toBe( false );
		} );

		it( 'should return true if multi-selection', () => {
			const state = {
				selection: {
					selectionStart: {
						clientId: 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1',
					},
					selectionEnd: {
						clientId: '9db792c6-a25a-495d-adbd-97d56a4c4189',
					},
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
			selection: {
				selectionStart: { clientId: 2 },
				selectionEnd: { clientId: 4 },
			},
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
			selection: {
				selectionStart: { clientId: 2 },
				selectionEnd: { clientId: 4 },
			},
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

	describe( 'isDraggingBlocks', () => {
		it( 'should return true if a block is being dragged', () => {
			const state = {
				draggedBlocks: [ 'block-client-id' ],
			};
			expect( isDraggingBlocks( state ) ).toBe( true );
		} );

		it( 'should return false if a block is not being dragged', () => {
			const state = {
				draggedBlocks: [],
			};
			expect( isDraggingBlocks( state ) ).toBe( false );
		} );
	} );

	describe( 'getDraggedBlockClientIds', () => {
		it( 'returns the draggedBlocks state', () => {
			const draggedBlocks = [ 'block-client-id' ];
			const state = {
				draggedBlocks,
			};
			expect( getDraggedBlockClientIds( state ) ).toBe( draggedBlocks );
		} );
	} );

	describe( 'isBlockBeingDragged', () => {
		it( 'returns true if the given client id is one of the blocks being dragged', () => {
			const state = {
				draggedBlocks: [ 'block-1', 'block-2', 'block-3' ],
			};
			expect( isBlockBeingDragged( state, 'block-2' ) ).toBe( true );
		} );

		it( 'returns false if the given client id is not one of the blocks being dragged', () => {
			const state = {
				draggedBlocks: [ 'block-1', 'block-2', 'block-3' ],
			};
			expect( isBlockBeingDragged( state, 'block-4' ) ).toBe( false );
		} );

		it( 'returns false if no blocks are being dragged', () => {
			const state = {
				draggedBlocks: [],
			};
			expect( isBlockBeingDragged( state, 'block-1' ) ).toBe( false );
		} );
	} );

	describe( 'isAncestorBeingDragged', () => {
		it( 'returns true if the given client id is a child of one of the blocks being dragged', () => {
			const state = {
				draggedBlocks: [ 'block-1_grandparent' ],
				blocks: {
					parents: {
						'block-1': 'block-1_parent',
						'block-1_parent': 'block-1_grandparent',
					},
				},
			};
			expect( isAncestorBeingDragged( state, 'block-1' ) ).toBe( true );
		} );

		it( 'returns false if the given client id does not have an ancestor being dragged', () => {
			const state = {
				draggedBlocks: [ 'block-2_grandparent' ],
				blocks: {
					parents: {
						'block-1': 'block-1_parent',
						'block-1_parent': 'block-1_grandparent',
					},
				},
			};
			expect( isAncestorBeingDragged( state, 'block-1' ) ).toBe( false );
		} );

		it( 'returns false if no blocks are being dragged', () => {
			const state = {
				draggedBlocks: [],
				blocks: {
					parents: {
						'block-1': 'block-1_parent',
						'block-1_parent': 'block-1_grandparent',
					},
				},
			};
			expect( isAncestorBeingDragged( state, 'block-1' ) ).toBe( false );
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
				isSelectionEnabled: true,
			};

			expect( isSelectionEnabled( state ) ).toBe( true );
		} );

		it( 'should return false if selection is disabled', () => {
			const state = {
				isSelectionEnabled: false,
			};

			expect( isSelectionEnabled( state ) ).toBe( false );
		} );
	} );

	describe( 'getBlockInsertionPoint', () => {
		it( 'should return the explicitly assigned insertion point', () => {
			const state = {
				selection: {
					selectionStart: { clientId: 'clientId2' },
					selectionEnd: { clientId: 'clientId2' },
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
				selection: {
					selectionStart: { clientId: 'clientId1' },
					selectionEnd: { clientId: 'clientId1' },
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
				selection: {
					selectionStart: { clientId: 'clientId2' },
					selectionEnd: { clientId: 'clientId2' },
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
				selection: {
					selectionStart: { clientId: 'clientId1' },
					selectionEnd: { clientId: 'clientId2' },
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
				selection: {
					selectionStart: {},
					selectionEnd: {},
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
			expect( canInsertBlockType( state, 'core/test-block-a' ) ).toBe(
				false
			);
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
			expect( canInsertBlockType( state, 'core/test-block-a' ) ).toBe(
				true
			);
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
			expect( canInsertBlockType( state, 'core/test-block-a' ) ).toBe(
				false
			);
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
			expect( canInsertBlockType( state, 'core/test-block-c' ) ).toBe(
				false
			);
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
			expect(
				canInsertBlockType( state, 'core/test-block-c', 'block1' )
			).toBe( false );
		} );

		it( 'should allow blocks to be inserted into an allowed parent', () => {
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
					block1: {},
				},
				settings: {},
			};
			expect(
				canInsertBlockType( state, 'core/test-block-c', 'block1' )
			).toBe( true );
		} );

		it( 'should deny blocks from being inserted into a block that does not allow inner blocks', () => {
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
					block1: {},
				},
				settings: {},
			};
			expect(
				canInsertBlockType( state, 'core/test-block-c', 'block1' )
			).toBe( true );
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
			expect(
				canInsertBlockType( state, 'core/test-block-b', 'block1' )
			).toBe( false );
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
			expect(
				canInsertBlockType( state, 'core/test-block-b', 'block1' )
			).toBe( true );
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
			expect(
				canInsertBlockType( state, 'core/test-block-c', 'block1' )
			).toBe( true );
		} );

		it( 'should deny blocks that restrict parent to core/post-content when not in editor root', () => {
			const state = {
				blocks: {
					byClientId: {
						block1: { name: 'core/test-block-c' },
					},
					attributes: {
						block1: {},
					},
				},
				blockListSettings: {},
				settings: {},
			};
			expect(
				canInsertBlockType( state, 'core/post-content-child', 'block1' )
			).toBe( false );
		} );

		it( 'should allow blocks that restrict parent to core/post-content when in editor root', () => {
			const state = {
				blocks: {
					byClientId: {},
					attributes: {},
				},
				blockListSettings: {},
				settings: {},
			};
			expect(
				canInsertBlockType( state, 'core/post-content-child' )
			).toBe( true );
		} );
	} );

	describe( 'canInsertBlocks', () => {
		it( 'should allow blocks', () => {
			const state = {
				blocks: {
					byClientId: {
						1: { name: 'core/test-block-a' },
						2: { name: 'core/test-block-b' },
						3: { name: 'core/test-block-c' },
					},
					attributes: {
						1: {},
						2: {},
						3: {},
					},
				},
				blockListSettings: {
					1: {
						allowedBlocks: [
							'core/test-block-b',
							'core/test-block-c',
						],
					},
				},
				settings: {},
			};
			expect( canInsertBlocks( state, [ '2', '3' ], '1' ) ).toBe( true );
		} );

		it( 'should deny blocks', () => {
			const state = {
				blocks: {
					byClientId: {
						1: { name: 'core/test-block-a' },
						2: { name: 'core/test-block-b' },
						3: { name: 'core/test-block-c' },
					},
					attributes: {
						1: {},
						2: {},
						3: {},
					},
				},
				blockListSettings: {
					1: {
						allowedBlocks: [ 'core/test-block-c' ],
					},
				},
				settings: {},
			};
			expect( canInsertBlocks( state, [ '2', '3' ], '1' ) ).toBe( false );
		} );
	} );

	describe( 'getInserterItems', () => {
		it( 'should properly list block type and reusable block items', () => {
			const state = {
				blocks: {
					byClientId: {},
					attributes: {},
					order: {},
					parents: {},
					cache: {},
				},
				settings: {
					__experimentalReusableBlocks: [
						{
							id: 1,
							isTemporary: false,
							clientId: 'block1',
							title: { raw: 'Reusable Block 1' },
							content: { raw: '<!-- /wp:test-block-a -->' },
						},
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
			const testBlockAItem = items.find(
				( item ) => item.id === 'core/test-block-a'
			);
			expect( testBlockAItem ).toEqual( {
				id: 'core/test-block-a',
				name: 'core/test-block-a',
				initialAttributes: {},
				title: 'Test Block A',
				icon: {
					src: 'test',
				},
				category: 'design',
				keywords: [ 'testing' ],
				variations: [],
				isDisabled: false,
				utility: 1,
				frecency: 0,
			} );
			const reusableBlockItem = items.find(
				( item ) => item.id === 'core/block/1'
			);
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
				utility: 1,
				frecency: 0,
			} );
		} );

		it( 'should correctly cache the return values', () => {
			const state = {
				blocks: {
					byClientId: {
						block3: { name: 'core/test-block-a' },
						block4: { name: 'core/test-block-a' },
					},
					attributes: {
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
						block3: {},
						block4: {},
					},
					controlledInnerBlocks: {},
				},
				settings: {
					__experimentalReusableBlocks: [
						{
							id: 1,
							isTemporary: false,
							clientId: 'block1',
							title: { raw: 'Reusable Block 1' },
							content: { raw: '<!-- /wp:test-block-a -->' },
						},
						{
							id: 2,
							isTemporary: false,
							clientId: 'block2',
							title: { raw: 'Reusable Block 2' },
							content: { raw: '<!-- /wp:test-block-b -->' },
						},
					],
				},
				preferences: {
					insertUsage: {},
				},
				blockListSettings: {
					block3: {},
					block4: {},
				},
			};

			const stateSecondBlockRestricted = {
				...state,
				blockListSettings: {
					...state.blockListSettings,
					block4: {
						allowedBlocks: [ 'core/test-block-b' ],
					},
				},
			};

			const firstBlockFirstCall = getInserterItems( state, 'block3' );
			const firstBlockSecondCall = getInserterItems(
				stateSecondBlockRestricted,
				'block3'
			);
			expect( firstBlockFirstCall ).toBe( firstBlockSecondCall );
			expect( firstBlockFirstCall.map( ( item ) => item.id ) ).toEqual( [
				'core/test-block-a',
				'core/test-block-b',
				'core/test-freeform',
				'core/block/1',
				'core/block/2',
			] );

			const secondBlockFirstCall = getInserterItems( state, 'block4' );
			const secondBlockSecondCall = getInserterItems(
				stateSecondBlockRestricted,
				'block4'
			);
			expect( secondBlockFirstCall ).not.toBe( secondBlockSecondCall );
			expect( secondBlockFirstCall.map( ( item ) => item.id ) ).toEqual( [
				'core/test-block-a',
				'core/test-block-b',
				'core/test-freeform',
				'core/block/1',
				'core/block/2',
			] );
			expect(
				secondBlockSecondCall.map( ( item ) => item.id )
			).toEqual( [ 'core/test-block-b' ] );
		} );

		it( 'should set isDisabled when a block with `multiple: false` has been used', () => {
			const state = {
				blocks: {
					byClientId: {
						block1: {
							clientId: 'block1',
							name: 'core/test-block-b',
						},
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
					controlledInnerBlocks: {},
				},
				preferences: {
					insertUsage: {},
				},
				blockListSettings: {},
				settings: {},
			};
			const items = getInserterItems( state );
			const testBlockBItem = items.find(
				( item ) => item.id === 'core/test-block-b'
			);
			expect( testBlockBItem.isDisabled ).toBe( true );
		} );

		it( 'should set a frecency', () => {
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
			const reusableBlock2Item = items.find(
				( item ) => item.id === 'core/test-block-b'
			);
			expect( reusableBlock2Item.frecency ).toBe( 2.5 );
		} );
	} );

	describe( 'getBlockTransformItems', () => {
		beforeAll( () => {
			registerBlockType( 'core/with-tranforms-a', {
				category: 'text',
				title: 'Tranforms a',
				edit: () => {},
				save: () => {},
				transforms: {
					to: [
						{
							type: 'block',
							blocks: [ 'core/with-tranforms-b' ],
							transform: () => {},
						},
						{
							type: 'block',
							blocks: [ 'core/with-tranforms-c' ],
							transform: () => {},
						},
						{
							type: 'block',
							blocks: [
								'core/with-tranforms-b',
								'core/with-tranforms-c',
							],
							transform: () => {},
							isMultiBlock: true,
						},
					],
				},
			} );
			registerBlockType( 'core/with-tranforms-b', {
				category: 'text',
				title: 'Tranforms b',
				edit: () => {},
				save: () => {},
				transforms: {
					to: [
						{
							type: 'block',
							blocks: [ 'core/with-tranforms-a' ],
							transform: () => {},
						},
					],
				},
			} );
			registerBlockType( 'core/with-tranforms-c', {
				category: 'text',
				title: 'Tranforms c',
				edit: () => {},
				save: () => {},
				transforms: {
					to: [
						{
							type: 'block',
							blocks: [ 'core/with-tranforms-a' ],
							transform: () => {},
						},
					],
				},
				supports: { multiple: false },
			} );
		} );
		afterAll( () => {
			[
				'core/with-tranforms-a',
				'core/with-tranforms-b',
				'core/with-tranforms-c',
			].forEach( unregisterBlockType );
		} );
		it( 'should properly return block type items', () => {
			const state = {
				blocks: {
					byClientId: {},
					attributes: {},
					order: {},
					parents: {},
					cache: {},
				},
				settings: {},
				preferences: {},
				blockListSettings: {},
			};
			const blocks = [ { name: 'core/with-tranforms-a' } ];
			const items = getBlockTransformItems( state, blocks );
			expect( items ).toHaveLength( 2 );
			const returnedProps = Object.keys( items[ 0 ] );
			// Verify we have only the wanted props.
			expect( returnedProps ).toHaveLength( 6 );
			expect( returnedProps ).toEqual(
				expect.arrayContaining( [
					'id',
					'name',
					'title',
					'icon',
					'frecency',
					'isDisabled',
				] )
			);
			expect( items ).toEqual(
				expect.arrayContaining( [
					expect.objectContaining( {
						name: 'core/with-tranforms-b',
					} ),
					expect.objectContaining( {
						name: 'core/with-tranforms-c',
					} ),
				] )
			);
		} );
		it( 'should return only eligible blocks for transformation - `allowedBlocks`', () => {
			const state = {
				blocks: {
					byClientId: {
						block1: { name: 'core/with-tranforms-b' },
						block2: { name: 'core/with-tranforms-a' },
					},
					attributes: {
						block1: {},
						block2: {},
					},
					order: {},
					parents: {
						block1: '',
						block2: 'block1',
					},
					cache: {},
					controlledInnerBlocks: {},
				},
				settings: {},
				preferences: {},
				blockListSettings: {
					block1: {
						allowedBlocks: [ 'core/with-tranforms-c' ],
					},
					block2: {},
				},
			};
			const blocks = [
				{ clientId: 'block2', name: 'core/with-tranforms-a' },
			];
			const items = getBlockTransformItems( state, blocks, 'block1' );
			expect( items ).toHaveLength( 1 );
			expect( items[ 0 ].name ).toEqual( 'core/with-tranforms-c' );
		} );
		it( 'should take into account the usage of blocks settings `multiple` - if multiple blocks of the same type are allowed', () => {
			const state = {
				blocks: {
					byClientId: {
						block1: {
							clientId: 'block1',
							name: 'core/with-tranforms-c',
						},
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
					controlledInnerBlocks: {},
				},
				preferences: {
					insertUsage: {},
				},
				blockListSettings: {},
				settings: {},
			};
			const blocks = [ { name: 'core/with-tranforms-a' } ];
			const items = getBlockTransformItems( state, blocks );
			expect( items ).toHaveLength( 2 );
			expect( items ).toEqual(
				expect.arrayContaining( [
					expect.objectContaining( {
						name: 'core/with-tranforms-b',
						isDisabled: false,
					} ),
					expect.objectContaining( {
						name: 'core/with-tranforms-c',
						isDisabled: true,
					} ),
				] )
			);
		} );
		it( 'should set frecency', () => {
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
						'core/with-tranforms-a': { count: 10, time: 1000 },
					},
				},
				blockListSettings: {},
				settings: {},
			};
			const blocks = [ { name: 'core/with-tranforms-c' } ];
			const items = getBlockTransformItems( state, blocks );
			expect( items ).toHaveLength( 1 );
			expect( items[ 0 ] ).toEqual(
				expect.objectContaining( {
					name: 'core/with-tranforms-a',
					frecency: 2.5,
				} )
			);
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

		it( 'should return null if the specified clientId was not found', () => {
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

			expect( getBlockListSettings( state, 'chicken' ) ).toBe(
				undefined
			);
		} );
	} );

	describe( '__experimentalGetBlockListSettingsForBlocks', () => {
		it( 'should return the settings for a set of blocks', () => {
			const state = {
				blockListSettings: {
					'test-1-dummy-clientId': {
						setting1: false,
					},
					'test-2-dummy-clientId': {
						setting1: true,
						setting2: false,
					},
					'test-3-dummy-clientId': {
						setting1: true,
						setting2: false,
					},
					'test-4-dummy-clientId': {
						setting1: true,
					},
				},
			};

			const targetBlocksClientIds = [
				'test-1-dummy-clientId',
				'test-3-dummy-clientId',
			];

			expect(
				__experimentalGetBlockListSettingsForBlocks(
					state,
					targetBlocksClientIds
				)
			).toEqual( {
				'test-1-dummy-clientId': {
					setting1: false,
				},
				'test-3-dummy-clientId': {
					setting1: true,
					setting2: false,
				},
			} );
		} );

		it( 'should return empty object if settings for the blocks don’t exist', () => {
			// Does not include target Block clientIds
			const state = {
				blockListSettings: {
					'test-2-dummy-clientId': {
						setting1: true,
						setting2: false,
					},
					'test-4-dummy-clientId': {
						setting1: true,
					},
				},
			};

			const targetBlocksClientIds = [
				'test-1-dummy-clientId',
				'test-3-dummy-clientId',
			];

			expect(
				__experimentalGetBlockListSettingsForBlocks(
					state,
					targetBlocksClientIds
				)
			).toEqual( {} );
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

	describe( 'getLowestCommonAncestorWithSelectedBlock', () => {
		const blocks = {
			order: {
				'': [ 'a', 'b' ],
				a: [ 'c', 'd' ],
				d: [ 'e' ],
				b: [ 'f' ],
			},
			parents: {
				a: '',
				b: '',
				c: 'a',
				d: 'a',
				e: 'd',
				f: 'b',
			},
		};

		it( 'should not be defined if there is no block selected', () => {
			const state = {
				blocks,
				selection: {
					selectionStart: {},
					selectionEnd: {},
				},
			};

			expect(
				getLowestCommonAncestorWithSelectedBlock( state, 'd' )
			).not.toBeDefined();
		} );

		it( 'should not be defined if selected block has no parent', () => {
			const state = {
				blocks,
				selection: {
					selectionStart: { clientId: 'b' },
					selectionEnd: { clientId: 'b' },
				},
			};

			expect(
				getLowestCommonAncestorWithSelectedBlock( state, 'b' )
			).toBe( 'b' );
		} );

		it( 'should not be defined if selected block has no common parent with given block', () => {
			const state = {
				blocks,
				selection: {
					selectionStart: { clientId: 'd' },
					selectionEnd: { clientId: 'd' },
				},
			};

			expect(
				getLowestCommonAncestorWithSelectedBlock( state, 'f' )
			).not.toBeDefined();
		} );

		it( 'should return block id if selected block is ancestor of given block', () => {
			const state = {
				blocks,
				selection: {
					selectionStart: { clientId: 'c' },
					selectionEnd: { clientId: 'c' },
				},
			};

			expect(
				getLowestCommonAncestorWithSelectedBlock( state, 'a' )
			).toBe( 'a' );
		} );

		it( 'should return block id if selected block is nested child of given block', () => {
			const state = {
				blocks,
				selection: {
					selectionStart: { clientId: 'e' },
					selectionEnd: { clientId: 'e' },
				},
			};

			expect(
				getLowestCommonAncestorWithSelectedBlock( state, 'a' )
			).toBe( 'a' );
		} );

		it( 'should return block id if selected block has common parent with given block', () => {
			const state = {
				blocks,
				selection: {
					selectionStart: { clientId: 'e' },
					selectionEnd: { clientId: 'e' },
				},
			};

			expect(
				getLowestCommonAncestorWithSelectedBlock( state, 'c' )
			).toBe( 'a' );
		} );
	} );

	describe( 'getActiveBlockIdByBlockName', () => {
		const state = {
			selection: {
				selectionStart: {
					clientId: 'client-id-04',
				},
				selectionEnd: {
					clientId: 'client-id-04',
				},
			},
			blocks: {
				parents: {
					'client-id-01': '',
					'client-id-02': 'client-id-01',
					'client-id-03': 'client-id-02',
					'client-id-04': 'client-id-03',
					'client-id-05': 'client-id-03',
				},
				byClientId: {
					'client-id-01': {
						clientId: 'client-id-01',
						name: 'core/columns',
					},
					'client-id-02': {
						clientId: 'client-id-02',
						name: 'core/navigation',
					},
					'client-id-03': {
						clientId: 'client-id-03',
						name: 'core/navigation-link',
					},
					'client-id-04': {
						clientId: 'client-id-04',
						name: 'core/navigation-link',
					},
					'client-id-05': {
						clientId: 'client-id-05',
						name: 'core/navigation-link',
					},
				},
				cache: {
					'client-id-01': {},
					'client-id-02': {},
					'client-id-03': {},
					'client-id-04': {},
					'client-id-05': {},
				},
				order: {
					'client-id-03': [ 'client-id-04', 'client-id-05' ],
				},
				controlledInnerBlocks: {},
			},
		};
		it( 'Should return first active matching block (including self) when single block selected', () => {
			expect(
				getActiveBlockIdByBlockNames( state, [
					'core/navigation-link',
				] )
			).toEqual( 'client-id-04' );

			expect(
				getActiveBlockIdByBlockNames( state, [
					'core/columns',
					'core/navigation',
				] )
			).toEqual( 'client-id-02' );
		} );
		it( 'Should return first active matching block with (excluding self) when multi selected', () => {
			state.selection.selectionEnd.clientId = 'client-id-05';

			expect(
				getActiveBlockIdByBlockNames( state, [
					'core/navigation-link',
				] )
			).toEqual( 'client-id-03' );
		} );
	} );

	describe( '__experimentalGetAllowedPatterns', () => {
		const state = {
			blocks: {
				byClientId: {
					block1: { name: 'core/test-block-a' },
					block2: { name: 'core/test-block-b' },
				},
				attributes: {
					block1: {},
					block2: {},
				},
			},
			blockListSettings: {
				block1: {
					allowedBlocks: [ 'core/test-block-b' ],
				},
				block2: {
					allowedBlocks: [],
				},
			},
			settings: {
				__experimentalBlockPatterns: [
					{
						name: 'pattern-a',
						title: 'pattern with a',
						content: `<!-- wp:test-block-a --><!-- /wp:test-block-a -->`,
					},
					{
						name: 'pattern-b',
						title: 'pattern with b',
						content:
							'<!-- wp:test-block-b --><!-- /wp:test-block-b -->',
					},
				],
			},
		};

		it( 'should return all patterns for root level', () => {
			expect(
				__experimentalGetAllowedPatterns( state, null )
			).toHaveLength( 2 );
		} );

		it( 'should return patterns that consists of blocks allowed for the specified client ID', () => {
			expect(
				__experimentalGetAllowedPatterns( state, 'block1' )
			).toHaveLength( 1 );

			expect(
				__experimentalGetAllowedPatterns( state, 'block2' )
			).toHaveLength( 0 );
		} );
	} );
	describe( '__experimentalGetPatternsByBlockTypes', () => {
		const state = {
			blocks: {
				byClientId: {
					block1: { name: 'core/test-block-a' },
				},
			},
			blockListSettings: {
				block1: {
					allowedBlocks: [ 'core/test-block-b' ],
				},
			},
			settings: {
				__experimentalBlockPatterns: [
					{
						name: 'pattern-a',
						blockTypes: [ 'test/block-a' ],
						title: 'pattern a',
						content:
							'<!-- wp:test-block-a --><!-- /wp:test-block-a -->',
					},
					{
						name: 'pattern-b',
						blockTypes: [ 'test/block-b' ],
						title: 'pattern b',
						content:
							'<!-- wp:test-block-b --><!-- /wp:test-block-b -->',
					},
					{
						title: 'pattern c',
						blockTypes: [ 'test/block-a' ],
						content:
							'<!-- wp:test-block-b --><!-- /wp:test-block-b -->',
					},
				],
			},
		};
		it( 'should return empty array if no block name is provided', () => {
			expect( __experimentalGetPatternsByBlockTypes( state ) ).toEqual(
				[]
			);
		} );
		it( 'shoud return empty array if no match is found', () => {
			const patterns = __experimentalGetPatternsByBlockTypes(
				state,
				'test/block-not-exists'
			);
			expect( patterns ).toEqual( [] );
		} );
		it( 'should return proper results when there are matched block patterns', () => {
			const patterns = __experimentalGetPatternsByBlockTypes(
				state,
				'test/block-a'
			);
			expect( patterns ).toHaveLength( 2 );
			expect( patterns ).toEqual(
				expect.arrayContaining( [
					expect.objectContaining( { title: 'pattern a' } ),
					expect.objectContaining( { title: 'pattern c' } ),
				] )
			);
		} );
		it( 'should return proper result with matched patterns and allowed blocks from rootClientId', () => {
			const patterns = __experimentalGetPatternsByBlockTypes(
				state,
				'test/block-a',
				'block1'
			);
			expect( patterns ).toHaveLength( 1 );
			expect( patterns[ 0 ] ).toEqual(
				expect.objectContaining( { title: 'pattern c' } )
			);
		} );
	} );

	describe( 'wasBlockJustInserted', () => {
		it( 'should return true if the client id passed to wasBlockJustInserted is found within the state', () => {
			const expectedClientId = '62bfef6e-d5e9-43ba-b7f9-c77cf354141f';
			const source = 'inserter_menu';

			const state = {
				lastBlockInserted: {
					clientId: expectedClientId,
					source,
				},
			};

			expect(
				wasBlockJustInserted( state, expectedClientId, source )
			).toBe( true );
		} );

		it( 'should return false if the client id passed to wasBlockJustInserted is not found within the state', () => {
			const expectedClientId = '62bfef6e-d5e9-43ba-b7f9-c77cf354141f';
			const unexpectedClientId = '62bfsed4-d5e9-43ba-b7f9-c77cf565756s';
			const source = 'inserter_menu';

			const state = {
				lastBlockInserted: {
					clientId: unexpectedClientId,
					source,
				},
			};

			expect(
				wasBlockJustInserted( state, expectedClientId, source )
			).toBe( false );
		} );

		it( 'should return false if the source passed to wasBlockJustInserted is not found within the state', () => {
			const clientId = '62bfef6e-d5e9-43ba-b7f9-c77cf354141f';
			const expectedSource = 'inserter_menu';

			const state = {
				lastBlockInserted: {
					clientId,
				},
			};

			expect(
				wasBlockJustInserted( state, clientId, expectedSource )
			).toBe( false );
		} );
	} );
} );

describe( '__experimentalGetParsedReusableBlock', () => {
	const state = {
		settings: {
			__experimentalReusableBlocks: [
				{
					id: 1,
					content: { raw: '' },
				},
			],
		},
	};

	// Regression test for https://github.com/WordPress/gutenberg/issues/26485. See https://github.com/WordPress/gutenberg/issues/26548.
	it( "Should return an empty array if reusable block's content.raw is an empty string", () => {
		expect( __experimentalGetParsedReusableBlock( state, 1 ) ).toEqual(
			[]
		);
	} );
} );

describe( 'getInserterItems with core blocks prioritization', () => {
	// This test is in a seperate `describe` because all other tests register
	// some test `core` blocks and interfere with the purpose of the specific test.
	// This tests the functionality to ensure core blocks are prioritized in the
	// returned results, because third party blocks can be registered earlier than
	// the core blocks (usually by using the `init` action), thus affecting the display order.
	beforeEach( () => {
		registerBlockType( 'plugin/block-a', {
			save() {},
			category: 'text',
			title: 'Plugin Block A',
			icon: 'test',
		} );
		registerBlockType( 'another-plugin/block-b', {
			save() {},
			category: 'text',
			title: 'Another Plugin Block B',
			icon: 'test',
		} );
		registerBlockType( 'core/block', {
			save() {},
			category: 'text',
			title: 'Core Block A',
		} );
		registerBlockType( 'core/test-block-a', {
			save: ( props ) => props.attributes.text,
			category: 'design',
			title: 'Core Block B',
			icon: 'test',
			keywords: [ 'testing' ],
		} );
	} );
	afterEach( () => {
		[
			'plugin/block-a',
			'another-plugin/block-b',
			'core/block',
			'core/test-block-a',
		].forEach( unregisterBlockType );
	} );
	it( 'should prioritize core blocks by sorting them at the top of the returned list', () => {
		const state = {
			blocks: {
				byClientId: {},
				attributes: {},
				order: {},
				parents: {},
				cache: {},
			},
			settings: {},
			preferences: {},
			blockListSettings: {},
		};
		const items = getInserterItems( state );
		const expectedResult = [
			'core/block',
			'core/test-block-a',
			'plugin/block-a',
			'another-plugin/block-b',
		];
		expect( items.map( ( { name } ) => name ) ).toEqual( expectedResult );
	} );
} );

describe( '__unstableGetClientIdWithClientIdsTree', () => {
	it( "should return a stripped down block object containing only its client ID and its inner blocks' client IDs", () => {
		const state = {
			blocks: {
				order: {
					'': [ 'foo' ],
					foo: [ 'bar', 'baz' ],
					bar: [ 'qux' ],
				},
			},
		};

		expect(
			__unstableGetClientIdWithClientIdsTree( state, 'foo' )
		).toEqual( {
			clientId: 'foo',
			innerBlocks: [
				{
					clientId: 'bar',
					innerBlocks: [ { clientId: 'qux', innerBlocks: [] } ],
				},
				{ clientId: 'baz', innerBlocks: [] },
			],
		} );
	} );
} );
describe( '__unstableGetClientIdsTree', () => {
	it( "should return the full content tree starting from the given root, consisting of stripped down block object containing only its client ID and its inner blocks' client IDs", () => {
		const state = {
			blocks: {
				order: {
					'': [ 'foo' ],
					foo: [ 'bar', 'baz' ],
					bar: [ 'qux' ],
				},
			},
		};

		expect( __unstableGetClientIdsTree( state, 'foo' ) ).toEqual( [
			{
				clientId: 'bar',
				innerBlocks: [ { clientId: 'qux', innerBlocks: [] } ],
			},
			{ clientId: 'baz', innerBlocks: [] },
		] );
	} );

	it( "should return the full content tree starting from the root, consisting of stripped down block object containing only its client ID and its inner blocks' client IDs", () => {
		const state = {
			blocks: {
				order: {
					'': [ 'foo' ],
					foo: [ 'bar', 'baz' ],
					bar: [ 'qux' ],
				},
			},
		};

		expect( __unstableGetClientIdsTree( state ) ).toEqual( [
			{
				clientId: 'foo',
				innerBlocks: [
					{
						clientId: 'bar',
						innerBlocks: [ { clientId: 'qux', innerBlocks: [] } ],
					},
					{ clientId: 'baz', innerBlocks: [] },
				],
			},
		] );
	} );
} );
