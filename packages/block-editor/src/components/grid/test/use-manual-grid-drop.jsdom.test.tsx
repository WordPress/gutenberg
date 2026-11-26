import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
	createBlock,
	registerBlockType,
	serialize,
	store as blocksStore,
	unregisterBlockType,
} from '@wordpress/blocks';
import type { Block } from '@wordpress/blocks';
import { useStateWithHistory } from '@wordpress/compose';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import type { ReactNode } from 'react';
import { store as blockEditorStore } from '../../../store';
import useBlockSync from '../../provider/use-block-sync';
import { getManualGridDropRects } from '../manual-grid-drop';
import type { GridItemLayout } from '../types';
import { useManualGridDrop } from '../use-manual-grid-drop';
import { GridRect } from '../utils';

describe( 'manual grid drops', () => {
	beforeAll( () => {
		registerBlockType( 'test/manual-grid', {
			apiVersion: 3,
			title: 'Canvas',
			category: 'design',
			attributes: { layout: { type: 'object' } },
		} );
		registerBlockType< { content?: string; style?: object } >(
			'test/manual-grid-item',
			{
				apiVersion: 3,
				title: 'Grid item',
				category: 'design',
				attributes: {
					style: { type: 'object' },
					content: { type: 'string' },
				},
				save: ( { attributes } ) => <p>{ attributes.content }</p>,
			}
		);
	} );

	afterAll( () => {
		unregisterBlockType( 'test/manual-grid' );
		unregisterBlockType( 'test/manual-grid-item' );
	} );

	it( 'serializes blocks in reading order after dropping a single block', () => {
		const registry = createRegistry();
		registry.register( blocksStore );
		registry.register( blockEditorStore );

		const gridItems = [ 'A', 'B', 'C' ].map( ( content, index ) =>
			createBlock( 'test/manual-grid-item', {
				content,
				style: { layout: { columnStart: index + 1, rowStart: 1 } },
			} )
		);
		const grid = createBlock(
			'test/manual-grid',
			{
				layout: {
					type: 'grid',
					isManualPlacement: true,
					columnCount: 4,
				},
			},
			gridItems
		);
		registry.dispatch( blockEditorStore ).resetBlocks( [ grid ] );
		const { result } = renderHook(
			() => useManualGridDrop( grid.clientId, 4 ),
			{
				wrapper: ( { children }: { children: ReactNode } ) => (
					<RegistryProvider value={ registry }>
						{ children }
					</RegistryProvider>
				),
			}
		);

		const { clientId, attributes } = gridItems[ 0 ];
		act( () => {
			result.current(
				[
					{
						clientId,
						attributes,
						selectedState: undefined,
						rect: new GridRect( { columnStart: 4, rowStart: 1 } ),
					},
				],
				grid.clientId
			);
		} );

		const blocks = registry
			.select( blockEditorStore )
			.getBlocks( grid.clientId );
		const paragraphs = serialize( blocks ).match( /<p>[^<]*<\/p>/g );
		expect( paragraphs ).toEqual( [ '<p>B</p>', '<p>C</p>', '<p>A</p>' ] );
	} );

	it.each( [
		{
			name: 'keeps reading order when a selection straddles a sibling',
			withinGrid: true,
			column: 1,
			row: 2,
			expectedCells: [
				[ 1, 2 ],
				[ 3, 2 ],
			],
		},
		{
			name: 'keeps reading order when incoming blocks wrap around a sibling',
			withinGrid: false,
			column: 3,
			row: 1,
			expectedCells: [
				[ 3, 1 ],
				[ 1, 2 ],
			],
		},
	] )( '$name', ( { withinGrid, column, row, expectedCells } ) => {
		const registry = createRegistry();
		registry.register( blocksStore );
		registry.register( blockEditorStore );

		const layouts: GridItemLayout[] = withinGrid
			? [
					{ columnStart: 1, rowStart: 1 },
					{ columnStart: 3, rowStart: 1 },
				]
			: [ {}, { columnSpan: 2 } ];
		const dragged = layouts.map( ( layout ) =>
			createBlock( 'test/manual-grid-item', { style: { layout } } )
		);
		const sibling = createBlock( 'test/manual-grid-item', {
			style: {
				layout: withinGrid
					? { columnStart: 2, rowStart: 2 }
					: { columnStart: 4, rowStart: 1 },
			},
		} );
		const grid = createBlock(
			'test/manual-grid',
			{
				layout: {
					type: 'grid',
					isManualPlacement: true,
					columnCount: 4,
					rowCount: 3,
				},
			},
			withinGrid ? [ ...dragged, sibling ] : [ sibling ]
		);
		const initialBlocks = withinGrid ? [ grid ] : [ ...dragged, grid ];
		const { getBlocks, getBlockAttributes, getBlockOrder } =
			registry.select( blockEditorStore );
		const { result } = renderHook(
			() => {
				const history = useStateWithHistory< Block[] >( initialBlocks );
				useBlockSync( {
					value: history.value as Block[],
					onChange: ( blocks ) => history.setValue( blocks, false ),
					onInput: ( blocks ) => history.setValue( blocks, true ),
				} );
				return {
					...history,
					drop: useManualGridDrop( grid.clientId, 4 ),
				};
			},
			{
				wrapper: ( { children }: { children: ReactNode } ) => (
					<RegistryProvider value={ registry }>
						{ children }
					</RegistryProvider>
				),
			}
		);

		act( () => {
			registry
				.dispatch( blockEditorStore )
				.updateBlockListSettings( grid.clientId, {} );
		} );
		const beforeDrop = getBlocks();
		const rects = getManualGridDropRects(
			layouts.map( ( layout ) => ( {
				spans: { columnSpan: layout.columnSpan ?? 1, rowSpan: 1 },
				layout,
			} ) ),
			column,
			row,
			4,
			withinGrid
		);
		act( () => {
			result.current.drop(
				dragged.map( ( { clientId, attributes }, index ) => ( {
					clientId,
					attributes,
					selectedState: undefined,
					rect: rects[ index ],
				} ) ),
				withinGrid ? grid.clientId : ''
			);
		} );

		expect( getBlockOrder( grid.clientId ) ).toEqual( [
			dragged[ 0 ].clientId,
			sibling.clientId,
			dragged[ 1 ].clientId,
		] );
		dragged.forEach( ( { clientId }, index ) => {
			const [ columnStart, rowStart ] = expectedCells[ index ];
			expect( getBlockAttributes( clientId )?.style ).toEqual( {
				layout: {
					columnStart,
					rowStart,
					columnSpan: layouts[ index ].columnSpan ?? 1,
					rowSpan: 1,
				},
			} );
		} );

		act( () => result.current.undo() );
		expect( getBlocks() ).toEqual( beforeDrop );
	} );
} );
