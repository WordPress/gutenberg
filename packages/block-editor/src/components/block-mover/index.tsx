import clsx from 'clsx';
import { dragHandle } from '@wordpress/icons';
import { ToolbarGroup, ToolbarItem, Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import BlockDraggable from '../block-draggable';
import { BlockMoverUpButton, BlockMoverDownButton } from './button';
import { store as blockEditorStore } from '../../store';
import type { BlockMoverProps } from './types';

function BlockMover( { clientIds, hideDragHandle }: BlockMoverProps ) {
	const {
		canMove,
		rootClientId,
		isFirst,
		isLast,
		orientation,
		isManualGrid,
	} = useSelect(
		( select ) => {
			const {
				getBlockIndex,
				getBlockListSettings,
				canMoveBlocks,
				getBlockOrder,
				getBlockRootClientId,
				getBlockAttributes,
			} = select( blockEditorStore );
			const normalizedClientIds = Array.isArray( clientIds )
				? clientIds
				: [ clientIds ];
			const firstClientId = normalizedClientIds[ 0 ];
			const _rootClientId = getBlockRootClientId( firstClientId );
			const firstIndex = getBlockIndex( firstClientId );
			const lastIndex = getBlockIndex(
				normalizedClientIds[ normalizedClientIds.length - 1 ]
			);
			const blockOrder = getBlockOrder( _rootClientId );
			// The layout attribute of a container describes its grid.
			const { layout = {} } = ( getBlockAttributes( _rootClientId! ) ??
				{} ) as {
				layout?: { type?: string; isManualPlacement?: boolean };
			};

			return {
				canMove: canMoveBlocks( clientIds ),
				rootClientId: _rootClientId,
				isFirst: firstIndex === 0,
				isLast: lastIndex === blockOrder.length - 1,
				orientation: getBlockListSettings( _rootClientId )?.orientation,
				isManualGrid:
					layout.type === 'grid' &&
					layout.isManualPlacement &&
					window.__experimentalEnableGridInteractivity,
			};
		},
		[ clientIds ]
	);

	// Without blocks the buttons render disabled, as a placeholder.
	const hasBlocks = ! Array.isArray( clientIds ) || clientIds.length > 0;

	if (
		hasBlocks &&
		( ! canMove ||
			( isFirst && isLast && ! rootClientId ) ||
			( hideDragHandle && isManualGrid ) )
	) {
		return null;
	}

	return (
		<ToolbarGroup
			className={ clsx( 'block-editor-block-mover', {
				'is-horizontal': orientation === 'horizontal',
			} ) }
		>
			{ ! hideDragHandle && (
				<BlockDraggable clientIds={ clientIds } fadeWhenDisabled>
					{ ( draggableProps ) => (
						<Button
							__next40pxDefaultSize
							icon={ dragHandle }
							className="block-editor-block-mover__drag-handle"
							label={ __( 'Drag' ) }
							// Should not be able to tab to drag handle as this
							// button can only be used with a pointer device.
							// React renders the string attribute as is.
							tabIndex={ '-1' as unknown as number }
							{ ...draggableProps }
						/>
					) }
				</BlockDraggable>
			) }
			{ ! isManualGrid && (
				<div className="block-editor-block-mover__move-button-container">
					<ToolbarItem>
						{ ( itemProps ) => (
							<BlockMoverUpButton
								clientIds={ clientIds }
								{ ...itemProps }
							/>
						) }
					</ToolbarItem>
					<ToolbarItem>
						{ ( itemProps ) => (
							<BlockMoverDownButton
								clientIds={ clientIds }
								{ ...itemProps }
							/>
						) }
					</ToolbarItem>
				</div>
			) }
		</ToolbarGroup>
	);
}

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/block-mover/README.md
 */
export default BlockMover;
