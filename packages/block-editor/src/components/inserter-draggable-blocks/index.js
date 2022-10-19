/**
 * WordPress dependencies
 */
import { Draggable } from '@wordpress/components';
/**
 * Internal dependencies
 */
import BlockDraggableChip from '../block-draggable/draggable-chip';

const InserterDraggableBlocks = ( {
	isEnabled,
	blocks,
	icon,
	children,
	isPattern,
} ) => {
	const transferData = {
		type: 'inserter',
		blocks,
	};

	return (
		<Draggable
			__experimentalTransferDataType="wp-blocks"
			transferData={ transferData }
			__experimentalDragComponent={
				<BlockDraggableChip
					count={ blocks.length }
					icon={ icon }
					isPattern={ isPattern }
				/>
			}
		>
			{ ( { onDraggableStart, onDraggableEnd } ) => {
				return children( {
					draggable: isEnabled,
					onDragStart: isEnabled ? onDraggableStart : undefined,
					onDragEnd: isEnabled ? onDraggableEnd : undefined,
				} );
			} }
		</Draggable>
	);
};

export default InserterDraggableBlocks;
