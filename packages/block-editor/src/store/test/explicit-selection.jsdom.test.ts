import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createRegistry } from '@wordpress/data';
import {
	createBlock,
	registerBlockType,
	unregisterBlockType,
	store as blocksStore,
} from '@wordpress/blocks';
import type { Block } from '@wordpress/blocks';
import { store } from '..';
import { unlock } from '../../lock-unlock';

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
		const section = createBlock( 'core/test-selection', {}, [
			createBlock( 'core/test-selection', {}, blocks.slice( 0, 3 ) ),
			createBlock( 'core/test-selection', {}, blocks.slice( 3 ) ),
		] );
		registry.dispatch( store ).resetBlocks( [ section ] );
		const ids = [ blocks[ 1 ].clientId, blocks[ 4 ].clientId ];
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
} );
