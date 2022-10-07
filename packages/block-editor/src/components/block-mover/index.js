/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */

import { dragHandle } from '@wordpress/icons';
import { ToolbarGroup, ToolbarItem, Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockDraggable from '../block-draggable';
import { BlockMoverUpButton, BlockMoverDownButton } from './button';
import { store as blockEditorStore } from '../../store';

function BlockMover( { clientIds, hideDragHandle } ) {
	const { canMove, rootClientId, isFirst, isLast, orientation } = useSelect(
		( select ) => {
			const {
				getBlockIndex,
				getBlockListSettings,
				canMoveBlocks,
				getBlockOrder,
				getBlockRootClientId,
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

			return {
				canMove: canMoveBlocks( clientIds, _rootClientId ),
				rootClientId: _rootClientId,
				isFirst: firstIndex === 0,
				isLast: lastIndex === blockOrder.length - 1,
				orientation: getBlockListSettings( _rootClientId )?.orientation,
			};
		},
		[ clientIds ]
	);

	if ( ! canMove || ( isFirst && isLast && ! rootClientId ) ) {
		return null;
	}

	const dragHandleLabel = __( 'Drag' );

	return (
		<ToolbarGroup
			className={ classnames( 'block-editor-block-mover', {
				'is-horizontal': orientation === 'horizontal',
			} ) }
		>
			{ ! hideDragHandle && (
				<BlockDraggable clientIds={ clientIds }>
					{ ( draggableProps ) => (
						<Button
							icon={ dragHandle }
							className="block-editor-block-mover__drag-handle"
							aria-hidden="true"
							label={ dragHandleLabel }
							// Should not be able to tab to drag handle as this
							// button can only be used with a pointer device.
							tabIndex="-1"
							{ ...draggableProps }
						/>
					) }
				</BlockDraggable>
			) }
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
		</ToolbarGroup>
	);
}

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/block-mover/README.md
 */
export default BlockMover;
