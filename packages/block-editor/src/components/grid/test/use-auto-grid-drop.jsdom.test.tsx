import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
	createBlock,
	registerBlockType,
	store as blocksStore,
	unregisterBlockType,
} from '@wordpress/blocks';
import type { Block } from '@wordpress/blocks';
import { useStateWithHistory } from '@wordpress/compose';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import type { ReactNode } from 'react';
import { store as blockEditorStore } from '../../../store';
import useBlockSync from '../../provider/use-block-sync';
import useOnBlockDrop from '../../use-on-block-drop';
import useAutoGridDrop from '../use-auto-grid-drop';

describe( 'useAutoGridDrop', () => {
	beforeAll( () => {
		registerBlockType( 'test/grid-drop-container', {
			apiVersion: 3,
			title: 'Grid',
			category: 'design',
			attributes: { layout: { type: 'object' } },
		} );
		registerBlockType( 'test/grid-drop-item', {
			apiVersion: 3,
			title: 'Grid item',
			category: 'design',
			attributes: { style: { type: 'object' } },
		} );
	} );

	afterAll( () => {
		unregisterBlockType( 'test/grid-drop-container' );
		unregisterBlockType( 'test/grid-drop-item' );
	} );

	it.each( [
		{
			name: 'undoes and redoes a drop together with its explicit placement change',
			targetBlockIndex: 2,
			expectedOrder: [ 'sibling', 'item' ] as const,
		},
		{
			name: 'clears explicit placement without reordering when dropped before the following sibling',
			targetBlockIndex: 1,
			expectedOrder: [ 'item', 'sibling' ] as const,
		},
	] )( '$name', ( { targetBlockIndex, expectedOrder } ) => {
		const registry = createRegistry();
		registry.register( blocksStore );
		registry.register( blockEditorStore );

		const item = createBlock( 'test/grid-drop-item' );
		const sibling = createBlock( 'test/grid-drop-item' );
		const grid = createBlock(
			'test/grid-drop-container',
			{ layout: { type: 'grid' } },
			[ item, sibling ]
		);
		const { result } = renderHook(
			() => {
				const history = useStateWithHistory< Block[] >( [ grid ] );
				useBlockSync( {
					// The history hook currently exposes its value as unknown.
					value: history.value as Block[],
					onChange: ( blocks ) => history.setValue( blocks, false ),
					onInput: ( blocks ) => history.setValue( blocks, true ),
				} );
				const { onBlocksDrop } = useAutoGridDrop();
				const onDrop = useOnBlockDrop(
					grid.clientId,
					targetBlockIndex,
					{ onBlocksDrop }
				);
				return { ...history, onDrop };
			},
			{
				wrapper: ( { children }: { children: ReactNode } ) => (
					<RegistryProvider value={ registry }>
						{ children }
					</RegistryProvider>
				),
			}
		);

		// Pinning the item is a separate edit that undoing the drop must preserve.
		act( () => {
			registry
				.dispatch( blockEditorStore )
				.updateBlockAttributes( item.clientId, {
					style: {
						layout: { columnStart: 2, rowStart: 3, columnSpan: 2 },
					},
				} );
		} );
		const beforeDrop = registry.select( blockEditorStore ).getBlocks();

		act( () => {
			result.current.onDrop( {
				dataTransfer: {
					files: [],
					items: [],
					getData: ( type: string ) =>
						type === 'wp-blocks'
							? JSON.stringify( {
									type: 'block',
									srcRootClientId: grid.clientId,
									srcClientIds: [ item.clientId ],
								} )
							: '',
				},
			} as unknown as DragEvent );
		} );

		const afterDrop = registry.select( blockEditorStore ).getBlocks();
		const blocks = { item, sibling };
		expect(
			registry.select( blockEditorStore ).getBlockOrder( grid.clientId )
		).toEqual( expectedOrder.map( ( name ) => blocks[ name ].clientId ) );
		expect(
			registry
				.select( blockEditorStore )
				.getBlockAttributes( item.clientId )?.style
		).toEqual( {
			layout: {
				columnStart: undefined,
				rowStart: undefined,
				columnSpan: 2,
			},
		} );

		act( () => result.current.undo() );
		expect( registry.select( blockEditorStore ).getBlocks() ).toEqual(
			beforeDrop
		);

		act( () => result.current.redo() );
		expect( registry.select( blockEditorStore ).getBlocks() ).toEqual(
			afterDrop
		);
	} );
} );
