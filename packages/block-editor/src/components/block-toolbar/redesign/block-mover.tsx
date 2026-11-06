import {
	dragHandle,
	arrowUp,
	arrowDown,
	arrowLeft,
	arrowRight,
} from '@wordpress/icons';
import { ToolbarGroup, ToolbarItem, Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __, isRTL } from '@wordpress/i18n';
import BlockDraggable from '../../block-draggable';
import {
	BlockMoverUpButton,
	BlockMoverDownButton,
} from '../../block-mover/button';
import { store as blockEditorStore } from '../../../store';

/**
 * The block movers of the redesigned toolbar: full-size arrow buttons
 * instead of the compact half-height ones, which are small and hard to click.
 *
 * @param props                Component props.
 * @param props.clientIds      The client IDs of the blocks.
 * @param props.hideDragHandle Whether to hide the drag handle.
 */
export default function RedesignedBlockMover( {
	clientIds,
	hideDragHandle,
}: {
	clientIds: string[];
	hideDragHandle?: boolean;
} ) {
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
			const firstClientId = clientIds[ 0 ];
			const _rootClientId = getBlockRootClientId( firstClientId );
			const firstIndex = getBlockIndex( firstClientId );
			const lastIndex = getBlockIndex(
				clientIds[ clientIds.length - 1 ]
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
	const hasBlocks = clientIds.length > 0;

	if (
		hasBlocks &&
		( ! canMove ||
			( isFirst && isLast && ! rootClientId ) ||
			( hideDragHandle && isManualGrid ) )
	) {
		return null;
	}

	const isHorizontal = orientation === 'horizontal';
	let previousIcon = arrowUp;
	let nextIcon = arrowDown;
	if ( isHorizontal ) {
		previousIcon = isRTL() ? arrowRight : arrowLeft;
		nextIcon = isRTL() ? arrowLeft : arrowRight;
	}

	return (
		<ToolbarGroup className="block-editor-block-toolbar__movers">
			{ ! hideDragHandle && (
				<BlockDraggable clientIds={ clientIds } fadeWhenDisabled>
					{ ( draggableProps ) => (
						<Button
							size="compact"
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
				<>
					<ToolbarItem>
						{ ( itemProps ) => (
							<BlockMoverUpButton
								clientIds={ clientIds }
								{ ...itemProps }
								icon={ previousIcon }
							/>
						) }
					</ToolbarItem>
					<ToolbarItem>
						{ ( itemProps ) => (
							<BlockMoverDownButton
								clientIds={ clientIds }
								{ ...itemProps }
								icon={ nextIcon }
							/>
						) }
					</ToolbarItem>
				</>
			) }
		</ToolbarGroup>
	);
}
