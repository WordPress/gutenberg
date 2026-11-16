import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import {
	createBlock,
	registerBlockType,
	store as blocksStore,
	unregisterBlockType,
} from '@wordpress/blocks';
import { SlotFillProvider } from '@wordpress/components';
import { createRegistry, RegistryProvider, useSelect } from '@wordpress/data';
import BlockControls from '../../block-controls';
import {
	BlockEditContextProvider,
	mayDisplayControlsKey,
} from '../../block-edit/context';
import { store as blockEditorStore } from '../../../store';
import { getUpdatedChildLayoutStyle } from '../../../hooks/layout-child-utils';
import { GridItemMovers } from '../grid-item-movers';
import type {
	BlockStyleState,
	ChildLayoutBlockStyle,
} from '../../../hooks/types';

describe( 'manual grid item movers', () => {
	beforeAll( () => {
		registerBlockType( 'test/grid-mover', {
			apiVersion: 3,
			title: 'Grid item',
			category: 'design',
			attributes: { style: { type: 'object' } },
		} );
	} );

	afterAll( () => unregisterBlockType( 'test/grid-mover' ) );

	it.each( [
		{ name: 'default', viewport: 'default', slot: 'parent' },
		{ name: 'mobile', viewport: '@mobile', slot: 'style-state' },
	] )( 'moves a grid item in the $name state', ( { viewport, slot } ) => {
		const registry = createRegistry();
		registry.register( blocksStore );
		registry.register( blockEditorStore );
		const item = createBlock( 'test/grid-mover', {
			style: {
				layout: { columnStart: 2, rowStart: 1 },
				'@mobile': { layout: { rowStart: 2 } },
			},
		} );
		const sibling = createBlock( 'test/grid-mover', {
			style: { layout: { columnStart: 3, rowStart: 1 } },
		} );
		const grid = createBlock( 'test/grid-mover', {}, [ item, sibling ] );
		registry.dispatch( blockEditorStore ).resetBlocks( [ grid ] );
		const selectedState: BlockStyleState = { viewport, pseudo: 'default' };

		function Movers() {
			const style = useSelect(
				( select ) =>
					select( blockEditorStore ).getBlockAttributes(
						item.clientId
					)?.style as ChildLayoutBlockStyle,
				[]
			);
			return (
				<GridItemMovers
					style={ style }
					selectedState={ selectedState }
					isResponsiveEditing
					parentLayout={ { columnCount: 4, rowCount: 3 } }
					gridClientId={ grid.clientId }
					blockClientId={ item.clientId }
					onChange={ ( layout ) =>
						registry
							.dispatch( blockEditorStore )
							.updateBlockAttributes( item.clientId, {
								style: getUpdatedChildLayoutStyle(
									style,
									layout,
									selectedState
								),
							} )
					}
				/>
			);
		}

		render(
			<RegistryProvider value={ registry }>
				<SlotFillProvider>
					<BlockEditContextProvider
						value={ {
							name: 'test/grid-mover',
							isSelected: true,
							[ mayDisplayControlsKey ]: true,
						} }
					>
						<Movers />
					</BlockEditContextProvider>
					<BlockControls.Slot group={ slot } />
				</SlotFillProvider>
			</RegistryProvider>
		);

		fireEvent.click( screen.getByRole( 'button', { name: 'Move right' } ) );
		fireEvent.click( screen.getByRole( 'button', { name: 'Move down' } ) );

		expect(
			registry
				.select( blockEditorStore )
				.getBlockAttributes( item.clientId )?.style
		).toEqual(
			viewport === '@mobile'
				? {
						layout: { columnStart: 2, rowStart: 1 },
						'@mobile': { layout: { columnStart: 3, rowStart: 3 } },
					}
				: {
						layout: { columnStart: 3, rowStart: 2 },
						'@mobile': { layout: { rowStart: 2 } },
					}
		);
		expect(
			registry.select( blockEditorStore ).getBlockOrder( grid.clientId )
		).toEqual(
			viewport === '@mobile'
				? [ item.clientId, sibling.clientId ]
				: [ sibling.clientId, item.clientId ]
		);
	} );
} );
