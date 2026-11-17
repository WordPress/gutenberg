import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createRegistry } from '@wordpress/data';
import {
	createBlock,
	registerBlockType,
	unregisterBlockType,
	store as blocksStore,
	getBlockType,
	parse,
} from '@wordpress/blocks';
import type { Block } from '@wordpress/blocks';
import { store } from '..';
import { unlock } from '../../lock-unlock';
import { setClipboardBlocks } from '../../components/writing-flow/utils';

describe( 'explicit block selection', () => {
	let registry: ReturnType< typeof createRegistry >;
	let blocks: Block[];
	beforeAll( () => {
		registerBlockType( 'core/test-selection', {
			apiVersion: 3,
			title: 'Selection fixture',
			category: 'text',
			attributes: { content: { type: 'string' } },
			save: () => null,
		} );
	} );
	afterAll( () => unregisterBlockType( 'core/test-selection' ) );
	beforeEach( () => {
		registry = createRegistry();
		registry.register( blocksStore );
		registry
			.dispatch( blocksStore )
			.addBlockTypes( getBlockType( 'core/test-selection' )! );
		registry.register( store );
		blocks = Array.from( { length: 5 }, () =>
			createBlock( 'core/test-selection' )
		);
		registry.dispatch( store ).resetBlocks( blocks );
	} );

	it( 'selects explicit blocks without including intervening siblings', () => {
		const ids = [
			blocks[ 4 ].clientId,
			blocks[ 0 ].clientId,
			blocks[ 2 ].clientId,
		];
		registry.dispatch( store ).multiSelectSet( ids );
		expect( registry.select( store ).getSelectedBlockClientIds() ).toEqual(
			[ ids[ 1 ], ids[ 2 ], ids[ 0 ] ]
		);
		expect(
			registry
				.select( store )
				.isBlockMultiSelected( blocks[ 1 ].clientId )
		).toBe( false );
		expect(
			registry.select( store ).getSelectedBlockClientId()
		).toBeNull();
	} );

	it( 'selects blocks under different parents', () => {
		const sixthCell = createBlock( 'core/test-selection' );
		const extraCell = createBlock( 'core/test-selection' );
		const section = createBlock( 'core/test-selection', {}, [
			createBlock( 'core/test-selection', {}, blocks.slice( 0, 3 ) ),
			createBlock( 'core/test-selection', {}, [
				...blocks.slice( 3 ),
				sixthCell,
			] ),
		] );
		const secondSection = createBlock( 'core/test-selection', {}, [
			createBlock( 'core/test-selection', {}, [ extraCell ] ),
		] );
		registry.dispatch( store ).resetBlocks( [ section, secondSection ] );
		const rectangle = [
			blocks[ 1 ].clientId,
			blocks[ 2 ].clientId,
			blocks[ 4 ].clientId,
			sixthCell.clientId,
		];
		registry.dispatch( store ).multiSelectSet( rectangle, null, {
			anchorClientId: blocks[ 2 ].clientId,
			focusClientId: blocks[ 4 ].clientId,
		} );
		expect( registry.select( store ).getSelectedBlockClientIds() ).toEqual(
			rectangle
		);
		expect(
			registry.select( store ).getMultiSelectedBlocksStartClientId()
		).toBe( blocks[ 2 ].clientId );
		expect(
			registry.select( store ).getMultiSelectedBlocksEndClientId()
		).toBe( blocks[ 4 ].clientId );
		const ids = [ ...rectangle, extraCell.clientId ];
		registry.dispatch( store ).multiSelectSet( ids );
		expect( registry.select( store ).getSelectedBlockClientIds() ).toEqual(
			ids
		);
		expect(
			registry
				.select( store )
				.hasSelectedInnerBlock( section.clientId, true )
		).toBe( true );
		registry
			.dispatch( store )
			.setHasControlledInnerBlocks(
				section.innerBlocks[ 0 ].clientId,
				true
			);
		// Controlled contents are loaded separately after the parent is registered.
		registry
			.dispatch( store )
			.replaceInnerBlocks(
				section.innerBlocks[ 0 ].clientId,
				blocks.slice( 0, 3 ),
				false
			);
		registry.dispatch( store ).clearSelectedBlock();
		registry.dispatch( store ).multiSelectSet( ids );
		expect( registry.select( store ).getSelectedBlockClientIds() ).toEqual(
			[]
		);
	} );

	it( 'normalizes duplicate, invalid, empty, and single-member selections', () => {
		const id = blocks[ 0 ].clientId;
		registry.dispatch( store ).multiSelectSet( [ id, 'missing', id ] );
		expect( registry.select( store ).getSelectedBlockClientIds() ).toEqual(
			[ id ]
		);
		expect( registry.select( store ).hasMultiSelection() ).toBe( false );
		registry.dispatch( store ).multiSelectSet( [] );
		expect( registry.select( store ).getSelectedBlockClientIds() ).toEqual(
			[]
		);
	} );

	it( 'keeps selected parents without separately selecting their descendants', () => {
		const parent = createBlock(
			'core/test-selection',
			{},
			blocks.slice( 0, 2 )
		);
		registry.dispatch( store ).resetBlocks( [ parent, blocks[ 2 ] ] );
		registry
			.dispatch( store )
			.multiSelectSet( [
				blocks[ 0 ].clientId,
				parent.clientId,
				blocks[ 2 ].clientId,
			] );
		expect( registry.select( store ).getSelectedBlockClientIds() ).toEqual(
			[ parent.clientId, blocks[ 2 ].clientId ]
		);
	} );

	it( 'preserves anchor and focus independently of document order', () => {
		const ids = [
			blocks[ 0 ].clientId,
			blocks[ 2 ].clientId,
			blocks[ 4 ].clientId,
		];
		registry.dispatch( store ).multiSelectSet( ids, null, {
			anchorClientId: ids[ 2 ],
			focusClientId: ids[ 1 ],
		} );
		expect(
			registry.select( store ).getMultiSelectedBlocksStartClientId()
		).toBe( ids[ 2 ] );
		expect(
			registry.select( store ).getMultiSelectedBlocksEndClientId()
		).toBe( ids[ 1 ] );
		expect(
			registry.select( store ).getFirstMultiSelectedBlockClientId()
		).toBe( ids[ 0 ] );
	} );

	it( 'keeps selection membership valid after block removal, replacement, reset, and reordering', () => {
		const ids = blocks.map( ( block ) => block.clientId );
		registry
			.dispatch( store )
			.multiSelectSet( [ ids[ 0 ], ids[ 2 ], ids[ 4 ] ] );
		registry
			.dispatch( store )
			.moveBlocksToPosition( [ ids[ 4 ] ], '', '', 0 );
		expect( registry.select( store ).getSelectedBlockClientIds() ).toEqual(
			[ ids[ 4 ], ids[ 0 ], ids[ 2 ] ]
		);
		const replacement = createBlock( 'core/test-selection' );
		registry.dispatch( store ).replaceBlocks( ids[ 2 ], replacement );
		expect( registry.select( store ).getSelectedBlockClientIds() ).toEqual(
			[ ids[ 4 ], ids[ 0 ], replacement.clientId ]
		);
		registry.dispatch( store ).removeBlocks( [ ids[ 0 ] ], false );
		expect( registry.select( store ).getSelectedBlockClientIds() ).toEqual(
			[ ids[ 4 ], replacement.clientId ]
		);
		registry.dispatch( store ).resetBlocks( [ replacement ] );
		expect( registry.select( store ).getSelectedBlockClientId() ).toBe(
			replacement.clientId
		);
	} );

	it( 'applies attribute changes only to selected cells across row parents', () => {
		const rows = [
			createBlock( 'core/test-selection', {}, blocks.slice( 0, 3 ) ),
			createBlock( 'core/test-selection', {}, blocks.slice( 3 ) ),
		];
		registry.dispatch( store ).resetBlocks( rows );
		registry
			.dispatch( store )
			.multiSelectSet( [ blocks[ 1 ].clientId, blocks[ 4 ].clientId ] );
		registry
			.dispatch( store )
			.updateBlockAttributes(
				registry.select( store ).getSelectedBlockClientIds(),
				{ content: 'Changed' }
			);
		expect(
			blocks.map(
				( block ) =>
					registry
						.select( store )
						.getBlockAttributes( block.clientId )?.content
			)
		).toEqual( [ undefined, 'Changed', undefined, undefined, 'Changed' ] );
	} );

	it( 'restricts unsupported operations for non-contiguous selections', () => {
		const ids = [ blocks[ 0 ].clientId, blocks[ 2 ].clientId ];
		registry.dispatch( store ).multiSelectSet( ids );
		expect(
			unlock( registry.select( store ) ).isSelectionContiguous()
		).toBe( false );
		expect( registry.select( store ).canMoveBlocks( ids ) ).toBe( false );
		expect( registry.select( store ).isGroupable( ids ) ).toBe( false );
		registry.dispatch( store ).moveBlocksUp( ids, '' );
		expect( registry.select( store ).getBlockOrder() ).toEqual(
			blocks.map( ( block ) => block.clientId )
		);
	} );

	it( 'retains ordinary operations for contiguous explicit selections', () => {
		const ids = [ blocks[ 0 ].clientId, blocks[ 1 ].clientId ];
		registry.dispatch( store ).multiSelectSet( ids );
		expect(
			unlock( registry.select( store ) ).isSelectionContiguous()
		).toBe( true );
		expect( registry.select( store ).canMoveBlocks( ids ) ).toBe( true );
		// A separate single-block command is not blocked by the global selection.
		registry
			.dispatch( store )
			.multiSelectSet( [ ids[ 0 ], blocks[ 4 ].clientId ] );
		expect( registry.select( store ).canMoveBlocks( [ ids[ 1 ] ] ) ).toBe(
			true
		);
	} );

	it( 'duplicates each selected run after itself within its original parent', async () => {
		const parents = [
			createBlock( 'core/test-selection', {}, blocks.slice( 0, 3 ) ),
			createBlock( 'core/test-selection', {}, blocks.slice( 3 ) ),
		];
		registry.dispatch( store ).resetBlocks( parents );
		for ( const parent of parents ) {
			registry
				.dispatch( store )
				.updateBlockListSettings( parent.clientId, {} );
		}
		const ids = blocks.map( ( block ) => block.clientId );
		registry
			.dispatch( store )
			.multiSelectSet( [ ids[ 0 ], ids[ 2 ], ids[ 3 ], ids[ 4 ] ] );
		const notifications: string[][] = [];
		const unsubscribe = registry.subscribe( () => {
			notifications.push(
				registry.select( store ).getClientIdsWithDescendants()
			);
		}, store );
		const clones = ( await registry
			.dispatch( store )
			.duplicateBlocks(
				registry.select( store ).getSelectedBlockClientIds()
			) )!;
		unsubscribe();
		expect(
			registry.select( store ).getBlockOrder( parents[ 0 ].clientId )
		).toEqual( [ ids[ 0 ], clones[ 0 ], ids[ 1 ], ids[ 2 ], clones[ 1 ] ] );
		expect(
			registry.select( store ).getBlockOrder( parents[ 1 ].clientId )
		).toEqual( [ ids[ 3 ], ids[ 4 ], clones[ 2 ], clones[ 3 ] ] );
		expect( registry.select( store ).getSelectedBlockClientIds() ).toEqual(
			clones
		);
		// Providers receive the complete mutation once, not one history entry per run.
		expect( notifications ).toHaveLength( 1 );
	} );

	it( 'leaves content unchanged when a duplication destination rejects insertion', async () => {
		const parents = blocks
			.slice( 0, 2 )
			.map( ( block ) =>
				createBlock( 'core/test-selection', {}, [ block ] )
			);
		registry.dispatch( store ).resetBlocks( parents );
		registry
			.dispatch( store )
			.updateBlockListSettings( parents[ 0 ].clientId, {} );
		registry
			.dispatch( store )
			.updateBlockListSettings( parents[ 1 ].clientId, {
				allowedBlocks: [],
			} );
		const before = registry.select( store ).getBlocks();
		const ids = blocks.slice( 0, 2 ).map( ( block ) => block.clientId );
		expect(
			await registry.dispatch( store ).duplicateBlocks( ids )
		).toBeUndefined();
		expect( registry.select( store ).getBlocks() ).toBe( before );
	} );

	it( 'pastes after the last selected block without replacing selected originals', async () => {
		const parent = createBlock(
			'core/test-selection',
			{},
			blocks.slice( 2 )
		);
		registry
			.dispatch( store )
			.resetBlocks( [ ...blocks.slice( 0, 2 ), parent ] );
		registry
			.dispatch( store )
			.updateBlockListSettings( parent.clientId, {} );
		// Click order and focus do not decide the insertion destination.
		registry
			.dispatch( store )
			.multiSelectSet( [ blocks[ 3 ].clientId, blocks[ 0 ].clientId ] );
		const clipboard = [
			createBlock( 'core/test-selection' ),
			createBlock( 'core/test-selection' ),
		];
		await unlock( registry.dispatch( store ) ).pasteBlocksAfter(
			clipboard,
			registry.select( store ).getSelectedBlockClientIds()
		);
		expect(
			registry.select( store ).getBlockOrder( parent.clientId )
		).toEqual( [
			blocks[ 2 ].clientId,
			blocks[ 3 ].clientId,
			...clipboard.map( ( block ) => block.clientId ),
			blocks[ 4 ].clientId,
		] );
		expect( registry.select( store ).getBlockOrder() ).toEqual( [
			blocks[ 0 ].clientId,
			blocks[ 1 ].clientId,
			parent.clientId,
		] );
		expect( registry.select( store ).getSelectedBlockClientIds() ).toEqual(
			clipboard.map( ( block ) => block.clientId )
		);
	} );

	it( 'leaves content unchanged when the paste destination rejects insertion', async () => {
		registry
			.dispatch( store )
			.multiSelectSet( [ blocks[ 0 ].clientId, blocks[ 2 ].clientId ] );
		registry.dispatch( store ).updateSettings( { templateLock: 'all' } );
		const before = registry.select( store ).getBlocks();
		const selection = registry.select( store ).getSelectedBlockClientIds();
		await unlock( registry.dispatch( store ) ).pasteBlocksAfter(
			[ createBlock( 'core/test-selection' ) ],
			selection
		);
		expect( registry.select( store ).getBlocks() ).toBe( before );
		expect( registry.select( store ).getSelectedBlockClientIds() ).toBe(
			selection
		);
	} );

	it( 'copies selected blocks in document order without gaps or unselected ancestor wrappers', () => {
		for ( const [ index, block ] of blocks.entries() ) {
			block.attributes.content = String( index );
		}
		const parents = [
			createBlock( 'core/test-selection', {}, blocks.slice( 0, 3 ) ),
			createBlock( 'core/test-selection', {}, blocks.slice( 3 ) ),
		];
		registry.dispatch( store ).resetBlocks( parents );
		registry
			.dispatch( store )
			.multiSelectSet( [ blocks[ 4 ].clientId, blocks[ 1 ].clientId ] );
		const clipboard = new Map< string, string >();
		const event = {
			clipboardData: {
				setData: ( type: string, value: string ) =>
					clipboard.set( type, value ),
			},
		} as unknown as ClipboardEvent;
		setClipboardBlocks(
			event,
			registry
				.select( store )
				.getMultiSelectedBlocks()
				.filter( ( block ) => block !== null ),
			registry
		);
		expect(
			parse( clipboard.get( 'text/html' )! ).map(
				( block ) => block.attributes.content
			)
		).toEqual( [ '1', '4' ] );
	} );

	it( 'cuts and deletes only selected blocks while respecting locks', () => {
		const ids = blocks.map( ( block ) => block.clientId );
		registry.dispatch( store ).multiSelectSet( [ ids[ 0 ], ids[ 2 ] ] );
		registry
			.dispatch( store )
			.removeBlocks(
				registry.select( store ).getSelectedBlockClientIds(),
				false
			);
		expect( registry.select( store ).getBlockOrder() ).toEqual( [
			ids[ 1 ],
			ids[ 3 ],
			ids[ 4 ],
		] );
		registry
			.dispatch( store )
			.updateBlockAttributes( ids[ 1 ], { lock: { remove: true } } );
		registry.dispatch( store ).multiSelectSet( [ ids[ 1 ], ids[ 4 ] ] );
		registry
			.dispatch( store )
			.removeBlocks(
				registry.select( store ).getSelectedBlockClientIds(),
				false
			);
		expect( registry.select( store ).getBlockOrder() ).toEqual( [
			ids[ 1 ],
			ids[ 3 ],
			ids[ 4 ],
		] );
	} );
} );
