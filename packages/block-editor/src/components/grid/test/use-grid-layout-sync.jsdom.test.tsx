import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
} from 'vitest';
import { act, render } from '@testing-library/react';
import {
	createBlock,
	getBlockTypes,
	registerBlockType,
	setDefaultBlockName,
	unregisterBlockType,
} from '@wordpress/blocks';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import type { Block } from '@wordpress/blocks';
import type { DataRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '../../../store';
import { isFromInserterKey } from '../../../store/private-keys';
import { useGridLayoutSync } from '../use-grid-layout-sync';

function GridLayoutSync( { clientId }: { clientId: string } ) {
	useGridLayoutSync( { clientId } );
	return null;
}

function createItem( layout?: Record< string, number > ): Block {
	return createBlock( 'test/item', layout ? { style: { layout } } : {} );
}

describe( 'useGridLayoutSync()', () => {
	let registry: DataRegistry;
	let grid: Block;
	let first: Block;
	let originalExperiment: boolean | undefined;

	beforeAll( () => {
		// @ts-expect-error The test blocks need no category.
		registerBlockType( 'test/grid', {
			apiVersion: 3,
			title: 'Test grid',
			attributes: { layout: { type: 'object' } },
			save: () => null,
		} );
		// @ts-expect-error The test blocks need no category.
		registerBlockType( 'test/item', {
			apiVersion: 3,
			title: 'Test item',
			attributes: {
				style: { type: 'object' },
				content: { type: 'string' },
			},
			save: () => null,
		} );
		setDefaultBlockName( 'test/item' );
	} );

	afterAll( () => {
		getBlockTypes().forEach( ( { name } ) => unregisterBlockType( name ) );
	} );

	beforeEach( () => {
		originalExperiment = window.__experimentalEnableGridInteractivity;
		window.__experimentalEnableGridInteractivity = true;
		registry = createRegistry();
		registry.register( blockEditorStore );
		first = createItem( {
			columnStart: 1,
			rowStart: 1,
			columnSpan: 2,
			rowSpan: 2,
		} );
		grid = createBlock(
			'test/grid',
			{
				layout: {
					type: 'grid',
					isManualPlacement: true,
					columnCount: 8,
					rowCount: 6,
				},
			},
			[ first ]
		);
		registry.dispatch( blockEditorStore ).resetBlocks( [ grid ] );
		// What `InnerBlocks` does, which lets blocks be inserted in the grid.
		registry
			.dispatch( blockEditorStore )
			.updateBlockListSettings( grid.clientId, {} );
		registry.dispatch( blockEditorStore ).selectBlock( first.clientId );
	} );

	afterEach( () => {
		window.__experimentalEnableGridInteractivity = originalExperiment;
	} );

	function renderSync() {
		render(
			<RegistryProvider value={ registry }>
				<GridLayoutSync clientId={ grid.clientId } />
			</RegistryProvider>
		);
	}

	function getLayout( clientId: string ) {
		const style = registry
			.select( blockEditorStore )
			.getBlockAttributes( clientId )?.style as
			{ layout?: Record< string, number > } | undefined;
		return style?.layout;
	}

	function getOrder() {
		return registry
			.select( blockEditorStore )
			.getBlockOrder( grid.clientId );
	}

	it( 'puts a block inserted from an inserter in the middle', () => {
		renderSync();
		const block = createItem();
		act( () => {
			registry
				.dispatch( blockEditorStore )
				.insertBlocks( [ block ], 1, grid.clientId, true, 0, {
					[ isFromInserterKey ]: true,
				} );
		} );
		// One cell, since the grid hasn't been measured.
		expect( getLayout( block.clientId ) ).toEqual( {
			columnStart: 4,
			rowStart: 3,
		} );
	} );

	it( "doesn't hide a block inserted in the middle under another", () => {
		renderSync();
		const blocks = [ createItem(), createItem() ];
		for ( const block of blocks ) {
			act( () => {
				registry
					.dispatch( blockEditorStore )
					.insertBlocks( [ block ], 1, grid.clientId, true, 0, {
						[ isFromInserterKey ]: true,
					} );
			} );
		}
		expect( getLayout( blocks[ 1 ].clientId ) ).toEqual( {
			columnStart: 5,
			rowStart: 4,
		} );
	} );

	it( 'puts a block added after another to its right', () => {
		renderSync();
		act( () => {
			registry
				.dispatch( blockEditorStore )
				.insertAfterBlock( first.clientId );
		} );
		const [ , added ] = getOrder();
		expect( getLayout( added ) ).toEqual( {
			columnStart: 3,
			rowStart: 1,
		} );
	} );

	it( 'puts a block added before another to its left', () => {
		renderSync();
		const other = createItem( { columnStart: 5, rowStart: 3 } );
		act( () => {
			registry
				.dispatch( blockEditorStore )
				.insertBlocks( [ other ], 1, grid.clientId );
		} );
		act( () => {
			registry
				.dispatch( blockEditorStore )
				.insertBeforeBlock( other.clientId );
		} );
		const order = getOrder();
		const added = order.find(
			( clientId ) =>
				clientId !== first.clientId && clientId !== other.clientId
		)!;
		expect( getLayout( added ) ).toEqual( {
			columnStart: 4,
			rowStart: 3,
		} );
		expect( order ).toEqual( [ first.clientId, added, other.clientId ] );
	} );

	it( 'gives a block that replaces the selected block its place', () => {
		renderSync();
		const replacement = createItem();
		act( () => {
			registry
				.dispatch( blockEditorStore )
				.replaceBlocks( first.clientId, [ replacement ], 0, 0, {
					[ isFromInserterKey ]: true,
				} );
		} );
		expect( getLayout( replacement.clientId ) ).toEqual( {
			columnStart: 1,
			rowStart: 1,
			columnSpan: 2,
			rowSpan: 2,
		} );
	} );

	it( 'places blocks in order, at their size, when the grid becomes manual', () => {
		renderSync();
		const blocks = [ createItem( { columnSpan: 2 } ), createItem() ];
		act( () => {
			registry
				.dispatch( blockEditorStore )
				.updateBlockAttributes( grid.clientId, {
					layout: { type: 'grid', columnCount: 8 },
				} );
			registry
				.dispatch( blockEditorStore )
				.insertBlocks( blocks, 1, grid.clientId );
		} );
		act( () => {
			registry
				.dispatch( blockEditorStore )
				.updateBlockAttributes( grid.clientId, {
					layout: {
						type: 'grid',
						isManualPlacement: true,
						columnCount: 8,
					},
				} );
		} );
		expect( getLayout( blocks[ 0 ].clientId ) ).toEqual( {
			columnStart: 3,
			rowStart: 1,
			columnSpan: 2,
		} );
		expect( getLayout( blocks[ 1 ].clientId ) ).toEqual( {
			columnStart: 5,
			rowStart: 1,
		} );
	} );

	describe( 'without grid interactivity', () => {
		beforeEach( () => {
			window.__experimentalEnableGridInteractivity = false;
		} );

		it( 'puts an inserted block in the first free cell after the selected block', () => {
			renderSync();
			const block = createItem();
			act( () => {
				registry
					.dispatch( blockEditorStore )
					.insertBlocks( [ block ], 1, grid.clientId, true, 0, {
						[ isFromInserterKey ]: true,
					} );
			} );
			expect( getLayout( block.clientId ) ).toEqual( {
				columnStart: 3,
				rowStart: 2,
			} );
		} );

		it( "doesn't give a block that replaces the selected block its place", () => {
			renderSync();
			const replacement = createItem();
			act( () => {
				registry
					.dispatch( blockEditorStore )
					.replaceBlocks( first.clientId, [ replacement ] );
			} );
			expect( getLayout( replacement.clientId ) ).toEqual( {
				columnStart: 2,
				rowStart: 2,
			} );
		} );
	} );
} );
