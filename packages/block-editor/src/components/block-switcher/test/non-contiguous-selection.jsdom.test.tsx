import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import {
	createBlock,
	getBlockTypes,
	registerBlockType,
	unregisterBlockType,
	store as blocksStore,
} from '@wordpress/blocks';
import type { Block } from '@wordpress/blocks';
import { store } from '../../../store';
import { BlockSwitcher } from '..';

describe( 'BlockSwitcher with non-contiguous selections', () => {
	let registry: ReturnType< typeof createRegistry >;
	let blocks: Block[];
	beforeAll( () => {
		registerBlockType( 'test/switcher-source', {
			apiVersion: 3,
			title: 'Source',
			category: 'text',
			attributes: {},
			save: () => null,
		} );
		registerBlockType( 'test/switcher-target', {
			apiVersion: 3,
			title: 'Target',
			category: 'text',
			attributes: {},
			save: () => null,
			transforms: {
				from: [
					{
						type: 'block',
						blocks: [ 'test/switcher-source' ],
						isMultiBlock: true,
						transform: () => createBlock( 'test/switcher-target' ),
					},
				],
			},
		} );
	} );
	afterAll( () => {
		unregisterBlockType( 'test/switcher-source' );
		unregisterBlockType( 'test/switcher-target' );
	} );
	beforeEach( () => {
		registry = createRegistry();
		registry.register( blocksStore );
		registry.dispatch( blocksStore ).addBlockTypes( getBlockTypes() );
		registry.register( store );
		blocks = Array.from( { length: 3 }, () =>
			createBlock( 'test/switcher-source' )
		);
		registry.dispatch( store ).resetBlocks( blocks );
		registry.dispatch( store ).updateSettings( {
			__experimentalBlockPatterns: [
				{
					name: 'test/switcher-pattern',
					title: 'Switcher pattern',
					blockTypes: [ 'test/switcher-source' ],
					content: '<!-- wp:test/switcher-source /-->',
				},
			],
		} );
	} );

	it.each( [ false, true ] )(
		'opens the switcher and displays no transforms for separated blocks (different parents: %s)',
		async ( differentParents ) => {
			const parents = differentParents
				? [
						createBlock(
							'test/switcher-source',
							{},
							blocks.slice( 0, 2 )
						),
						createBlock(
							'test/switcher-source',
							{},
							blocks.slice( 2 )
						),
					]
				: [];
			registry
				.dispatch( store )
				.resetBlocks( differentParents ? parents : blocks );
			parents.forEach( ( parent ) =>
				registry
					.dispatch( store )
					.updateBlockListSettings( parent.clientId, {} )
			);
			const selected = [ blocks[ 0 ], blocks[ 2 ] ];
			const clientIds = selected.map( ( block ) => block.clientId );
			registry.dispatch( store ).multiSelectSet( clientIds );
			const rootClientId = registry
				.select( store )
				.getBlockRootClientId( clientIds[ 0 ] );
			expect(
				registry
					.select( store )
					.getBlockTransformItems( selected, rootClientId )
			).toEqual( [] );
			expect(
				registry
					.select( store )
					.__experimentalGetPatternTransformItems(
						selected,
						rootClientId
					)
			).toEqual( [] );
			const before = registry.select( store ).getBlocks();
			const user = userEvent.setup();
			render(
				<RegistryProvider value={ registry }>
					<BlockSwitcher
						clientIds={ clientIds }
						label="Change block type"
					/>
				</RegistryProvider>
			);
			const toggle = screen.getByRole( 'button', {
				name: 'Change block type',
			} );
			expect( toggle ).toBeEnabled();
			await user.click( toggle );
			const menu = screen.getByRole( 'menu', {
				name: 'Change block type',
			} );
			expect( menu ).toHaveTextContent( 'No transforms.' );
			expect( screen.queryByRole( 'menuitem' ) ).not.toBeInTheDocument();
			expect( registry.select( store ).getBlocks() ).toEqual( before );
			expect(
				registry.select( store ).getSelectedBlockClientIds()
			).toEqual( clientIds );
		}
	);

	it( 'returns no transforms for separated editor blocks without depending on the current selection', () => {
		registry.dispatch( store ).selectBlock( blocks[ 1 ].clientId );
		const separated = [ blocks[ 0 ], blocks[ 2 ] ];
		const adjacent = blocks.slice( 0, 2 );
		const select = registry.select( store );
		expect( select.getBlockTransformItems( separated ) ).toEqual( [] );
		expect(
			select.__experimentalGetPatternTransformItems( separated )
		).toEqual( [] );
		expect( select.getBlockTransformItems( adjacent ) ).toHaveLength( 1 );
		expect(
			select.__experimentalGetPatternTransformItems( adjacent )
		).toHaveLength( 1 );
	} );

	it( 'updates transform availability when blocks move into and out of a contiguous range', async () => {
		const selected = [ blocks[ 0 ], blocks[ 2 ] ];
		const select = registry.select( store );
		expect( select.getBlockTransformItems( selected ) ).toEqual( [] );
		expect(
			select.__experimentalGetPatternTransformItems( selected )
		).toEqual( [] );
		await registry
			.dispatch( store )
			.moveBlocksToPosition( [ blocks[ 1 ].clientId ], '', '', 2 );
		expect( select.getBlockTransformItems( selected ) ).toHaveLength( 1 );
		expect(
			select.__experimentalGetPatternTransformItems( selected )
		).toHaveLength( 1 );
		await registry
			.dispatch( store )
			.moveBlocksToPosition( [ blocks[ 1 ].clientId ], '', '', 1 );
		expect( select.getBlockTransformItems( selected ) ).toEqual( [] );
		expect(
			select.__experimentalGetPatternTransformItems( selected )
		).toEqual( [] );
	} );
} );
