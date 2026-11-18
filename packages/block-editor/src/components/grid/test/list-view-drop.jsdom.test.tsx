import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import {
	createBlock,
	registerBlockType,
	store as blocksStore,
	unregisterBlockType,
} from '@wordpress/blocks';
import { __experimentalUseDropZone as useDropZone } from '@wordpress/compose';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { store as blockEditorStore } from '../../../store';
import useListViewDropZone from '../../list-view/use-list-view-drop-zone';

// Exercise List View's callbacks and store updates independently of DOM event
// registration. Target calculation receives explicit row data in this test.
vi.mock( import( '@wordpress/compose' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	__experimentalUseDropZone: vi.fn(),
} ) );

describe( 'auto-grid drops in List View', () => {
	beforeAll( () => {
		registerBlockType( 'test/list-view-grid', {
			apiVersion: 3,
			title: 'Grid',
			category: 'design',
			attributes: { layout: { type: 'object' } },
		} );
		registerBlockType( 'test/list-view-grid-item', {
			apiVersion: 3,
			title: 'Grid item',
			category: 'design',
			attributes: { style: { type: 'object' } },
		} );
	} );

	afterAll( () => {
		unregisterBlockType( 'test/list-view-grid' );
		unregisterBlockType( 'test/list-view-grid-item' );
	} );

	it( 'reorders an explicitly placed auto-grid child and clears its placement', () => {
		const registry = createRegistry();
		registry.register( blocksStore );
		registry.register( blockEditorStore );

		const style = {
			color: { text: '#000000' },
			layout: { columnStart: 2, rowStart: 3, columnSpan: 2 },
		};
		const item = createBlock( 'test/list-view-grid-item', { style } );
		const sibling = createBlock( 'test/list-view-grid-item' );
		const grid = createBlock(
			'test/list-view-grid',
			{ layout: { type: 'grid' } },
			[ item, sibling ]
		);
		registry.dispatch( blockEditorStore ).resetBlocks( [ grid ] );
		registry
			.dispatch( blockEditorStore )
			.updateBlockListSettings( grid.clientId, {} );
		registry
			.dispatch( blockEditorStore )
			.startDraggingBlocks( [ item.clientId ] );

		vi.mocked( useDropZone ).mockReturnValue( () => {} );
		renderHook(
			() => useListViewDropZone( { updateExpansion: () => {} } ),
			{
				wrapper: ( { children }: { children: ReactNode } ) => (
					<RegistryProvider value={ registry }>
						{ children }
					</RegistryProvider>
				),
			}
		);

		const siblingRow = {
			dataset: { block: sibling.clientId },
			classList: { contains: () => false },
			getAttribute: () => '2',
			getBoundingClientRect: () => ( {
				top: 50,
				bottom: 100,
				left: 0,
				right: 300,
				x: 0,
				y: 50,
				width: 300,
				height: 50,
			} ),
		};
		act( () => {
			vi.mocked( useDropZone ).mock.lastCall![ 0 ].onDragOver!( {
				clientX: 34,
				clientY: 90,
				currentTarget: {
					querySelectorAll: () => [ siblingRow ],
				},
			} as unknown as DragEvent );
		} );
		act( () => {
			vi.mocked( useDropZone ).mock.lastCall![ 0 ].onDrop!( {
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

		expect(
			registry.select( blockEditorStore ).getBlockOrder( grid.clientId )
		).toEqual( [ sibling.clientId, item.clientId ] );
		expect(
			registry
				.select( blockEditorStore )
				.getBlockAttributes( item.clientId )?.style
		).toEqual( {
			...style,
			layout: {
				...style.layout,
				columnStart: undefined,
				rowStart: undefined,
			},
		} );
	} );
} );
