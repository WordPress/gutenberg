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
	__experimentalGetAllowedPatterns,
	__experimentalGetParsedPattern,
	getPatternsByBlockTypes,
	__unstableGetClientIdWithClientIdsTree,
	__unstableGetClientIdsTree,
	__experimentalGetPatternTransformItems,
	wasBlockJustInserted,
	__experimentalGetGlobalBlocksByName,
} = selectors;

describe( 'selectors', () => {
	let cachedSelectors;

	beforeAll( () => {
		cachedSelectors = Object.entries( selectors )
			.filter( ( [ , selector ] ) => selector.clear )
			.map( ( [ , selector ] ) => selector );
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

		registerBlockType( 'core/test-block-ancestor', {
			save: ( props ) => props.attributes.text,
			category: 'text',
			title: 'Test Block required as ancestor',
			icon: 'test',
			keywords: [ 'testing' ],
		} );

		registerBlockType( 'core/test-block-parent', {
			save: ( props ) => props.attributes.text,
			category: 'text',
			title: 'Test Block required as parent',
			icon: 'test',
			keywords: [ 'testing' ],
		} );

		registerBlockType( 'core/test-block-requires-ancestor', {
			save: ( props ) => props.attributes.text,
			category: 'text',
			title: 'Test Block that requires ancestor',
			icon: 'test',
			keywords: [ 'testing' ],
			ancestor: [ 'core/test-block-ancestor' ],
		} );

		registerBlockType( 'core/test-block-requires-ancestor-parent', {
			save: ( props ) => props.attributes.text,
			category: 'text',
			title: 'Test Block that requires both ancestor and parent',
			icon: 'test',
			keywords: [ 'testing' ],
			parent: [ 'core/test-block-parent' ],
			ancestor: [ 'core/test-block-ancestor' ],
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
		unregisterBlockType( 'core/test-block-ancestor' );
		unregisterBlockType( 'core/test-block-parent' );
		unregisterBlockType( 'core/test-block-requires-ancestor' );
		unregisterBlockType( 'core/test-block-requires-ancestor-parent' );

		setFreeformContentHandlerName( undefined );
	} );

	describe( 'getBlockName', () => {
		it( 'returns null if no block by clientId', () => {
			const state = {
				blocks: {
					byClientId: new Map(),
					attributes: {},
					order: new Map(),
					parents: new Map(),
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
					byClientId: new Map(
						Object.entries( {
							'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1': {
								clientId:
									'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1',
								name: 'core/paragraph',
							},
						} )
					),
					attributes: new Map(
						Object.entries( {
							'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1': {},
						} )
					),
					order: new Map(
						Object.entries( {
							'': [ 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1' ],
							'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1': [],
						} )
					),
					parents: new Map(
						Object.entries( {
							'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1': '',
						} )
					),
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
					byClientId: new Map(
						Object.entries( {
							123: { clientId: '123', name: 'core/paragraph' },
						} )
					),
					attributes: new Map(
						Object.entries( {
							123: {},
						} )
					),
					order: new Map(
						Object.entries( {
							'': [ '123' ],
							123: [],
						} )
					),
					parents: new Map(
						Object.entries( {
							123: '',
						} )
					),
					tree: new Map(
						Object.entries( {
							123: {
								clientId: '123',
								name: 'core/paragraph',
								attributes: {},
								innerBlocks: [],
							},
						} )
					),
					controlledInnerBlocks: {},
				},
			};

			expect( getBlock( state, '123' ) ).toBe(
				state.blocks.tree.get( '123' )
			);
		} );

		it( 'should return null if the block is not present in state', () => {
			const state = {
				blocks: {
					byClientId: new Map(),
					attributes: new Map(),
					order: new Map(),
					parents: new Map(),
					tree: new Map(
						Object.entries( {
							123: {
								clientId: '123',
								name: 'core/paragraph',
								attributes: {},
								innerBlocks: [],
							},
						} )
					),
					controlledInnerBlocks: {},
				},
			};

			expect( getBlock( state, '123' ) ).toBe( null );
		} );
	} );

	describe( 'getBlocks', () => {
		it( 'should return the ordered blocks', () => {
			const state = {
				blocks: {
					byClientId: new Map(
						Object.entries( {
							23: { clientId: '23', name: 'core/heading' },
							123: { clientId: '123', name: 'core/paragraph' },
						} )
					),
					attributes: new Map(
						Object.entries( {
							23: {},
							123: {},
						} )
					),
					order: new Map(
						Object.entries( {
							'': [ '123', '23' ],
						} )
					),
					parents: new Map(
						Object.entries( {
							123: '',
							23: '',
						} )
					),
					tree: new Map(
						Object.entries( {
							'': {
								innerBlocks: [
									{
										clientId: '123',
										name: 'core/paragraph',
										attributes: {},
										innerBlocks: [],
									},
									{
										clientId: '23',
										name: 'core/heading',
										attributes: {},
										innerBlocks: [],
									},
								],
							},
							123: {},
							23: {},
						} )
					),
					controlledInnerBlocks: {},
				},
			};

			expect( getBlocks( state ) ).toBe(
				state.blocks.tree.get( '' ).innerBlocks
			);
		} );
	} );

	describe( 'getBlockParents', () => {
		it( 'should return parent blocks', () => {
			const state = {
				blocks: {
					parents: new Map(
						Object.entries( {
							'client-id-01': '',
							'client-id-02': 'client-id-01',
							'client-id-03': 'client-id-02',
							'client-id-04': 'client-id-03',
						} )
					),
					byClientId: new Map(
						Object.entries( {
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
						} )
					),
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
				parents: new Map(
					Object.entries( {
						'client-id-01': '',
						'client-id-02': 'client-id-01',
						'client-id-03': 'client-id-02',
						'client-id-04': 'client-id-03',
						'client-id-05': 'client-id-04',
					} )
				),
				byClientId: new Map(
					Object.entries( {
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
					} )
				),
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
		it( 'should return the ids of any descendants in sequential order, given an array of clientIds', () => {
			const state = {
				blocks: {
					byClientId: new Map(
						Object.entries( {
							'uuid-2': {
								clientId: 'uuid-2',
								name: 'core/image',
							},
							'uuid-4': {
								clientId: 'uuid-4',
								name: 'core/paragraph',
							},
							'uuid-6': {
								clientId: 'uuid-6',
								name: 'core/paragraph',
							},
							'uuid-8': {
								clientId: 'uuid-8',
								name: 'core/block',
							},
							'uuid-10': {
								clientId: 'uuid-10',
								name: 'core/columns',
							},
							'uuid-12': {
								clientId: 'uuid-12',
								name: 'core/column',
							},
							'uuid-14': {
								clientId: 'uuid-14',
								name: 'core/column',
							},
							'uuid-16': {
								clientId: 'uuid-16',
								name: 'core/quote',
							},
							'uuid-18': {
								clientId: 'uuid-18',
								name: 'core/block',
							},
							'uuid-20': {
								clientId: 'uuid-20',
								name: 'core/gallery',
							},
							'uuid-22': {
								clientId: 'uuid-22',
								name: 'core/block',
							},
							'uuid-24': {
								clientId: 'uuid-24',
								name: 'core/columns',
							},
							'uuid-26': {
								clientId: 'uuid-26',
								name: 'core/column',
							},
							'uuid-28': {
								clientId: 'uuid-28',
								name: 'core/column',
							},
							'uuid-30': {
								clientId: 'uuid-30',
								name: 'core/paragraph',
							},
						} )
					),
					attributes: new Map(
						Object.entries( {
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
						} )
					),
					order: new Map(
						Object.entries( {
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
						} )
					),
					parents: new Map(
						Object.entries( {
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
						} )
					),
					controlledInnerBlocks: {},
				},
			};
			expect( getClientIdsOfDescendants( state, [ 'uuid-10' ] ) ).toEqual(
				[
					'uuid-12',
					'uuid-16',
					'uuid-14',
					'uuid-18',
					'uuid-24',
					'uuid-26',
					'uuid-28',
					'uuid-30',
				]
			);
		} );
	} );

	describe( 'getClientIdsWithDescendants', () => {
		it( 'should return the ids for top-level blocks and their descendants of any depth (for nested blocks) in sequential order.', () => {
			const state = {
				blocks: {
					byClientId: new Map(
						Object.entries( {
							'uuid-2': {
								clientId: 'uuid-2',
								name: 'core/image',
							},
							'uuid-4': {
								clientId: 'uuid-4',
								name: 'core/paragraph',
							},
							'uuid-6': {
								clientId: 'uuid-6',
								name: 'core/paragraph',
							},
							'uuid-8': {
								clientId: 'uuid-8',
								name: 'core/block',
							},
							'uuid-10': {
								clientId: 'uuid-10',
								name: 'core/columns',
							},
							'uuid-12': {
								clientId: 'uuid-12',
								name: 'core/column',
							},
							'uuid-14': {
								clientId: 'uuid-14',
								name: 'core/column',
							},
							'uuid-16': {
								clientId: 'uuid-16',
								name: 'core/quote',
							},
							'uuid-18': {
								clientId: 'uuid-18',
								name: 'core/block',
							},
							'uuid-20': {
								clientId: 'uuid-20',
								name: 'core/gallery',
							},
							'uuid-22': {
								clientId: 'uuid-22',
								name: 'core/block',
							},
							'uuid-24': {
								clientId: 'uuid-24',
								name: 'core/columns',
							},
							'uuid-26': {
								clientId: 'uuid-26',
								name: 'core/column',
							},
							'uuid-28': {
								clientId: 'uuid-28',
								name: 'core/column',
							},
							'uuid-30': {
								clientId: 'uuid-30',
								name: 'core/paragraph',
							},
						} )
					),
					attributes: new Map(
						Object.entries( {
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
						} )
					),
					order: new Map(
						Object.entries( {
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
						} )
					),
					parents: new Map(
						Object.entries( {
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
						} )
					),
				},
			};
			expect( getClientIdsWithDescendants( state ) ).toEqual( [
				'uuid-6',
				'uuid-8',
				'uuid-10',
				'uuid-12',
				'uuid-16',
				'uuid-14',
				'uuid-18',
				'uuid-24',
				'uuid-26',
				'uuid-28',
				'uuid-30',
				'uuid-22',
			] );
		} );
	} );

	describe( 'getBlockCount', () => {
		it( 'should return the number of top-level blocks in the post', () => {
			const state = {
				blocks: {
					byClientId: new Map(
						Object.entries( {
							23: { clientId: '23', name: 'core/heading' },
							123: { clientId: '123', name: 'core/paragraph' },
						} )
					),
					attributes: new Map(
						Object.entries( {
							23: {},
							123: {},
						} )
					),
					order: new Map(
						Object.entries( {
							'': [ '123', '23' ],
						} )
					),
				},
			};

			expect( getBlockCount( state ) ).toBe( 2 );
		} );

		it( 'should return the number of blocks in a nested context', () => {
			const state = {
				blocks: {
					byClientId: new Map(
						Object.entries( {
							123: { clientId: '123', name: 'core/columns' },
							456: { clientId: '456', name: 'core/paragraph' },
							789: { clientId: '789', name: 'core/paragraph' },
						} )
					),
					attributes: new Map(
						Object.entries( {
							123: {},
							456: {},
							789: {},
						} )
					),
					order: new Map(
						Object.entries( {
							'': [ '123' ],
							123: [ '456', '789' ],
						} )
					),
					parents: new Map(
						Object.entries( {
							123: '',
							456: '123',
							789: '123',
						} )
					),
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
				byClientId: new Map(
					Object.entries( {
						123: { clientId: '123', name: 'core/heading' },
						456: { clientId: '456', name: 'core/paragraph' },
						789: { clientId: '789', name: 'core/paragraph' },
					} )
				),
				attributes: new Map(
					Object.entries( {
						123: {},
						456: {},
						789: {},
					} )
				),
				order: new Map(
					Object.entries( {
						'': [ '123', '456' ],
					} )
				),
				parents: new Map(
					Object.entries( {
						123: '',
						456: '',
					} )
				),
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
					byClientId: new Map(),
					attributes: new Map(),
					order: new Map(),
					parents: new Map(),
				},
			};
			expect( getGlobalBlockCount( emptyState ) ).toBe( 0 );
			expect( getGlobalBlockCount( emptyState, 'core/heading' ) ).toBe(
				0
			);
		} );
	} );

	describe( '__experimentalGetGlobalBlocksByName', () => {
		const state = {
			blocks: {
				byClientId: new Map(
					Object.entries( {
						123: { clientId: '123', name: 'core/heading' },
						456: { clientId: '456', name: 'core/paragraph' },
						789: { clientId: '789', name: 'core/paragraph' },
						1011: { clientId: '1011', name: 'core/group' },
						1213: { clientId: '1213', name: 'core/paragraph' },
						1415: { clientId: '1213', name: 'core/paragraph' },
					} )
				),
				attributes: new Map(
					Object.entries( {
						123: {},
						456: {},
						789: {},
						1011: {},
						1213: {},
						1415: {},
					} )
				),
				order: new Map(
					Object.entries( {
						'': [ '123', '456', '1011' ],
						1011: [ '1415', '1213' ],
					} )
				),
				parents: new Map(
					Object.entries( {
						123: '',
						456: '',
						1011: '',
						1213: '1011',
						1415: '1011',
					} )
				),
			},
		};

		it( 'should return the clientIds of blocks of a given type', () => {
			expect(
				__experimentalGetGlobalBlocksByName( state, 'core/heading' )
			).toStrictEqual( [ '123' ] );
		} );

		it( 'should return the clientIds of blocks of a given type even if blocks are nested', () => {
			expect(
				__experimentalGetGlobalBlocksByName( state, 'core/paragraph' )
			).toStrictEqual( [ '456', '1415', '1213' ] );
		} );

		it( 'Should return empty array if no blocks match. The empty array should be the same reference', () => {
			const result = __experimentalGetGlobalBlocksByName(
				state,
				'test/missing'
			);
			expect(
				__experimentalGetGlobalBlocksByName( state, 'test/missing' )
			).toStrictEqual( [] );
			expect(
				__experimentalGetGlobalBlocksByName(
					state,
					'test/missing2'
				) === result
			).toBe( true );
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
					selectionStart: { clientId: '23' },
					selectionEnd: { clientId: '123' },
				},
			};

			expect( getSelectedBlockClientId( state ) ).toBe( null );
		} );

		it( 'should return the selected block ClientId', () => {
			const state = {
				blocks: {
					byClientId: new Map(
						Object.entries( {
							23: {
								name: 'fake block',
							},
						} )
					),
				},
				selection: {
					selectionStart: { clientId: '23' },
					selectionEnd: { clientId: '23' },
				},
			};

			expect( getSelectedBlockClientId( state ) ).toEqual( '23' );
		} );
	} );

	describe( 'getSelectedBlock', () => {
		it( 'should return null if no block is selected', () => {
			const state = {
				blocks: {
					byClientId: new Map(
						Object.entries( {
							23: { clientId: '23', name: 'core/heading' },
							123: { clientId: '123', name: 'core/paragraph' },
						} )
					),
					attributes: new Map(
						Object.entries( {
							23: {},
							123: {},
						} )
					),
					order: new Map(
						Object.entries( {
							'': [ '23', '123' ],
							23: [],
							123: [],
						} )
					),
					parents: new Map(
						Object.entries( {
							23: '',
							123: '',
						} )
					),
					tree: new Map(
						Object.entries( {
							23: {
								clientId: '23',
								name: 'core/heading',
								attributes: {},
								innerBlocks: [],
							},
						} )
					),
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
					byClientId: new Map(
						Object.entries( {
							23: { clientId: '23', name: 'core/heading' },
							123: { clientId: '123', name: 'core/paragraph' },
						} )
					),
					attributes: new Map(
						Object.entries( {
							23: {},
							123: {},
						} )
					),
					order: new Map(
						Object.entries( {
							'': [ '23', '123' ],
							23: [],
							123: [],
						} )
					),
					parents: new Map(
						Object.entries( {
							123: '',
							23: '',
						} )
					),
					tree: new Map(
						Object.entries( {
							23: {
								clientId: '23',
								name: 'core/heading',
								attributes: {},
								innerBlocks: [],
							},
						} )
					),
				},
				selection: {
					selectionStart: { clientId: '23' },
					selectionEnd: { clientId: '123' },
				},
			};

			expect( getSelectedBlock( state ) ).toBe( null );
		} );

		it( 'should return the selected block', () => {
			const state = {
				blocks: {
					byClientId: new Map(
						Object.entries( {
							23: { clientId: '23', name: 'core/heading' },
							123: { clientId: '123', name: 'core/paragraph' },
						} )
					),
					attributes: new Map(
						Object.entries( {
							23: {},
							123: {},
						} )
					),
					order: new Map(
						Object.entries( {
							'': [ '23', '123' ],
							23: [],
							123: [],
						} )
					),
					parents: new Map(
						Object.entries( {
							123: '',
							23: '',
						} )
					),
					tree: new Map(
						Object.entries( {
							23: {
								clientId: '23',
								name: 'core/heading',
								attributes: {},
								innerBlocks: [],
							},
						} )
					),
					controlledInnerBlocks: {},
				},
				selection: {
					selectionStart: { clientId: '23' },
					selectionEnd: { clientId: '23' },
				},
			};

			expect( getSelectedBlock( state ) ).toEqual(
				getBlock( state, '23' )
			);
		} );
	} );

	describe( 'getBlockRootClientId', () => {
		it( 'should return null if the block does not exist', () => {
			const state = {
				blocks: {
					order: new Map(),
					parents: new Map(),
				},
			};

			expect( getBlockRootClientId( state, 56 ) ).toBeNull();
		} );

		it( 'should return root ClientId relative the block ClientId', () => {
			const state = {
				blocks: {
					order: new Map(
						Object.entries( {
							'': [ '123', '23' ],
							123: [ '456', '56' ],
						} )
					),
					parents: new Map(
						Object.entries( {
							123: '',
							23: '',
							456: '123',
							56: '123',
						} )
					),
				},
			};

			expect( getBlockRootClientId( state, '56' ) ).toBe( '123' );
		} );
	} );

	describe( 'getBlockHierarchyRootClientId', () => {
		it( 'should return the given block if the block has no parents', () => {
			const state = {
				blocks: {
					order: new Map(),
					parents: new Map(),
				},
			};

			expect( getBlockHierarchyRootClientId( state, '56' ) ).toBe( '56' );
		} );

		it( 'should return root ClientId relative the block ClientId', () => {
			const state = {
				blocks: {
					order: new Map(
						Object.entries( {
							'': [ 'a', 'b' ],
							a: [ 'c', 'd' ],
						} )
					),
					parents: new Map(
						Object.entries( {
							a: '',
							b: '',
							c: 'a',
							d: 'a',
						} )
					),
				},
			};

			expect( getBlockHierarchyRootClientId( state, 'c' ) ).toBe( 'a' );
		} );

		it( 'should return the top level root ClientId relative the block ClientId', () => {
			const state = {
				blocks: {
					order: new Map(
						Object.entries( {
							'': [ 'a', 'b' ],
							a: [ 'c', 'd' ],
							d: [ 'e' ],
						} )
					),
					parents: new Map(
						Object.entries( {
							a: '',
							b: '',
							c: 'a',
							d: 'a',
							e: 'd',
						} )
					),
				},
			};

			expect( getBlockHierarchyRootClientId( state, 'e' ) ).toBe( 'a' );
		} );
	} );

	describe( 'getSelectedBlockClientIds', () => {
		it( 'should return empty if there is no selection', () => {
			const state = {
				blocks: {
					order: new Map(
						Object.entries( {
							'': [ '123', '23' ],
						} )
					),
					parents: new Map(
						Object.entries( {
							123: '',
							23: '',
						} )
					),
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
					order: new Map(
						Object.entries( {
							'': [ '5', '4', '3', '2', '1' ],
						} )
					),
					parents: new Map(
						Object.entries( {
							1: '',
							2: '',
							3: '',
							4: '',
							5: '',
						} )
					),
				},
				selection: {
					selectionStart: { clientId: '2' },
					selectionEnd: { clientId: '2' },
				},
			};

			expect( getSelectedBlockClientIds( state ) ).toEqual( [ '2' ] );
		} );

		it( 'should return selected block clientIds if there is multi selection', () => {
			const state = {
				blocks: {
					order: new Map(
						Object.entries( {
							'': [ '5', '4', '3', '2', '1' ],
						} )
					),
					parents: new Map(
						Object.entries( {
							1: '',
							2: '',
							3: '',
							4: '',
							5: '',
						} )
					),
				},
				selection: {
					selectionStart: { clientId: '2' },
					selectionEnd: { clientId: '4' },
				},
			};

			expect( getSelectedBlockClientIds( state ) ).toEqual( [
				'4',
				'3',
				'2',
			] );
		} );

		it( 'should return selected block clientIds if there is multi selection (nested context)', () => {
			const state = {
				blocks: {
					order: new Map(
						Object.entries( {
							'': [ '5', '4', '3', '2', '1' ],
							4: [ '9', '8', '7', '6' ],
						} )
					),
					parents: new Map(
						Object.entries( {
							1: '',
							2: '',
							3: '',
							4: '',
							5: '',
							6: '4',
							7: '4',
							8: '4',
							9: '4',
						} )
					),
				},
				selection: {
					selectionStart: { clientId: '7' },
					selectionEnd: { clientId: '9' },
				},
			};

			expect( getSelectedBlockClientIds( state ) ).toEqual( [
				'9',
				'8',
				'7',
			] );
		} );
	} );

	describe( 'getMultiSelectedBlockClientIds', () => {
		it( 'should return empty if there is no multi selection', () => {
			const state = {
				blocks: {
					order: new Map(
						Object.entries( {
							'': [ '123', '23' ],
						} )
					),
					parents: new Map(
						Object.entries( {
							23: '',
							123: '',
						} )
					),
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
					order: new Map(
						Object.entries( {
							'': [ '5', '4', '3', '2', '1' ],
						} )
					),
					parents: new Map(
						Object.entries( {
							1: '',
							2: '',
							3: '',
							4: '',
							5: '',
						} )
					),
				},
				selection: {
					selectionStart: { clientId: '2' },
					selectionEnd: { clientId: '4' },
				},
			};

			expect( getMultiSelectedBlockClientIds( state ) ).toEqual( [
				'4',
				'3',
				'2',
			] );
		} );

		it( 'should return selected block clientIds if there is multi selection (nested context)', () => {
			const state = {
				blocks: {
					order: new Map(
						Object.entries( {
							'': [ '5', '4', '3', '2', '1' ],
							4: [ '9', '8', '7', '6' ],
						} )
					),
					parents: new Map(
						Object.entries( {
							1: '',
							2: '',
							3: '',
							4: '',
							5: '',
							6: '4',
							7: '4',
							8: '4',
							9: '4',
						} )
					),
				},
				selection: {
					selectionStart: { clientId: '7' },
					selectionEnd: { clientId: '9' },
				},
			};

			expect( getMultiSelectedBlockClientIds( state ) ).toEqual( [
				'9',
				'8',
				'7',
			] );
		} );
	} );

	describe( 'getMultiSelectedBlocks', () => {
		it( 'should return the same reference on subsequent invocations of empty selection', () => {
			const state = {
				blocks: {
					byClientId: new Map(),
					attributes: new Map(),
					order: new Map(),
					parents: new Map(),
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
					selectionStart: { clientId: '2' },
					selectionEnd: { clientId: '4' },
				},
			};

			expect( getMultiSelectedBlocksStartClientId( state ) ).toBe( '2' );
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
					selectionStart: { clientId: '2' },
					selectionEnd: { clientId: '4' },
				},
			};

			expect( getMultiSelectedBlocksEndClientId( state ) ).toBe( '4' );
		} );
	} );

	describe( 'getBlockOrder', () => {
		it( 'should return the ordered block ClientIds of top-level blocks by default', () => {
			const state = {
				blocks: {
					order: new Map(
						Object.entries( {
							'': [ '123', '23' ],
						} )
					),
					parents: new Map(
						Object.entries( {
							23: '',
							123: '',
						} )
					),
				},
			};

			expect( getBlockOrder( state ) ).toEqual( [ '123', '23' ] );
		} );

		it( 'should return the ordered block ClientIds at a specified rootClientId', () => {
			const state = {
				blocks: {
					order: new Map(
						Object.entries( {
							'': [ '123', '23' ],
							123: [ '456' ],
						} )
					),
					parents: new Map(
						Object.entries( {
							23: '',
							123: '',
							456: '123',
						} )
					),
				},
			};

			expect( getBlockOrder( state, '123' ) ).toEqual( [ '456' ] );
		} );
	} );

	describe( 'getBlockIndex', () => {
		it( 'should return the block order', () => {
			const state = {
				blocks: {
					order: new Map(
						Object.entries( {
							'': [ '123', '23' ],
						} )
					),
					parents: new Map(
						Object.entries( {
							23: '',
							123: '',
						} )
					),
				},
			};

			expect( getBlockIndex( state, '23' ) ).toBe( 1 );
		} );

		it( 'should return the block order (nested context)', () => {
			const state = {
				blocks: {
					order: new Map(
						Object.entries( {
							'': [ '123', '23' ],
							123: [ '456', '56' ],
						} )
					),
					parents: new Map(
						Object.entries( {
							23: '',
							123: '',
							56: '123',
							456: '123',
						} )
					),
				},
			};

			expect( getBlockIndex( state, '56' ) ).toBe( 1 );
		} );
	} );

	describe( 'getPreviousBlockClientId', () => {
		it( 'should return the previous block', () => {
			const state = {
				blocks: {
					order: new Map(
						Object.entries( {
							'': [ '123', '23' ],
						} )
					),
					parents: new Map(
						Object.entries( {
							23: '',
							123: '',
						} )
					),
				},
			};

			expect( getPreviousBlockClientId( state, '23' ) ).toEqual( '123' );
		} );

		it( 'should return the previous block (nested context)', () => {
			const state = {
				blocks: {
					order: new Map(
						Object.entries( {
							'': [ '123', '23' ],
							123: [ '456', '56' ],
						} )
					),
					parents: new Map(
						Object.entries( {
							23: '',
							123: '',
							456: '123',
							56: '123',
						} )
					),
				},
			};

			expect( getPreviousBlockClientId( state, '56', '123' ) ).toEqual(
				'456'
			);
		} );

		it( 'should return null for the first block', () => {
			const state = {
				blocks: {
					order: new Map(
						Object.entries( {
							'': [ '123', '23' ],
						} )
					),
					parents: new Map(
						Object.entries( {
							23: '',
							123: '',
						} )
					),
				},
			};

			expect( getPreviousBlockClientId( state, '123' ) ).toBeNull();
		} );

		it( 'should return null for the first block (nested context)', () => {
			const state = {
				blocks: {
					order: new Map(
						Object.entries( {
							'': [ '123', '23' ],
							123: [ '456', '56' ],
						} )
					),
					parents: new Map(
						Object.entries( {
							23: '',
							123: '',
							456: '123',
							56: '123',
						} )
					),
				},
			};

			expect(
				getPreviousBlockClientId( state, '456', '123' )
			).toBeNull();
		} );
	} );

	describe( 'getNextBlockClientId', () => {
		it( 'should return the following block', () => {
			const state = {
				blocks: {
					order: new Map(
						Object.entries( {
							'': [ '123', '23' ],
						} )
					),
					parents: new Map(
						Object.entries( {
							23: '',
							123: '',
						} )
					),
				},
			};

			expect( getNextBlockClientId( state, '123' ) ).toEqual( '23' );
		} );

		it( 'should return the following block (nested context)', () => {
			const state = {
				blocks: {
					order: new Map(
						Object.entries( {
							'': [ '123', '23' ],
							123: [ '456', '56' ],
						} )
					),
					parents: new Map(
						Object.entries( {
							23: '',
							123: '',
							456: '123',
							56: '123',
						} )
					),
				},
			};

			expect( getNextBlockClientId( state, '456', '123' ) ).toEqual(
				'56'
			);
		} );

		it( 'should return null for the last block', () => {
			const state = {
				blocks: {
					order: new Map(
						Object.entries( {
							'': [ '123', '23' ],
						} )
					),
					parents: new Map(
						Object.entries( {
							23: '',
							123: '',
						} )
					),
				},
			};

			expect( getNextBlockClientId( state, '23' ) ).toBeNull();
		} );

		it( 'should return null for the last block (nested context)', () => {
			const state = {
				blocks: {
					order: new Map(
						Object.entries( {
							'': [ '123', '23' ],
							123: [ '456', '56' ],
						} )
					),
					parents: new Map(
						Object.entries( {
							23: '',
							123: '',
							456: '123',
							56: '123',
						} )
					),
				},
			};

			expect( getNextBlockClientId( state, '56', '123' ) ).toBeNull();
		} );
	} );

	describe( 'isBlockSelected', () => {
		it( 'should return true if the block is selected', () => {
			const state = {
				selection: {
					selectionStart: { clientId: '123' },
					selectionEnd: { clientId: '123' },
				},
			};

			expect( isBlockSelected( state, '123' ) ).toBe( true );
		} );

		it( 'should return false if a multi-selection range exists', () => {
			const state = {
				selection: {
					selectionStart: { clientId: '123' },
					selectionEnd: { clientId: '124' },
				},
			};

			expect( isBlockSelected( state, '123' ) ).toBe( false );
		} );

		it( 'should return false if the block is not selected', () => {
			const state = {
				selection: {
					selectionStart: {},
					selectionEnd: {},
				},
			};

			expect( isBlockSelected( state, '23' ) ).toBe( false );
		} );
	} );

	describe( 'hasSelectedInnerBlock', () => {
		it( 'should return false if the selected block is a child of the given ClientId', () => {
			const state = {
				selection: {
					selectionStart: { clientId: '5' },
					selectionEnd: { clientId: '5' },
				},
				blocks: {
					order: new Map(
						Object.entries( {
							4: [ '3', '2', '1' ],
						} )
					),
					parents: new Map(
						Object.entries( {
							1: '4',
							2: '4',
							3: '4',
						} )
					),
				},
			};

			expect( hasSelectedInnerBlock( state, '4' ) ).toBe( false );
		} );

		it( 'should return true if the selected block is a child of the given ClientId', () => {
			const state = {
				selection: {
					selectionStart: { clientId: '3' },
					selectionEnd: { clientId: '3' },
				},
				blocks: {
					order: new Map(
						Object.entries( {
							4: [ '3', '2', '1' ],
						} )
					),
					parents: new Map(
						Object.entries( {
							1: '4',
							2: '4',
							3: '4',
						} )
					),
				},
			};

			expect( hasSelectedInnerBlock( state, '4' ) ).toBe( true );
		} );

		it( 'should return true if a multi selection exists that contains children of the block with the given ClientId', () => {
			const state = {
				blocks: {
					order: new Map(
						Object.entries( {
							6: [ '5', '4', '3', '2', '1' ],
						} )
					),
					parents: new Map(
						Object.entries( {
							1: '6',
							2: '6',
							3: '6',
							4: '6',
							5: '6',
						} )
					),
				},
				selection: {
					selectionStart: { clientId: '2' },
					selectionEnd: { clientId: '4' },
				},
			};
			expect( hasSelectedInnerBlock( state, '6' ) ).toBe( true );
		} );

		it( 'should return false if a multi selection exists bot does not contains children of the block with the given ClientId', () => {
			const state = {
				blocks: {
					order: new Map(
						Object.entries( {
							3: [ '2', '1' ],
							6: [ '5', '4' ],
						} )
					),
					parents: new Map(
						Object.entries( {
							1: '3',
							2: '3',
							4: '6',
							5: '6',
						} )
					),
				},
				selection: {
					selectionStart: { clientId: '5' },
					selectionEnd: { clientId: '4' },
				},
			};
			expect( hasSelectedInnerBlock( state, '3' ) ).toBe( false );
		} );
	} );

	describe( 'isBlockWithinSelection', () => {
		it( 'should return true if the block is selected but not the last', () => {
			const state = {
				selection: {
					selectionStart: { clientId: '5' },
					selectionEnd: { clientId: '3' },
				},
				blocks: {
					order: new Map(
						Object.entries( {
							'': [ '5', '4', '3', '2', '1' ],
						} )
					),
					parents: new Map(
						Object.entries( {
							1: '',
							2: '',
							3: '',
							4: '',
							5: '',
						} )
					),
				},
			};

			expect( isBlockWithinSelection( state, '4' ) ).toBe( true );
		} );

		it( 'should return false if the block is the last selected', () => {
			const state = {
				selection: {
					selectionStart: { clientId: '5' },
					selectionEnd: { clientId: '3' },
				},
				blocks: {
					order: new Map(
						Object.entries( {
							'': [ '5', '4', '3', '2', '1' ],
						} )
					),
					parents: new Map(
						Object.entries( {
							1: '',
							2: '',
							3: '',
							4: '',
							5: '',
						} )
					),
				},
			};

			expect( isBlockWithinSelection( state, '3' ) ).toBe( false );
		} );

		it( 'should return false if the block is not selected', () => {
			const state = {
				selection: {
					selectionStart: { clientId: '5' },
					selectionEnd: { clientId: '3' },
				},
				blocks: {
					order: new Map(
						Object.entries( {
							'': [ '5', '4', '3', '2', '1' ],
						} )
					),
					parents: new Map(
						Object.entries( {
							1: '',
							2: '',
							3: '',
							4: '',
							5: '',
						} )
					),
				},
			};

			expect( isBlockWithinSelection( state, '2' ) ).toBe( false );
		} );

		it( 'should return false if there is no selection', () => {
			const state = {
				selection: {
					selectionStart: {},
					selectionEnd: {},
				},
				blocks: {
					order: new Map(
						Object.entries( {
							'': [ '5', '4', '3', '2', '1' ],
						} )
					),
					parents: new Map(
						Object.entries( {
							1: '',
							2: '',
							3: '',
							4: '',
							5: '',
						} )
					),
				},
			};

			expect( isBlockWithinSelection( state, '4' ) ).toBe( false );
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
				order: new Map(
					Object.entries( {
						'': [ '5', '4', '3', '2', '1' ],
					} )
				),
				parents: new Map(
					Object.entries( {
						1: '',
						2: '',
						3: '',
						4: '',
						5: '',
					} )
				),
			},
			selection: {
				selectionStart: { clientId: '2' },
				selectionEnd: { clientId: '4' },
			},
		};

		it( 'should return true if the block is multi selected', () => {
			expect( isBlockMultiSelected( state, '3' ) ).toBe( true );
		} );

		it( 'should return false if the block is not multi selected', () => {
			expect( isBlockMultiSelected( state, '5' ) ).toBe( false );
		} );
	} );

	describe( 'isFirstMultiSelectedBlock', () => {
		const state = {
			blocks: {
				order: new Map(
					Object.entries( {
						'': [ '5', '4', '3', '2', '1' ],
					} )
				),
				parents: new Map(
					Object.entries( {
						1: '',
						2: '',
						3: '',
						4: '',
						5: '',
					} )
				),
			},
			selection: {
				selectionStart: { clientId: '2' },
				selectionEnd: { clientId: '4' },
			},
		};

		it( 'should return true if the block is first in multi selection', () => {
			expect( isFirstMultiSelectedBlock( state, '4' ) ).toBe( true );
		} );

		it( 'should return false if the block is not first in multi selection', () => {
			expect( isFirstMultiSelectedBlock( state, '3' ) ).toBe( false );
		} );
	} );

	describe( 'getBlockMode', () => {
		it( 'should return "visual" if unset', () => {
			const state = {
				blocksMode: {},
			};

			expect( getBlockMode( state, '123' ) ).toEqual( 'visual' );
		} );

		it( 'should return the block mode', () => {
			const state = {
				blocksMode: {
					123: 'html',
				},
			};

			expect( getBlockMode( state, '123' ) ).toEqual( 'html' );
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
					parents: new Map(
						Object.entries( {
							'block-1': 'block-1_parent',
							'block-1_parent': 'block-1_grandparent',
						} )
					),
				},
			};
			expect( isAncestorBeingDragged( state, 'block-1' ) ).toBe( true );
		} );

		it( 'returns false if the given client id does not have an ancestor being dragged', () => {
			const state = {
				draggedBlocks: [ 'block-2_grandparent' ],
				blocks: {
					parents: new Map(
						Object.entries( {
							'block-1': 'block-1_parent',
							'block-1_parent': 'block-1_grandparent',
						} )
					),
				},
			};
			expect( isAncestorBeingDragged( state, 'block-1' ) ).toBe( false );
		} );

		it( 'returns false if no blocks are being dragged', () => {
			const state = {
				draggedBlocks: [],
				blocks: {
					parents: new Map(
						Object.entries( {
							'block-1': 'block-1_parent',
							'block-1_parent': 'block-1_grandparent',
						} )
					),
				},
			};
			expect( isAncestorBeingDragged( state, 'block-1' ) ).toBe( false );
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
					byClientId: new Map(
						Object.entries( {
							clientId1: { clientId: 'clientId1' },
							clientId2: { clientId: 'clientId2' },
						} )
					),
					attributes: new Map(
						Object.entries( {
							clientId1: {},
							clientId2: {},
						} )
					),
					order: new Map(
						Object.entries( {
							'': [ 'clientId1' ],
							clientId1: [ 'clientId2' ],
							clientId2: [],
						} )
					),
					parents: new Map(
						Object.entries( {
							clientId1: '',
							clientId2: 'clientId1',
						} )
					),
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
					byClientId: new Map(
						Object.entries( {
							clientId1: { clientId: 'clientId1' },
						} )
					),
					attributes: new Map(
						Object.entries( {
							clientId1: {},
						} )
					),
					order: new Map(
						Object.entries( {
							'': [ 'clientId1' ],
							clientId1: [],
						} )
					),
					parents: new Map(
						Object.entries( {
							clientId1: '',
						} )
					),
				},
				insertionPoint: null,
			};

			expect( getBlockInsertionPoint( state ) ).toEqual( {
				rootClientId: undefined,
				index: 1,
			} );
		} );

		it( 'should cache and return the same object if state has not changed', () => {
			const state = {
				selection: {
					selectionStart: { clientId: 'clientId1' },
					selectionEnd: { clientId: 'clientId1' },
				},
				blocks: {
					byClientId: new Map(
						Object.entries( {
							clientId1: { clientId: 'clientId1' },
						} )
					),
					attributes: new Map(
						Object.entries( {
							clientId1: {},
						} )
					),
					order: new Map(
						Object.entries( {
							'': [ 'clientId1' ],
							clientId1: [],
						} )
					),
					parents: new Map(
						Object.entries( {
							clientId1: '',
						} )
					),
				},
				insertionPoint: null,
			};

			const insertionPoint1 = getBlockInsertionPoint( state );
			const insertionPoint2 = getBlockInsertionPoint( state );

			expect( insertionPoint1 ).toBe( insertionPoint2 );
		} );

		it( 'should return an object for the nested selected block', () => {
			const state = {
				selection: {
					selectionStart: { clientId: 'clientId2' },
					selectionEnd: { clientId: 'clientId2' },
				},
				blocks: {
					byClientId: new Map(
						Object.entries( {
							clientId1: { clientId: 'clientId1' },
							clientId2: { clientId: 'clientId2' },
						} )
					),
					attributes: new Map(
						Object.entries( {
							clientId1: {},
							clientId2: {},
						} )
					),
					order: new Map(
						Object.entries( {
							'': [ 'clientId1' ],
							clientId1: [ 'clientId2' ],
							clientId2: [],
						} )
					),
					parents: new Map(
						Object.entries( {
							clientId1: '',
							clientId2: 'clientId1',
						} )
					),
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
					byClientId: new Map(
						Object.entries( {
							clientId1: { clientId: 'clientId1' },
							clientId2: { clientId: 'clientId2' },
						} )
					),
					attributes: new Map(
						Object.entries( {
							clientId1: {},
							clientId2: {},
						} )
					),
					order: new Map(
						Object.entries( {
							'': [ 'clientId1', 'clientId2' ],
							clientId1: [],
							clientId2: [],
						} )
					),
					parents: new Map(
						Object.entries( {
							clientId1: '',
							clientId2: '',
						} )
					),
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
					byClientId: new Map(
						Object.entries( {
							clientId1: { clientId: 'clientId1' },
							clientId2: { clientId: 'clientId2' },
						} )
					),
					attributes: new Map(
						Object.entries( {
							clientId1: {},
							clientId2: {},
						} )
					),
					order: new Map(
						Object.entries( {
							'': [ 'clientId1', 'clientId2' ],
							clientId1: [],
							clientId2: [],
						} )
					),
					parents: new Map(
						Object.entries( {
							clientId1: '',
							clientId2: '',
						} )
					),
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
					byClientId: new Map(),
					attributes: new Map(),
				},
				blockListSettings: {},
				settings: {},
			};
			expect( canInsertBlockType( state, 'core/invalid' ) ).toBe( false );
		} );

		it( 'should deny blocks that are not allowed by the editor', () => {
			const state = {
				blocks: {
					byClientId: new Map(),
					attributes: new Map(),
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
					byClientId: new Map(),
					attributes: new Map(),
					parents: new Map(),
				},
				blockListSettings: {},
				settings: {
					allowedBlockTypes: [ 'core/test-block-a' ],
				},
				blockEditingModes: new Map(),
			};
			expect( canInsertBlockType( state, 'core/test-block-a' ) ).toBe(
				true
			);
		} );

		it( 'should deny blocks when the editor has a template lock', () => {
			const state = {
				blocks: {
					byClientId: new Map(),
					attributes: new Map(),
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

		it( 'should deny blocks when the editor has a disabled editing mode', () => {
			const state = {
				blocks: {
					byClientId: new Map(),
					attributes: new Map(),
					parents: new Map(),
				},
				blockListSettings: {},
				settings: {},
				blockEditingModes: new Map(
					Object.entries( {
						'': 'disabled',
					} )
				),
			};
			expect( canInsertBlockType( state, 'core/test-block-a' ) ).toBe(
				false
			);
		} );

		it( 'should deny blocks that restrict parent from being inserted into the root', () => {
			const state = {
				blocks: {
					byClientId: new Map(),
					attributes: new Map(),
					parents: new Map(),
				},
				blockListSettings: {},
				settings: {},
				blockEditingModes: new Map(),
			};
			expect( canInsertBlockType( state, 'core/test-block-c' ) ).toBe(
				false
			);
		} );

		it( 'should deny blocks that restrict parent from being inserted into a restricted parent', () => {
			const state = {
				blocks: {
					byClientId: new Map(
						Object.entries( {
							block1: { name: 'core/test-block-a' },
						} )
					),
					attributes: new Map(
						Object.entries( {
							block1: {},
						} )
					),
					parents: new Map(),
				},
				blockListSettings: {},
				settings: {},
				blockEditingModes: new Map(),
			};
			expect(
				canInsertBlockType( state, 'core/test-block-c', 'block1' )
			).toBe( false );
		} );

		it( 'should allow blocks to be inserted into an allowed parent', () => {
			const state = {
				blocks: {
					byClientId: new Map(
						Object.entries( {
							block1: { name: 'core/test-block-b' },
						} )
					),
					attributes: new Map(
						Object.entries( {
							block1: {},
						} )
					),
					parents: new Map(),
				},
				blockListSettings: {
					block1: {},
				},
				settings: {},
				blockEditingModes: new Map(),
			};
			expect(
				canInsertBlockType( state, 'core/test-block-c', 'block1' )
			).toBe( true );
		} );

		it( 'should deny blocks from being inserted into a block that does not allow inner blocks', () => {
			const state = {
				blocks: {
					byClientId: new Map(
						Object.entries( {
							block1: { name: 'core/test-block-b' },
						} )
					),
					attributes: new Map(
						Object.entries( {
							block1: {},
						} )
					),
					parents: new Map(),
				},
				blockListSettings: {
					block1: {},
				},
				settings: {},
				blockEditingModes: new Map(),
			};
			expect(
				canInsertBlockType( state, 'core/test-block-c', 'block1' )
			).toBe( true );
		} );

		it( 'should deny restricted blocks from being inserted into a block that restricts allowedBlocks', () => {
			const state = {
				blocks: {
					byClientId: new Map(
						Object.entries( {
							block1: { name: 'core/test-block-a' },
						} )
					),
					attributes: new Map(
						Object.entries( {
							block1: {},
						} )
					),
					parents: new Map(),
				},
				blockListSettings: {
					block1: {
						allowedBlocks: [ 'core/test-block-c' ],
					},
				},
				settings: {},
				blockEditingModes: new Map(),
			};
			expect(
				canInsertBlockType( state, 'core/test-block-b', 'block1' )
			).toBe( false );
		} );

		it( 'should allow allowed blocks to be inserted into a block that restricts allowedBlocks', () => {
			const state = {
				blocks: {
					byClientId: new Map(
						Object.entries( {
							block1: { name: 'core/test-block-a' },
						} )
					),
					attributes: new Map(
						Object.entries( {
							block1: {},
						} )
					),
					parents: new Map(),
				},
				blockListSettings: {
					block1: {
						allowedBlocks: [ 'core/test-block-b' ],
					},
				},
				settings: {},
				blockEditingModes: new Map(),
			};
			expect(
				canInsertBlockType( state, 'core/test-block-b', 'block1' )
			).toBe( true );
		} );

		it( 'should deny blocks from being inserted into a block that has a disabled editing mode', () => {
			const state = {
				blocks: {
					byClientId: new Map(
						Object.entries( {
							block1: { name: 'core/test-block-a' },
						} )
					),
					attributes: new Map(
						Object.entries( {
							block1: {},
						} )
					),
					parents: new Map(),
				},
				blockListSettings: {},
				settings: {},
				blockEditingModes: new Map(
					Object.entries( {
						block1: 'disabled',
					} )
				),
			};
			expect(
				canInsertBlockType( state, 'core/test-block-b', 'block1' )
			).toBe( false );
		} );

		it( 'should prioritise parent over allowedBlocks', () => {
			const state = {
				blocks: {
					byClientId: new Map(
						Object.entries( {
							block1: { name: 'core/test-block-b' },
						} )
					),
					attributes: new Map(
						Object.entries( {
							block1: {},
						} )
					),
					parents: new Map(),
				},
				blockListSettings: {
					block1: {
						allowedBlocks: [],
					},
				},
				settings: {},
				blockEditingModes: new Map(),
			};
			expect(
				canInsertBlockType( state, 'core/test-block-c', 'block1' )
			).toBe( true );
		} );

		it( 'should deny blocks that restrict parent to core/post-content when not in editor root', () => {
			const state = {
				blocks: {
					byClientId: new Map(
						Object.entries( {
							block1: { name: 'core/test-block-c' },
						} )
					),
					attributes: new Map(
						Object.entries( {
							block1: {},
						} )
					),
					parents: new Map(),
				},
				blockListSettings: {},
				settings: {},
				blockEditingModes: new Map(),
			};
			expect(
				canInsertBlockType( state, 'core/post-content-child', 'block1' )
			).toBe( false );
		} );

		it( 'should allow blocks that restrict parent to core/post-content when in editor root', () => {
			const state = {
				blocks: {
					byClientId: new Map(),
					attributes: new Map(),
					parents: new Map(),
				},
				blockListSettings: {},
				settings: {},
				blockEditingModes: new Map(),
			};
			expect(
				canInsertBlockType( state, 'core/post-content-child' )
			).toBe( true );
		} );

		it( 'should allow blocks to be inserted in a descendant of a required ancestor', () => {
			const state = {
				blocks: {
					byClientId: new Map(
						Object.entries( {
							block1: { name: 'core/test-block-ancestor' },
							block2: { name: 'core/block' },
						} )
					),
					attributes: new Map(
						Object.entries( {
							block1: {},
							block2: {},
						} )
					),
					parents: new Map(
						Object.entries( {
							block2: 'block1',
						} )
					),
				},
				blockListSettings: {
					block1: {},
					block2: {},
				},
				settings: {},
				blockEditingModes: new Map(),
			};
			expect(
				canInsertBlockType(
					state,
					'core/test-block-requires-ancestor',
					'block2'
				)
			).toBe( true );
		} );

		it( 'should allow blocks to be inserted if both parent and ancestor restrictions are met', () => {
			const state = {
				blocks: {
					byClientId: new Map(
						Object.entries( {
							block1: { name: 'core/test-block-ancestor' },
							block2: { name: 'core/block' },
							block3: { name: 'core/test-block-parent' },
						} )
					),
					attributes: new Map(
						Object.entries( {
							block1: {},
							block2: {},
							block3: {},
						} )
					),
					parents: new Map(
						Object.entries( {
							block2: 'block1',
							block3: 'block2',
						} )
					),
				},
				blockListSettings: {
					block1: {},
					block2: {},
					block3: {},
				},
				settings: {},
				blockEditingModes: new Map(),
			};
			expect(
				canInsertBlockType(
					state,
					'core/test-block-requires-ancestor-parent',
					'block3'
				)
			).toBe( true );
		} );

		it( 'should deny blocks from being inserted outside a required ancestor', () => {
			const state = {
				blocks: {
					byClientId: new Map(
						Object.entries( {
							block1: { name: 'core/test-block-ancestor' },
							block2: { name: 'core/block' },
							block3: { name: 'core/block' },
						} )
					),
					attributes: new Map(
						Object.entries( {
							block1: {},
							block2: {},
							block3: {},
						} )
					),
					parents: new Map(
						Object.entries( {
							block3: 'block2',
						} )
					),
				},
				blockListSettings: {
					block1: {},
					block2: {},
					block3: {},
				},
				settings: {},
				blockEditingModes: new Map(),
			};
			expect(
				canInsertBlockType(
					state,
					'core/test-block-requires-ancestor',
					'block3'
				)
			).toBe( false );
		} );

		it( 'should deny blocks from being inserted outside of a required ancestor, even if parent matches', () => {
			const state = {
				blocks: {
					byClientId: new Map(
						Object.entries( {
							block1: { name: 'core/test-block-ancestor' },
							block2: { name: 'core/block' },
							block3: { name: 'core/test-block-parent' },
						} )
					),
					attributes: new Map(
						Object.entries( {
							block1: {},
							block2: {},
							block3: {},
						} )
					),
					parents: new Map(
						Object.entries( {
							block3: 'block2',
						} )
					),
				},
				blockListSettings: {
					block1: {},
					block2: {},
					block3: {},
				},
				settings: {},
				blockEditingModes: new Map(),
			};
			expect(
				canInsertBlockType(
					state,
					'core/test-block-requires-ancestor-parent',
					'block3'
				)
			).toBe( false );
		} );

		it( 'should deny blocks from being inserted inside ancestor if parent restricts allowedBlocks', () => {
			const state = {
				blocks: {
					byClientId: new Map(
						Object.entries( {
							block1: { name: 'core/test-block-ancestor' },
							block2: { name: 'core/block' },
						} )
					),
					attributes: new Map(
						Object.entries( {
							block1: {},
							block2: {},
						} )
					),
					parents: new Map(
						Object.entries( {
							block2: 'block1',
						} )
					),
				},
				blockListSettings: {
					block1: {},
					block2: {
						allowedBlocks: [],
					},
				},
				settings: {},
				blockEditingModes: new Map(),
			};
			expect(
				canInsertBlockType(
					state,
					'core/test-block-requires-ancestor',
					'block2'
				)
			).toBe( false );
		} );

		it( 'should deny blocks from being inserted inside ancestor if parent restriction is not met', () => {
			const state = {
				blocks: {
					byClientId: new Map(
						Object.entries( {
							block1: { name: 'core/test-block-ancestor' },
							block2: { name: 'core/block' },
						} )
					),
					attributes: new Map(
						Object.entries( {
							block1: {},
							block2: {},
						} )
					),
					parents: new Map(
						Object.entries( {
							block2: 'block1',
						} )
					),
				},
				blockListSettings: {
					block1: {},
					block2: {},
				},
				settings: {},
				blockEditingModes: new Map(),
			};
			expect(
				canInsertBlockType(
					state,
					'core/test-block-requires-ancestor-parent',
					'block2'
				)
			).toBe( false );
		} );
	} );

	describe( 'canInsertBlocks', () => {
		it( 'should allow blocks', () => {
			const state = {
				blocks: {
					byClientId: new Map(
						Object.entries( {
							1: { name: 'core/test-block-a' },
							2: { name: 'core/test-block-b' },
							3: { name: 'core/test-block-c' },
						} )
					),
					attributes: new Map(
						Object.entries( {
							1: {},
							2: {},
							3: {},
						} )
					),
					parents: new Map(),
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
				blockEditingModes: new Map(),
			};
			expect( canInsertBlocks( state, [ '2', '3' ], '1' ) ).toBe( true );
		} );

		it( 'should deny blocks', () => {
			const state = {
				blocks: {
					byClientId: new Map(
						Object.entries( {
							1: { name: 'core/test-block-a' },
							2: { name: 'core/test-block-b' },
							3: { name: 'core/test-block-c' },
						} )
					),
					attributes: new Map(
						Object.entries( {
							1: {},
							2: {},
							3: {},
						} )
					),
					parents: new Map(),
				},
				blockListSettings: {
					1: {
						allowedBlocks: [ 'core/test-block-c' ],
					},
				},
				settings: {},
				blockEditingModes: new Map(),
			};
			expect( canInsertBlocks( state, [ '2', '3' ], '1' ) ).toBe( false );
		} );
	} );

	describe( 'getInserterItems', () => {
		it( 'should properly list block type and reusable block items', () => {
			const state = {
				blocks: {
					byClientId: new Map(),
					attributes: new Map(),
					order: new Map(),
					parents: new Map(),
					tree: new Map(
						Object.entries( {
							'': {
								innerBlocks: [],
							},
						} )
					),
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
				blockEditingModes: new Map(),
			};
			const items = getInserterItems( state );
			const testBlockAItem = items.find(
				( item ) => item.id === 'core/test-block-a'
			);
			expect( testBlockAItem ).toEqual( {
				category: 'design',
				description: undefined,
				example: undefined,
				frecency: 0,
				icon: { src: 'test' },
				id: 'core/test-block-a',
				initialAttributes: {},
				isDisabled: false,
				keywords: [ 'testing' ],
				name: 'core/test-block-a',
				title: 'Test Block A',
				utility: 1,
				variations: [],
			} );
			const reusableBlockItem = items.find(
				( item ) => item.id === 'core/block/1'
			);
			expect( reusableBlockItem ).toEqual( {
				category: 'reusable',
				content: '<!-- /wp:test-block-a -->',
				frecency: 0,
				icon: { src: 'test' },
				id: 'core/block/1',
				initialAttributes: { ref: 1 },
				isDisabled: false,
				keywords: [],
				name: 'core/block',
				syncStatus: undefined,
				title: 'Reusable Block 1',
				utility: 1,
			} );
		} );

		it( 'should correctly cache the return values', () => {
			const state = {
				blocks: {
					byClientId: new Map(
						Object.entries( {
							block3: { name: 'core/test-block-a' },
							block4: { name: 'core/test-block-a' },
						} )
					),
					attributes: new Map(
						Object.entries( {
							block3: {},
							block4: {},
						} )
					),
					order: new Map(
						Object.entries( {
							'': [ 'block3', 'block4' ],
						} )
					),
					parents: new Map(
						Object.entries( {
							block3: '',
							block4: '',
						} )
					),
					tree: new Map(
						Object.entries( {
							block3: {
								clientId: 'block3',
								name: 'core/test-block-a',
								attributes: {},
								innerBlocks: [],
							},
							block4: {
								clientId: 'block4',
								name: 'core/test-block-a',
								attributes: {},
								innerBlocks: [],
							},
						} )
					),
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
				blockEditingModes: new Map(),
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
				'core/test-block-ancestor',
				'core/test-block-parent',
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
				'core/test-block-ancestor',
				'core/test-block-parent',
				'core/block/1',
				'core/block/2',
			] );
			expect( secondBlockSecondCall.map( ( item ) => item.id ) ).toEqual(
				[ 'core/test-block-b' ]
			);
		} );

		it( 'should set isDisabled when a block with `multiple: false` has been used', () => {
			const state = {
				blocks: {
					byClientId: new Map(
						Object.entries( {
							block1: {
								clientId: 'block1',
								name: 'core/test-block-b',
							},
						} )
					),
					attributes: new Map(
						Object.entries( {
							block1: { attribute: {} },
						} )
					),
					order: new Map(
						Object.entries( {
							'': [ 'block1' ],
						} )
					),
					tree: new Map(
						Object.entries( {
							block1: {
								clientId: 'block1',
								name: 'core/test-block-b',
								attributes: {},
								innerBlocks: [],
							},
						} )
					),
					controlledInnerBlocks: {},
					parents: new Map(),
				},
				preferences: {
					insertUsage: {},
				},
				blockListSettings: {},
				settings: {},
				blockEditingModes: new Map(),
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
					byClientId: new Map(),
					attributes: new Map(),
					order: new Map(),
					parents: new Map(),
					cache: {},
				},
				preferences: {
					insertUsage: {
						'core/test-block-b': { count: 10, time: 1000 },
					},
				},
				blockListSettings: {},
				settings: {},
				blockEditingModes: new Map(),
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
					byClientId: new Map(),
					attributes: new Map(),
					order: new Map(),
					parents: new Map(),
					cache: {},
				},
				settings: {},
				preferences: {},
				blockListSettings: {},
				blockEditingModes: new Map(),
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
		it( 'should support single block object', () => {
			const state = {
				blocks: {
					byClientId: new Map(),
					attributes: new Map(),
					order: new Map(),
					parents: new Map(),
					cache: {},
				},
				settings: {},
				preferences: {},
				blockListSettings: {},
				blockEditingModes: new Map(),
			};
			const block = { name: 'core/with-tranforms-a' };
			const items = getBlockTransformItems( state, block );
			expect( items ).toHaveLength( 2 );
		} );
		it( 'should return only eligible blocks for transformation - `allowedBlocks`', () => {
			const state = {
				blocks: {
					byClientId: new Map(
						Object.entries( {
							block1: { name: 'core/with-tranforms-b' },
							block2: { name: 'core/with-tranforms-a' },
						} )
					),
					attributes: new Map(
						Object.entries( {
							block1: {},
							block2: {},
						} )
					),
					order: new Map(),
					parents: new Map(
						Object.entries( {
							block1: '',
							block2: 'block1',
						} )
					),
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
				blockEditingModes: new Map(),
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
					byClientId: new Map(
						Object.entries( {
							block1: {
								clientId: 'block1',
								name: 'core/with-tranforms-c',
							},
						} )
					),
					attributes: new Map(
						Object.entries( {
							block1: { attribute: {} },
						} )
					),
					order: new Map(
						Object.entries( {
							'': [ 'block1' ],
						} )
					),
					tree: new Map(
						Object.entries( {
							block1: {
								clientId: 'block1',
								name: 'core/with-tranforms-c',
								attributes: {},
								innerBlocks: [],
							},
						} )
					),
					controlledInnerBlocks: {},
					parents: new Map(),
				},
				preferences: {
					insertUsage: {},
				},
				blockListSettings: {},
				settings: {},
				blockEditingModes: new Map(),
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
					byClientId: new Map(),
					attributes: new Map(),
					order: new Map(),
					parents: new Map(),
					cache: {},
				},
				preferences: {
					insertUsage: {
						'core/with-tranforms-a': { count: 10, time: 1000 },
					},
				},
				blockListSettings: {},
				settings: {},
				blockEditingModes: new Map(),
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
		it( 'should return the general template lock if no clientId was specified', () => {
			const state = {
				settings: { templateLock: 'all' },
			};

			expect( getTemplateLock( state ) ).toBe( 'all' );
		} );

		it( 'should return false if the specified clientId was not found', () => {
			const state = {
				settings: { templateLock: 'all' },
				blockListSettings: {
					chicken: {
						templateLock: 'insert',
					},
				},
			};

			expect( getTemplateLock( state, 'ribs' ) ).toBe( false );
		} );

		it( 'should return false if template lock was not set on the specified block', () => {
			const state = {
				settings: { templateLock: 'all' },
				blockListSettings: {
					chicken: {
						test: 'tes1t',
					},
				},
			};

			expect( getTemplateLock( state, 'chicken' ) ).toBe( false );
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
			// Does not include target Block clientIds.
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
			order: new Map(
				Object.entries( {
					'': [ 'a', 'b' ],
					a: [ 'c', 'd' ],
					d: [ 'e' ],
					b: [ 'f' ],
				} )
			),
			parents: new Map(
				Object.entries( {
					a: '',
					b: '',
					c: 'a',
					d: 'a',
					e: 'd',
					f: 'b',
				} )
			),
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
				parents: new Map(
					Object.entries( {
						'client-id-01': '',
						'client-id-02': 'client-id-01',
						'client-id-03': 'client-id-02',
						'client-id-04': 'client-id-03',
						'client-id-05': 'client-id-03',
					} )
				),
				byClientId: new Map(
					Object.entries( {
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
					} )
				),
				cache: {
					'client-id-01': {},
					'client-id-02': {},
					'client-id-03': {},
					'client-id-04': {},
					'client-id-05': {},
				},
				order: new Map(
					Object.entries( {
						'client-id-03': [ 'client-id-04', 'client-id-05' ],
					} )
				),
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
				byClientId: new Map(
					Object.entries( {
						block1: { name: 'core/test-block-a' },
						block2: { name: 'core/test-block-b' },
					} )
				),
				attributes: new Map(
					Object.entries( {
						block1: {},
						block2: {},
					} )
				),
				parents: new Map(
					Object.entries( {
						block1: '',
						block2: '',
					} )
				),
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
					{
						name: 'pattern-c',
						title: 'pattern hidden from UI',
						inserter: false,
						content:
							'<!-- wp:test-block-a --><!-- /wp:test-block-a -->',
					},
				],
			},
			blockEditingModes: new Map(),
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
		it( 'should return empty array if only patterns hidden from UI exist', () => {
			expect(
				__experimentalGetAllowedPatterns( {
					blocks: { byClientId: new Map() },
					blockListSettings: {},
					settings: {
						__experimentalBlockPatterns: [
							{
								name: 'pattern-c',
								title: 'pattern hidden from UI',
								inserter: false,
								content:
									'<!-- wp:test-block-a --><!-- /wp:test-block-a -->',
							},
						],
					},
				} )
			).toHaveLength( 0 );
		} );
	} );
	describe( '__experimentalGetParsedPattern', () => {
		const state = {
			settings: {
				__experimentalBlockPatterns: [
					{
						name: 'pattern-a',
						title: 'pattern with a',
						content: `<!-- wp:test-block-a --><!-- /wp:test-block-a -->`,
					},
					{
						name: 'pattern-hidden-from-ui',
						title: 'pattern hidden from UI',
						inserter: false,
						content:
							'<!-- wp:test-block-a --><!-- /wp:test-block-a --><!-- wp:test-block-b --><!-- /wp:test-block-b -->',
					},
				],
			},
		};
		it( 'should return proper results when pattern does not exist', () => {
			expect(
				__experimentalGetParsedPattern( state, 'not there' )
			).toBeNull();
		} );
		it( 'should return existing pattern properly parsed', () => {
			const { name, blocks } = __experimentalGetParsedPattern(
				state,
				'pattern-a'
			);
			expect( name ).toEqual( 'pattern-a' );
			expect( blocks ).toHaveLength( 1 );
			expect( blocks[ 0 ] ).toEqual(
				expect.objectContaining( {
					name: 'core/test-block-a',
				} )
			);
		} );
		it( 'should return hidden from UI pattern when requested', () => {
			const { name, blocks, inserter } = __experimentalGetParsedPattern(
				state,
				'pattern-hidden-from-ui'
			);
			expect( name ).toEqual( 'pattern-hidden-from-ui' );
			expect( inserter ).toBeFalsy();
			expect( blocks ).toHaveLength( 2 );
			expect( blocks[ 0 ] ).toEqual(
				expect.objectContaining( {
					name: 'core/test-block-a',
				} )
			);
		} );
	} );
	describe( 'getPatternsByBlockTypes', () => {
		const state = {
			blocks: {
				byClientId: new Map(
					Object.entries( {
						block1: { name: 'core/test-block-a' },
					} )
				),
				parents: new Map(),
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
			blockEditingModes: new Map(),
		};
		it( 'should return empty array if no block name is provided', () => {
			expect( getPatternsByBlockTypes( state ) ).toEqual( [] );
		} );
		it( 'should return empty array if no match is found', () => {
			const patterns = getPatternsByBlockTypes(
				state,
				'test/block-not-exists'
			);
			expect( patterns ).toEqual( [] );
		} );
		it( 'should return the same empty array in both empty array cases', () => {
			const patterns1 = getPatternsByBlockTypes( state );
			const patterns2 = getPatternsByBlockTypes(
				state,
				'test/block-not-exists'
			);
			expect( patterns1 ).toBe( patterns2 );
		} );
		it( 'should return proper results when there are matched block patterns', () => {
			const patterns = getPatternsByBlockTypes( state, 'test/block-a' );
			expect( patterns ).toHaveLength( 2 );
			expect( patterns ).toEqual(
				expect.arrayContaining( [
					expect.objectContaining( { title: 'pattern a' } ),
					expect.objectContaining( { title: 'pattern c' } ),
				] )
			);
		} );
		it( 'should return proper result with matched patterns and allowed blocks from rootClientId', () => {
			const patterns = getPatternsByBlockTypes(
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
	describe( '__experimentalGetPatternTransformItems', () => {
		const state = {
			blocks: {
				byClientId: new Map(
					Object.entries( {
						block1: { name: 'core/test-block-a' },
						block2: { name: 'core/test-block-b' },
					} )
				),
				parents: new Map(),
				controlledInnerBlocks: { 'block2-clientId': true },
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
						name: 'pattern-c',
						title: 'pattern c',
						blockTypes: [ 'test/block-a' ],
						content:
							'<!-- wp:test-block-b --><!-- /wp:test-block-b -->',
					},
					{
						name: 'pattern-mix',
						title: 'pattern mix',
						blockTypes: [
							'core/test-block-a',
							'core/test-block-b',
						],
						content:
							'<!-- wp:test-block-b --><!-- /wp:test-block-b -->',
					},
				],
			},
			blockEditingModes: new Map(),
		};
		describe( 'should return empty array', () => {
			it( 'when no blocks are selected', () => {
				expect(
					__experimentalGetPatternTransformItems( state )
				).toEqual( [] );
			} );
			it( 'when a selected block has inner blocks', () => {
				const blocks = [
					{ name: 'core/test-block-a', innerBlocks: [] },
					{
						name: 'core/test-block-b',
						innerBlocks: [ { name: 'some inner block' } ],
					},
				];
				expect(
					__experimentalGetPatternTransformItems( state, blocks )
				).toEqual( [] );
			} );
			it( 'when a selected block has controlled inner blocks', () => {
				const blocks = [
					{ name: 'core/test-block-a', innerBlocks: [] },
					{
						name: 'core/test-block-b',
						clientId: 'block2-clientId',
						innerBlocks: [],
					},
				];
				expect(
					__experimentalGetPatternTransformItems( state, blocks )
				).toEqual( [] );
			} );
			it( 'when no patterns are available based on the selected blocks', () => {
				const blocks = [
					{ name: 'block-with-no-patterns', innerBlocks: [] },
				];
				expect(
					__experimentalGetPatternTransformItems( state, blocks )
				).toEqual( [] );
			} );
		} );
		describe( 'should return proper results', () => {
			it( 'when a single block is selected', () => {
				const blocks = [
					{ name: 'core/test-block-b', innerBlocks: [] },
				];
				const patterns = __experimentalGetPatternTransformItems(
					state,
					blocks
				);
				expect( patterns ).toHaveLength( 1 );
				expect( patterns[ 0 ] ).toEqual(
					expect.objectContaining( {
						name: 'pattern-mix',
					} )
				);
			} );
			it( 'when different multiple blocks are selected', () => {
				const blocks = [
					{ name: 'core/test-block-b', innerBlocks: [] },
					{ name: 'test/block-b', innerBlocks: [] },
					{ name: 'some other block', innerBlocks: [] },
				];
				const patterns = __experimentalGetPatternTransformItems(
					state,
					blocks
				);
				expect( patterns ).toHaveLength( 2 );
				expect( patterns ).toEqual(
					expect.arrayContaining( [
						expect.objectContaining( {
							name: 'pattern-mix',
						} ),
						expect.objectContaining( {
							name: 'pattern-b',
						} ),
					] )
				);
			} );
			it( 'when multiple blocks are selected containing multiple times the same block', () => {
				const blocks = [
					{ name: 'core/test-block-b', innerBlocks: [] },
					{ name: 'some other block', innerBlocks: [] },
					{ name: 'core/test-block-a', innerBlocks: [] },
					{ name: 'core/test-block-b', innerBlocks: [] },
				];
				const patterns = __experimentalGetPatternTransformItems(
					state,
					blocks
				);
				expect( patterns ).toHaveLength( 1 );
				expect( patterns[ 0 ] ).toEqual(
					expect.objectContaining( {
						name: 'pattern-mix',
					} )
				);
			} );
		} );
	} );

	describe( 'wasBlockJustInserted', () => {
		it( 'should return true if the client id passed to wasBlockJustInserted is found within the state', () => {
			const expectedClientId = '62bfef6e-d5e9-43ba-b7f9-c77cf354141f';
			const source = 'inserter_menu';

			const state = {
				lastBlockInserted: {
					clientIds: [ expectedClientId ],
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
					clientIds: [ unexpectedClientId ],
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
					clientIds: [ clientId ],
				},
			};

			expect(
				wasBlockJustInserted( state, clientId, expectedSource )
			).toBe( false );
		} );
	} );
} );

describe( 'getInserterItems with core blocks prioritization', () => {
	// This test is in a separate `describe` because all other tests register
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
		registerBlockType( 'plugin/block-c-with-variations', {
			save() {},
			category: 'text',
			title: 'Plugin Block C with variations',
			icon: 'test',
			variations: [ { name: 'variation-a' }, { name: 'variation-b' } ],
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
		registerBlockType( 'core/test-block-with-variations', {
			save() {},
			category: 'text',
			title: 'Core Block C with variations',
			icon: 'test',
			keywords: [ 'testing' ],
			variations: [ { name: 'variation-a' }, { name: 'variation-b' } ],
		} );
	} );
	afterEach( () => {
		[
			'plugin/block-a',
			'another-plugin/block-b',
			'plugin/block-c-with-variations',
			'core/block',
			'core/test-block-a',
			'core/test-block-with-variations',
		].forEach( unregisterBlockType );
	} );
	it( 'should prioritize core blocks by sorting them at the top of the returned list', () => {
		const state = {
			blocks: {
				byClientId: new Map(),
				attributes: new Map(),
				order: new Map(),
				parents: new Map(),
				cache: {},
			},
			settings: {},
			preferences: {},
			blockListSettings: {},
			blockEditingModes: new Map(),
		};
		const items = getInserterItems( state );
		const expectedResult = [
			'core/block',
			'core/test-block-a',
			'core/test-block-with-variations',
			'core/test-block-with-variations/variation-a',
			'core/test-block-with-variations/variation-b',
			'plugin/block-a',
			'another-plugin/block-b',
			'plugin/block-c-with-variations',
			'plugin/block-c-with-variations/variation-a',
			'plugin/block-c-with-variations/variation-b',
		];
		expect( items.map( ( { id } ) => id ) ).toEqual( expectedResult );
	} );
} );

describe( '__unstableGetClientIdWithClientIdsTree', () => {
	it( "should return a stripped down block object containing only its client ID and its inner blocks' client IDs", () => {
		const state = {
			blocks: {
				order: new Map(
					Object.entries( {
						'': [ 'foo' ],
						foo: [ 'bar', 'baz' ],
						bar: [ 'qux' ],
					} )
				),
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
		expect( console ).toHaveWarned();
	} );
} );
describe( '__unstableGetClientIdsTree', () => {
	it( "should return the full content tree starting from the given root, consisting of stripped down block object containing only its client ID and its inner blocks' client IDs", () => {
		const state = {
			blocks: {
				order: new Map(
					Object.entries( {
						'': [ 'foo' ],
						foo: [ 'bar', 'baz' ],
						bar: [ 'qux' ],
					} )
				),
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
				order: new Map(
					Object.entries( {
						'': [ 'foo' ],
						foo: [ 'bar', 'baz' ],
						bar: [ 'qux' ],
					} )
				),
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
