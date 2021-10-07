/**
 * WordPress dependencies
 */
import { Draggable } from '@wordpress/components';

const InserterDraggableBlocks = ( { isEnabled, blocks, children } ) => {
	const transferData = {
		type: 'inserter',
		blocks,
	};

	return (
		<Draggable
			__experimentalTransferDataType="wp-blocks"
			transferData={ transferData }
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
