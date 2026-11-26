import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { createElement } from '@wordpress/element';
import type { ReactNode } from 'react';
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
import useOnBlockDrop from '../../components/use-on-block-drop';

describe( 'block selection with multiSelectSet', () => {
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

	it( 'selects the specified blocks without including intervening siblings', () => {
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

	it.each< [ number, number[] ] >( [
		[ 0, [ 0, 2, 1, 3, 4 ] ],
		[ 1, [ 1, 0, 2, 3, 4 ] ],
		[ 2, [ 1, 3, 0, 2, 4 ] ],
		[ 3, [ 1, 3, 4, 0, 2 ] ],
	] )(
		'moves non-contiguous siblings together at destination index %s without moving unselected blocks',
		async ( index, expected ) => {
			const ids = blocks.map( ( block ) => block.clientId );
			registry.dispatch( store ).selectBlock( ids[ 4 ] );
			const result = await registry
				.dispatch( store )
				.moveBlocksToPosition( [ ids[ 2 ], ids[ 0 ] ], '', '', index );
			expect( registry.select( store ).getBlockOrder() ).toEqual(
				expected.map( ( i ) => ids[ i ] )
			);
			expect( result ).toBeUndefined();
			expect(
				registry.select( store ).getSelectedBlockClientIds()
			).toEqual( [ ids[ 4 ] ] );
		}
	);

	it( 'preserves selection when moving blocks from different parents', async () => {
		const parents = [
			createBlock( 'core/test-selection', {}, blocks.slice( 0, 2 ) ),
			createBlock( 'core/test-selection', {}, blocks.slice( 2 ) ),
		];
		registry.dispatch( store ).resetBlocks( parents );
		const ids = blocks.map( ( block ) => block.clientId );
		registry.dispatch( store ).selectionChange( ids[ 1 ], 'content', 1, 2 );
		const selectionStart = registry.select( store ).getSelectionStart();
		const selectionEnd = registry.select( store ).getSelectionEnd();
		await registry
			.dispatch( store )
			.moveBlocksToPosition(
				[ ids[ 2 ], ids[ 0 ] ],
				parents[ 1 ].clientId,
				'',
				2
			);
		expect( registry.select( store ).getBlockOrder() ).toEqual( [
			parents[ 0 ].clientId,
			parents[ 1 ].clientId,
			ids[ 0 ],
			ids[ 2 ],
		] );
		expect( registry.select( store ).getSelectedBlockClientIds() ).toEqual(
			[ ids[ 1 ] ]
		);
		expect( registry.select( store ).getSelectionStart() ).toBe(
			selectionStart
		);
		expect( registry.select( store ).getSelectionEnd() ).toBe(
			selectionEnd
		);
	} );

	it( 'preserves existing same-parent move indices and selection', async () => {
		const ids = blocks.map( ( block ) => block.clientId );
		registry.dispatch( store ).selectionChange( ids[ 4 ], 'content', 1, 2 );
		const selectionStart = registry.select( store ).getSelectionStart();
		const selectionEnd = registry.select( store ).getSelectionEnd();
		await registry
			.dispatch( store )
			.moveBlocksToPosition( [ ids[ 1 ] ], '', '', 3 );
		expect( registry.select( store ).getBlockOrder() ).toEqual( [
			ids[ 0 ],
			ids[ 2 ],
			ids[ 3 ],
			ids[ 1 ],
			ids[ 4 ],
		] );
		expect( registry.select( store ).getSelectedBlockClientIds() ).toEqual(
			[ ids[ 4 ] ]
		);
		expect( registry.select( store ).getSelectionStart() ).toBe(
			selectionStart
		);
		expect( registry.select( store ).getSelectionEnd() ).toBe(
			selectionEnd
		);
	} );

	it( 'moves blocks from different parents together in document order while preserving their IDs and contents', async () => {
		const nested = createBlock( 'core/test-selection', {
			content: 'Nested',
		} );
		blocks[ 0 ].innerBlocks = [ nested ];
		blocks.forEach( ( block, i ) => {
			block.attributes.content = String( i );
		} );
		const parents = [
			createBlock( 'core/test-selection', {}, blocks.slice( 0, 2 ) ),
			createBlock( 'core/test-selection', {}, blocks.slice( 2, 4 ) ),
			createBlock( 'core/test-selection', {}, blocks.slice( 4 ) ),
		];
		registry.dispatch( store ).resetBlocks( parents );
		parents.forEach( ( parent ) =>
			registry
				.dispatch( store )
				.updateBlockListSettings( parent.clientId, {} )
		);
		const ids = blocks.map( ( block ) => block.clientId );
		registry.dispatch( store ).multiSelectSet( [ ids[ 0 ], ids[ 2 ] ] );
		await registry
			.dispatch( store )
			.moveBlocksToPosition(
				[ ids[ 2 ], ids[ 0 ] ],
				parents[ 1 ].clientId,
				parents[ 2 ].clientId,
				1
			);
		expect(
			registry
				.select( store )
				.getBlocks( parents[ 0 ].clientId )
				.map( ( block ) => block.clientId )
		).toEqual( [ ids[ 1 ] ] );
		expect(
			registry
				.select( store )
				.getBlocks( parents[ 1 ].clientId )
				.map( ( block ) => block.clientId )
		).toEqual( [ ids[ 3 ] ] );
		expect(
			registry
				.select( store )
				.getBlocks( parents[ 2 ].clientId )
				.map( ( block ) => [
					block.clientId,
					block.attributes.content,
				] )
		).toEqual( [
			[ ids[ 4 ], '4' ],
			[ ids[ 0 ], '0' ],
			[ ids[ 2 ], '2' ],
		] );
		expect(
			registry.select( store ).getBlockRootClientId( ids[ 0 ] )
		).toBe( parents[ 2 ].clientId );
		expect(
			registry.select( store ).getBlockRootClientId( nested.clientId )
		).toBe( ids[ 0 ] );
		expect(
			registry.select( store ).getBlock( ids[ 0 ] )?.innerBlocks[ 0 ]
				.clientId
		).toBe( nested.clientId );
		expect( registry.select( store ).getSelectedBlockClientIds() ).toEqual(
			[ ids[ 0 ], ids[ 2 ] ]
		);
	} );

	it( 'uses the supplied destination index when moving blocks from different parents', async () => {
		const parents = [
			createBlock( 'core/test-selection', {}, blocks.slice( 0, 2 ) ),
			createBlock( 'core/test-selection', {}, blocks.slice( 2 ) ),
		];
		registry.dispatch( store ).resetBlocks( parents );
		parents.forEach( ( parent ) =>
			registry
				.dispatch( store )
				.updateBlockListSettings( parent.clientId, {} )
		);
		const ids = blocks.map( ( block ) => block.clientId );
		await registry
			.dispatch( store )
			.moveBlocksToPosition(
				[ ids[ 1 ], ids[ 3 ] ],
				parents[ 0 ].clientId,
				parents[ 1 ].clientId,
				1
			);
		expect(
			registry.select( store ).getBlockOrder( parents[ 1 ].clientId )
		).toEqual( [ ids[ 2 ], ids[ 1 ], ids[ 3 ], ids[ 4 ] ] );
		expect(
			registry.select( store ).getBlockOrder( parents[ 0 ].clientId )
		).toEqual( [ ids[ 0 ] ] );
	} );

	it.each( [ 'remove-locked', 'disallowed', 'mixed-source' ] )(
		'rejects %s moves without partial mutation',
		async ( reason ) => {
			const parents = [
				createBlock( 'core/test-selection', {}, blocks.slice( 0, 2 ) ),
				createBlock( 'core/test-selection', {}, blocks.slice( 2 ) ),
			];
			registry.dispatch( store ).resetBlocks( parents );
			parents.forEach( ( parent ) =>
				registry
					.dispatch( store )
					.updateBlockListSettings( parent.clientId, {} )
			);
			const ids = [ blocks[ 0 ].clientId, blocks[ 2 ].clientId ];
			if ( reason === 'remove-locked' ) {
				registry.dispatch( store ).updateBlockAttributes( ids[ 0 ], {
					lock: { remove: true },
				} );
			} else if ( reason === 'disallowed' ) {
				registry
					.dispatch( store )
					.updateBlockListSettings( parents[ 1 ].clientId, {
						allowedBlocks: [],
					} );
			} else if ( reason === 'mixed-source' ) {
				registry
					.dispatch( store )
					.setHasControlledInnerBlocks( parents[ 1 ].clientId, true );
				registry
					.dispatch( store )
					.replaceInnerBlocks(
						parents[ 1 ].clientId,
						blocks.slice( 2 ),
						false
					);
			}
			const before = registry.select( store ).getBlocks();
			const selection = registry
				.select( store )
				.getSelectedBlockClientIds();
			await registry
				.dispatch( store )
				.moveBlocksToPosition(
					ids,
					parents[ 0 ].clientId,
					parents[ 1 ].clientId,
					0
				);
			expect( registry.select( store ).getBlocks() ).toBe( before );
			expect( registry.select( store ).getSelectedBlockClientIds() ).toBe(
				selection
			);
		}
	);

	it( 'rejects non-contiguous moves into selected blocks or their descendants', async () => {
		const parent = createBlock(
			'core/test-selection',
			{},
			blocks.slice( 0, 2 )
		);
		registry
			.dispatch( store )
			.resetBlocks( [ parent, blocks[ 3 ], blocks[ 2 ] ] );
		const ids = [ parent.clientId, blocks[ 2 ].clientId ];
		const before = registry.select( store ).getBlocks();
		for ( const destination of [ parent.clientId, blocks[ 0 ].clientId ] ) {
			await registry
				.dispatch( store )
				.moveBlocksToPosition( ids, '', destination, 0 );
			expect( registry.select( store ).getBlocks() ).toBe( before );
		}
	} );

	it( 'allows non-contiguous blocks to move while up/down mover actions leave them unchanged', () => {
		const ids = [ blocks[ 0 ].clientId, blocks[ 2 ].clientId ];
		expect( registry.select( store ).canMoveBlocks( ids ) ).toBe( true );
		expect(
			unlock( registry.select( store ) ).areBlocksContiguous( ids )
		).toBe( false );
		const before = registry.select( store ).getBlocks();
		registry.dispatch( store ).moveBlocksUp( ids );
		expect( registry.select( store ).getBlocks() ).toBe( before );
		registry.dispatch( store ).moveBlocksDown( ids );
		expect( registry.select( store ).getBlocks() ).toBe( before );
	} );

	it( 'prevents moving a disabled block', () => {
		const clientId = blocks[ 0 ].clientId;
		registry.dispatch( store ).setBlockEditingMode( clientId, 'disabled' );
		expect( registry.select( store ).canMoveBlock( clientId ) ).toBe(
			false
		);
		expect( registry.select( store ).canMoveBlocks( [ clientId ] ) ).toBe(
			false
		);
	} );

	it( 'prevents moving a disabled block with lock.move set to false', () => {
		const clientId = blocks[ 0 ].clientId;
		registry.dispatch( store ).updateBlockAttributes( clientId, {
			lock: { move: false },
		} );
		registry.dispatch( store ).setBlockEditingMode( clientId, 'disabled' );
		expect( registry.select( store ).canMoveBlock( clientId ) ).toBe(
			false
		);
		expect( registry.select( store ).canMoveBlocks( [ clientId ] ) ).toBe(
			false
		);
	} );

	it( 'allows moving an enabled parent containing a disabled child', () => {
		const parent = createBlock(
			'core/test-selection',
			{},
			blocks.slice( 0, 2 )
		);
		registry.dispatch( store ).resetBlocks( [ parent, blocks[ 2 ] ] );
		registry
			.dispatch( store )
			.setBlockEditingMode( blocks[ 0 ].clientId, 'disabled' );
		expect(
			registry.select( store ).getBlockEditingMode( parent.clientId )
		).toBe( 'default' );
		expect( registry.select( store ).canMoveBlock( parent.clientId ) ).toBe(
			true
		);
		expect(
			registry.select( store ).canMoveBlocks( [ parent.clientId ] )
		).toBe( true );
		registry
			.dispatch( store )
			.moveBlocksToPosition( [ parent.clientId ], '', '', 1 );
		expect( registry.select( store ).getBlockOrder() ).toEqual( [
			blocks[ 2 ].clientId,
			parent.clientId,
		] );
		expect(
			registry.select( store ).getBlockOrder( parent.clientId )
		).toEqual( blocks.slice( 0, 2 ).map( ( block ) => block.clientId ) );
		expect(
			registry
				.select( store )
				.getBlockRootClientId( blocks[ 0 ].clientId )
		).toBe( parent.clientId );
		expect(
			registry.select( store ).getBlockEditingMode( blocks[ 0 ].clientId )
		).toBe( 'disabled' );
	} );

	it( 'allows an enabled block to override a template movement lock', () => {
		const clientId = blocks[ 0 ].clientId;
		registry.dispatch( store ).updateSettings( { templateLock: 'all' } );
		expect( registry.select( store ).canMoveBlock( clientId ) ).toBe(
			false
		);
		registry.dispatch( store ).updateBlockAttributes( clientId, {
			lock: { move: false },
		} );
		expect( registry.select( store ).getBlockEditingMode( clientId ) ).toBe(
			'default'
		);
		expect( registry.select( store ).canMoveBlock( clientId ) ).toBe(
			true
		);
		expect( registry.select( store ).canMoveBlocks( [ clientId ] ) ).toBe(
			true
		);
	} );

	it.each( [ false, true ] )(
		'allows a parent and its descendants as move targets (child first: %s)',
		( childFirst ) => {
			const child = createBlock( 'core/test-selection', {}, [
				blocks[ 0 ],
			] );
			const parent = createBlock( 'core/test-selection', {}, [ child ] );
			registry.dispatch( store ).resetBlocks( [ parent, blocks[ 2 ] ] );
			const ids = [
				parent.clientId,
				child.clientId,
				blocks[ 0 ].clientId,
			];
			if ( childFirst ) {
				ids.reverse();
			}
			expect( registry.select( store ).canMoveBlocks( ids ) ).toBe(
				true
			);
			expect(
				unlock( registry.select( store ) ).canMoveBlocksToPosition(
					ids,
					''
				)
			).toBe( true );
		}
	);

	it.each( [ 'disabled', 'move-locked', 'remove-locked' ] )(
		'ignores child movement restrictions when moving their parent (%s)',
		( restriction ) => {
			const parent = createBlock( 'core/test-selection', {}, [
				blocks[ 0 ],
			] );
			const destination = createBlock( 'core/test-selection', {}, [
				blocks[ 2 ],
			] );
			registry.dispatch( store ).resetBlocks( [ parent, destination ] );
			registry
				.dispatch( store )
				.updateBlockListSettings( destination.clientId, {} );
			if ( restriction === 'disabled' ) {
				registry
					.dispatch( store )
					.setBlockEditingMode( blocks[ 0 ].clientId, 'disabled' );
			} else {
				registry
					.dispatch( store )
					.updateBlockAttributes( blocks[ 0 ].clientId, {
						lock: {
							[ restriction === 'move-locked'
								? 'move'
								: 'remove' ]: true,
						},
					} );
			}
			const ids = [ blocks[ 0 ].clientId, parent.clientId ];
			expect( registry.select( store ).canMoveBlocks( ids ) ).toBe(
				true
			);
			expect(
				unlock( registry.select( store ) ).canMoveBlocksToPosition(
					ids,
					destination.clientId
				)
			).toBe( true );
			registry
				.dispatch( store )
				.moveBlocksToPosition(
					ids,
					parent.clientId,
					destination.clientId,
					1
				);
			expect(
				registry.select( store ).getBlockOrder( destination.clientId )
			).toEqual( [ blocks[ 2 ].clientId, parent.clientId ] );
			expect(
				registry
					.select( store )
					.getBlockRootClientId( blocks[ 0 ].clientId )
			).toBe( parent.clientId );
		}
	);

	it( 'moves a parent once without detaching its descendants', () => {
		const parent = createBlock(
			'core/test-selection',
			{},
			blocks.slice( 0, 2 )
		);
		registry
			.dispatch( store )
			.resetBlocks( [ parent, blocks[ 2 ], blocks[ 3 ] ] );
		const ids = [ blocks[ 0 ].clientId, parent.clientId ];
		registry
			.dispatch( store )
			.moveBlocksToPosition( ids, parent.clientId, '', 1 );
		expect( registry.select( store ).getBlockOrder() ).toEqual( [
			blocks[ 2 ].clientId,
			parent.clientId,
			blocks[ 3 ].clientId,
		] );
		expect(
			registry.select( store ).getBlockOrder( parent.clientId )
		).toEqual( blocks.slice( 0, 2 ).map( ( block ) => block.clientId ) );
		expect(
			registry
				.select( store )
				.getBlockRootClientId( blocks[ 0 ].clientId )
		).toBe( parent.clientId );
		expect( ids ).toEqual( [ blocks[ 0 ].clientId, parent.clientId ] );
	} );

	it( 'moves parents from different origins without detaching their children', () => {
		const first = createBlock( 'core/test-selection', {}, [ blocks[ 0 ] ] );
		const second = createBlock( 'core/test-selection', {}, [
			blocks[ 1 ],
		] );
		const origins = [
			createBlock( 'core/test-selection', {}, [ first ] ),
			createBlock( 'core/test-selection', {}, [ second ] ),
		];
		const destination = createBlock( 'core/test-selection', {}, [
			blocks[ 2 ],
		] );
		registry.dispatch( store ).resetBlocks( [ ...origins, destination ] );
		registry
			.dispatch( store )
			.updateBlockListSettings( destination.clientId, {} );
		registry
			.dispatch( store )
			.moveBlocksToPosition(
				[
					blocks[ 1 ].clientId,
					second.clientId,
					blocks[ 0 ].clientId,
					first.clientId,
				],
				second.clientId,
				destination.clientId,
				1
			);
		expect(
			registry.select( store ).getBlockOrder( origins[ 0 ].clientId )
		).toEqual( [] );
		expect(
			registry.select( store ).getBlockOrder( origins[ 1 ].clientId )
		).toEqual( [] );
		expect(
			registry.select( store ).getBlockOrder( destination.clientId )
		).toEqual( [ blocks[ 2 ].clientId, first.clientId, second.clientId ] );
		expect(
			registry
				.select( store )
				.getBlockRootClientId( blocks[ 0 ].clientId )
		).toBe( first.clientId );
		expect(
			registry
				.select( store )
				.getBlockRootClientId( blocks[ 1 ].clientId )
		).toBe( second.clientId );
	} );

	it.each( [ 'up', 'down' ] )(
		'moves a parent up or down when descendant IDs are also supplied (%s)',
		( direction ) => {
			const first = createBlock( 'core/test-selection', {}, [
				blocks[ 0 ],
			] );
			const second = createBlock( 'core/test-selection', {}, [
				blocks[ 1 ],
			] );
			const container = createBlock( 'core/test-selection', {}, [
				blocks[ 2 ],
				first,
				second,
				blocks[ 3 ],
			] );
			registry.dispatch( store ).resetBlocks( [ container ] );
			const ids = [
				blocks[ 1 ].clientId,
				second.clientId,
				blocks[ 0 ].clientId,
				first.clientId,
			];
			if ( direction === 'up' ) {
				registry.dispatch( store ).moveBlocksUp( ids, second.clientId );
			} else {
				registry
					.dispatch( store )
					.moveBlocksDown( ids, second.clientId );
			}
			expect(
				registry.select( store ).getBlockOrder( container.clientId )
			).toEqual(
				direction === 'up'
					? [
							first.clientId,
							second.clientId,
							blocks[ 2 ].clientId,
							blocks[ 3 ].clientId,
						]
					: [
							blocks[ 2 ].clientId,
							blocks[ 3 ].clientId,
							first.clientId,
							second.clientId,
						]
			);
			expect(
				registry
					.select( store )
					.getBlockRootClientId( blocks[ 0 ].clientId )
			).toBe( first.clientId );
			expect(
				registry
					.select( store )
					.getBlockRootClientId( blocks[ 1 ].clientId )
			).toBe( second.clientId );
		}
	);

	it( 'rejects moving a parent into itself or a descendant', () => {
		const child = createBlock( 'core/test-selection', {}, [ blocks[ 0 ] ] );
		const parent = createBlock( 'core/test-selection', {}, [ child ] );
		registry.dispatch( store ).resetBlocks( [ parent, blocks[ 2 ] ] );
		const ids = [ blocks[ 0 ].clientId, child.clientId, parent.clientId ];
		const before = registry.select( store ).getBlocks();
		for ( const destination of [
			parent.clientId,
			child.clientId,
			blocks[ 0 ].clientId,
		] ) {
			expect(
				unlock( registry.select( store ) ).canMoveBlocksToPosition(
					ids,
					destination
				)
			).toBe( false );
			registry
				.dispatch( store )
				.moveBlocksToPosition( ids, child.clientId, destination, 0 );
			expect( registry.select( store ).getBlocks() ).toBe( before );
		}
	} );

	it( 'checks entity boundaries using the parent rather than separately supplied controlled children', () => {
		const parent = createBlock( 'core/test-selection' );
		const destination = createBlock( 'core/test-selection', {}, [
			blocks[ 2 ],
		] );
		registry.dispatch( store ).resetBlocks( [ parent, destination ] );
		registry
			.dispatch( store )
			.setHasControlledInnerBlocks( parent.clientId, true );
		registry
			.dispatch( store )
			.replaceInnerBlocks( parent.clientId, blocks.slice( 0, 2 ), false );
		registry
			.dispatch( store )
			.updateBlockListSettings( destination.clientId, {} );
		const ids = [ blocks[ 0 ].clientId, parent.clientId ];
		expect( registry.select( store ).canMoveBlocks( ids ) ).toBe( true );
		expect(
			unlock( registry.select( store ) ).canMoveBlocksToPosition(
				ids,
				destination.clientId
			)
		).toBe( true );
		registry
			.dispatch( store )
			.moveBlocksToPosition(
				ids,
				parent.clientId,
				destination.clientId,
				1
			);
		expect(
			registry.select( store ).getBlockOrder( destination.clientId )
		).toEqual( [ blocks[ 2 ].clientId, parent.clientId ] );
		expect(
			registry.select( store ).getBlockOrder( parent.clientId )
		).toEqual( blocks.slice( 0, 2 ).map( ( block ) => block.clientId ) );
		expect(
			registry
				.select( store )
				.getBlockRootClientId( blocks[ 0 ].clientId )
		).toBe( parent.clientId );
		expect(
			registry.select( store ).areInnerBlocksControlled( parent.clientId )
		).toBe( true );
	} );

	it( 'drops a parent once when descendant IDs are also supplied', () => {
		const parent = createBlock(
			'core/test-selection',
			{},
			blocks.slice( 0, 2 )
		);
		registry
			.dispatch( store )
			.resetBlocks( [ parent, blocks[ 2 ], blocks[ 3 ] ] );
		const onBlocksDrop = vi.fn();
		const { result } = renderHook(
			() => useOnBlockDrop( '', 3, { onBlocksDrop } ),
			{
				wrapper: ( { children }: { children: ReactNode } ) =>
					createElement( RegistryProvider, {
						value: registry,
						children,
					} ),
			}
		);
		act( () => {
			result.current( {
				dataTransfer: {
					files: [],
					items: [],
					getData: ( type: string ) =>
						type === 'wp-blocks'
							? JSON.stringify( {
									type: 'block',
									srcRootClientId: parent.clientId,
									srcClientIds: [
										blocks[ 0 ].clientId,
										parent.clientId,
									],
								} )
							: '',
				},
			} as unknown as DragEvent );
		} );
		expect( registry.select( store ).getBlockOrder() ).toEqual( [
			blocks[ 2 ].clientId,
			blocks[ 3 ].clientId,
			parent.clientId,
		] );
		expect(
			registry.select( store ).getBlockOrder( parent.clientId )
		).toEqual( blocks.slice( 0, 2 ).map( ( block ) => block.clientId ) );
		expect( registry.select( store ).getSelectedBlockClientIds() ).toEqual(
			[ parent.clientId ]
		);
		expect( onBlocksDrop ).toHaveBeenCalledTimes( 1 );
		expect( onBlocksDrop ).toHaveBeenCalledWith( [ parent.clientId ], '' );
	} );

	it.each( [ 'missing', 'duplicate', 'disabled', 'locked' ] )(
		'rejects invalid block lists before moving them (%s)',
		async ( reason ) => {
			const ids = [ blocks[ 0 ].clientId, blocks[ 2 ].clientId ];
			if ( reason === 'missing' ) {
				ids.push( 'missing' );
			} else if ( reason === 'duplicate' ) {
				ids.push( ids[ 0 ] );
			} else if ( reason === 'disabled' ) {
				registry
					.dispatch( store )
					.setBlockEditingMode( ids[ 0 ], 'disabled' );
			} else if ( reason === 'locked' ) {
				registry.dispatch( store ).updateBlockAttributes( ids[ 0 ], {
					lock: { move: true },
				} );
			}
			const before = registry.select( store ).getBlocks();
			const selection = registry
				.select( store )
				.getSelectedBlockClientIds();
			expect( registry.select( store ).canMoveBlocks( ids ) ).toBe(
				false
			);
			await registry
				.dispatch( store )
				.moveBlocksToPosition( ids, '', '', 0 );
			expect( registry.select( store ).getBlocks() ).toBe( before );
			expect( registry.select( store ).getSelectedBlockClientIds() ).toBe(
				selection
			);
		}
	);
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
			selectionStartClientId: blocks[ 2 ].clientId,
			selectionEndClientId: blocks[ 4 ].clientId,
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

	it( 'ignores duplicate and missing client IDs and supports zero or one selected block', () => {
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

	it( 'selects a controlled parent instead of its selected descendants', () => {
		const parent = createBlock( 'core/test-selection' );
		const actions = registry.dispatch( store );
		actions.resetBlocks( [ parent ] );
		actions.setHasControlledInnerBlocks( parent.clientId, true );
		actions.replaceInnerBlocks( parent.clientId, blocks, false );
		const ids = blocks.slice( 0, 2 ).map( ( block ) => block.clientId );
		actions.multiSelectSet( ids );
		actions.multiSelectSet( [ ...ids, parent.clientId ] );
		expect( registry.select( store ).getSelectedBlockClientIds() ).toEqual(
			[ parent.clientId ]
		);
	} );

	it.each( [ 'end', 'start' ] )(
		'keeps selected blocks in the entity containing selectionStart after moving selection %s',
		( selectionPosition ) => {
			const parent = createBlock( 'core/test-selection' );
			const actions = registry.dispatch( store );
			actions.resetBlocks( [ ...blocks, parent ] );
			actions.updateBlockListSettings( parent.clientId, {} );
			actions.setHasControlledInnerBlocks( parent.clientId, true );
			const ids = blocks.map( ( block ) => block.clientId );
			actions.multiSelectSet( [ ids[ 0 ], ids[ 2 ], ids[ 4 ] ] );
			const moved = selectionPosition === 'start' ? ids[ 0 ] : ids[ 4 ];
			actions.moveBlocksToPosition( [ moved ], '', parent.clientId, 0 );
			expect(
				registry.select( store ).getBlockRootClientId( moved )
			).toBe( parent.clientId );
			expect(
				registry.select( store ).getSelectedBlockClientIds()
			).toEqual(
				selectionPosition === 'start'
					? [ ids[ 0 ] ]
					: [ ids[ 0 ], ids[ 2 ] ]
			);
		}
	);

	it( 'keeps selected blocks outside a parent when its inner blocks become controlled', () => {
		const parent = createBlock(
			'core/test-selection',
			{},
			blocks.slice( 0, 2 )
		);
		const actions = registry.dispatch( store );
		actions.resetBlocks( [ parent, ...blocks.slice( 2 ) ] );
		const ids = [
			blocks[ 0 ].clientId,
			blocks[ 1 ].clientId,
			blocks[ 4 ].clientId,
		];
		actions.multiSelectSet( ids );
		actions.setHasControlledInnerBlocks( parent.clientId, true );
		expect( registry.select( store ).getBlock( ids[ 0 ] ) ).toBeNull();
		expect( registry.select( store ).getSelectedBlockClientIds() ).toEqual(
			[ ids[ 2 ] ]
		);
	} );

	it.each( [ 'missing', 'inside a selected parent' ] )(
		'uses the first selected block in document order when selectionStart is %s',
		( reason ) => {
			const parent = createBlock( 'core/test-selection' );
			const actions = registry.dispatch( store );
			actions.resetBlocks( [ parent, ...blocks.slice( 2 ) ] );
			actions.setHasControlledInnerBlocks( parent.clientId, true );
			actions.replaceInnerBlocks(
				parent.clientId,
				blocks.slice( 0, 2 ),
				false
			);
			const ids = blocks.map( ( block ) => block.clientId );
			const start = reason === 'missing' ? 'missing' : ids[ 0 ];
			// Restore a missing selectionStart block, or one whose parent is selected.
			actions.resetSelection(
				{ clientId: start },
				{ clientId: ids[ 4 ] },
				0,
				[ parent.clientId, ids[ 0 ], ids[ 1 ], ids[ 4 ] ]
			);
			expect(
				registry.select( store ).getSelectedBlockClientIds()
			).toEqual( [ parent.clientId, ids[ 4 ] ] );
			expect( registry.select( store ).getBlockSelectionStart() ).toBe(
				parent.clientId
			);
		}
	);

	it( 'restores selected blocks from one entity when the selectionStart block is missing', () => {
		const parent = createBlock( 'core/test-selection' );
		const actions = registry.dispatch( store );
		actions.resetBlocks( [ parent, ...blocks.slice( 2 ) ] );
		actions.setHasControlledInnerBlocks( parent.clientId, true );
		actions.replaceInnerBlocks(
			parent.clientId,
			blocks.slice( 0, 2 ),
			false
		);
		const ids = blocks.map( ( block ) => block.clientId );
		actions.resetSelection(
			{ clientId: 'missing' },
			{ clientId: ids[ 4 ] },
			0,
			[ 'missing', ids[ 0 ], ids[ 1 ], ids[ 4 ] ]
		);
		expect( registry.select( store ).getSelectedBlockClientIds() ).toEqual(
			ids.slice( 0, 2 )
		);
		expect( registry.select( store ).getBlockSelectionStart() ).toBe(
			ids[ 0 ]
		);
		expect( registry.select( store ).getBlockSelectionEnd() ).toBe(
			ids[ 1 ]
		);
		actions.resetBlocks( [] );
		expect( registry.select( store ).getSelectedBlockClientIds() ).toEqual(
			[]
		);
		expect(
			unlock( registry.select( store ) ).getSetSelectionClientIds()
		).toBeUndefined();
	} );

	it( 'rejects selecting blocks from different entities without changing the existing selection', () => {
		const parent = createBlock( 'core/test-selection' );
		const actions = registry.dispatch( store );
		actions.resetBlocks( [ parent, ...blocks.slice( 2 ) ] );
		actions.setHasControlledInnerBlocks( parent.clientId, true );
		actions.replaceInnerBlocks(
			parent.clientId,
			blocks.slice( 0, 2 ),
			false
		);
		const ids = blocks.map( ( block ) => block.clientId );
		actions.multiSelectSet( [ ids[ 0 ], ids[ 1 ] ] );
		actions.multiSelectSet( [ ids[ 0 ], ids[ 4 ] ] );
		expect( registry.select( store ).getSelectedBlockClientIds() ).toEqual(
			ids.slice( 0, 2 )
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

	it( 'preserves selection start and end independently of document order', () => {
		const ids = [
			blocks[ 0 ].clientId,
			blocks[ 2 ].clientId,
			blocks[ 4 ].clientId,
		];
		registry.dispatch( store ).multiSelectSet( ids, null, {
			selectionStartClientId: ids[ 2 ],
			selectionEndClientId: ids[ 1 ],
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

	it( 'updates selected client IDs after block removal, replacement, reset, and reordering', () => {
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

	it( 'reports multiple selected blocks when selection start and end match', () => {
		const ids = [ blocks[ 0 ].clientId, blocks[ 2 ].clientId ];
		registry.dispatch( store ).multiSelectSet( ids, null, {
			selectionStartClientId: ids[ 0 ],
			selectionEndClientId: ids[ 0 ],
		} );
		expect( registry.select( store ).hasSelectedBlock() ).toBe( false );
		expect(
			registry.select( store ).getSelectedBlockClientId()
		).toBeNull();
		expect( registry.select( store ).isBlockSelected( ids[ 0 ] ) ).toBe(
			false
		);
		expect( registry.select( store ).hasMultiSelection() ).toBe( true );
		registry.dispatch( store ).selectBlock( ids[ 0 ] );
		expect( registry.select( store ).getSelectedBlockClientIds() ).toEqual(
			[ ids[ 0 ] ]
		);
		expect( registry.select( store ).hasSelectedBlock() ).toBe( true );
		expect( registry.select( store ).isBlockSelected( ids[ 0 ] ) ).toBe(
			true
		);
	} );

	it.each( [ 'clear', 'single', 'range', 'text', 'restore' ] )(
		'clears setSelectionClientIds for a %s selection request',
		( request ) => {
			const ids = blocks.map( ( block ) => block.clientId );
			const actions = registry.dispatch( store );
			actions.multiSelectSet( [ ids[ 0 ], ids[ 2 ] ] );
			switch ( request ) {
				case 'clear':
					actions.clearSelectedBlock();
					break;
				case 'single':
					actions.selectBlock( ids[ 0 ] );
					break;
				case 'range':
					actions.multiSelect( ids[ 0 ], ids[ 2 ] );
					break;
				case 'text':
					actions.selectionChange( ids[ 0 ], 'content', 0, 1 );
					break;
				case 'restore':
					actions.resetSelection(
						{ clientId: ids[ 0 ] },
						{ clientId: ids[ 0 ] }
					);
					break;
			}
			expect(
				unlock( registry.select( store ) ).getSetSelectionClientIds()
			).toBeUndefined();
			let expected = [ ids[ 0 ] ];
			if ( request === 'clear' ) {
				expected = [];
			} else if ( request === 'range' ) {
				expected = ids.slice( 0, 3 );
			}
			expect(
				registry.select( store ).getSelectedBlockClientIds()
			).toEqual( expected );
		}
	);

	it.each( [ false, true ] )(
		'respects insertion selection flags (%s)',
		( updateSelection ) => {
			const ids = [ blocks[ 0 ].clientId, blocks[ 2 ].clientId ];
			registry.dispatch( store ).multiSelectSet( ids );
			const inserted = createBlock( 'core/test-selection' );
			registry
				.dispatch( store )
				.insertBlocks( [ inserted ], 1, '', updateSelection );
			expect(
				registry.select( store ).getSelectedBlockClientIds()
			).toEqual( updateSelection ? [ inserted.clientId ] : ids );
		}
	);

	it.each( [ false, true ] )(
		'respects inner-block replacement selection flags (%s)',
		( updateSelection ) => {
			const parent = createBlock( 'core/test-selection', {}, blocks );
			registry.dispatch( store ).resetBlocks( [ parent ] );
			const ids = [ blocks[ 0 ].clientId, blocks[ 2 ].clientId ];
			registry.dispatch( store ).multiSelectSet( ids );
			const inserted = createBlock( 'core/test-selection' );
			registry
				.dispatch( store )
				.replaceInnerBlocks(
					parent.clientId,
					[ inserted, ...blocks ],
					updateSelection
				);
			expect(
				registry.select( store ).getSelectedBlockClientIds()
			).toEqual( updateSelection ? [ inserted.clientId ] : ids );
		}
	);

	it( 'distinguishes multiSelectSet from multiSelect when the same adjacent blocks are selected', () => {
		const ids = blocks.slice( 0, 3 ).map( ( block ) => block.clientId );
		registry.dispatch( store ).multiSelectSet( ids );
		expect(
			unlock( registry.select( store ) ).getSetSelectionClientIds()
		).toEqual( ids );
		registry.dispatch( store ).multiSelect( ids[ 0 ], ids[ 2 ] );
		expect( registry.select( store ).getSelectedBlockClientIds() ).toEqual(
			ids
		);
		expect(
			unlock( registry.select( store ) ).getSetSelectionClientIds()
		).toBeUndefined();
	} );

	it( 'restricts unsupported operations for non-contiguous selections', () => {
		const ids = [ blocks[ 0 ].clientId, blocks[ 2 ].clientId ];
		registry.dispatch( store ).multiSelectSet( ids );
		expect(
			unlock( registry.select( store ) ).isSelectionContiguous()
		).toBe( false );
		expect( registry.select( store ).isGroupable( ids ) ).toBe( false );
	} );

	it( 'retains ordinary operations when multiSelectSet selects contiguous blocks', () => {
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

	it( 'duplicates a block when its client ID is passed as a string', async () => {
		const [ block, sibling ] = blocks;
		const parent = createBlock( 'core/test-selection', {}, [
			block,
			sibling,
		] );
		registry.dispatch( store ).resetBlocks( [ parent ] );
		registry
			.dispatch( store )
			.updateBlockListSettings( parent.clientId, {} );
		const clones = await registry
			.dispatch( store )
			.duplicateBlocks( block.clientId );

		expect( clones ).toHaveLength( 1 );
		expect(
			registry.select( store ).getBlockOrder( parent.clientId )
		).toEqual( [ block.clientId, clones![ 0 ], sibling.clientId ] );
	} );

	it( 'duplicates each group of adjacent selected siblings after the originals within the same parent', async () => {
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
		// The provider receives one update after all copies have been inserted.
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

	it( 'rejects deleting selected blocks when one has a removal lock', () => {
		const ids = blocks.map( ( block ) => block.clientId );
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
		expect( registry.select( store ).getBlockOrder() ).toEqual( ids );
	} );
} );
