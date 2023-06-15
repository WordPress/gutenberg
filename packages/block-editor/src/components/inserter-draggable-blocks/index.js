/**
 * WordPress dependencies
 */
import { Draggable } from '@wordpress/components';
import { serialize } from '@wordpress/blocks';
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
			onDragStart={ ( event ) => {
				event.dataTransfer.setData( 'text/html', serialize( blocks ) );
			} }
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
