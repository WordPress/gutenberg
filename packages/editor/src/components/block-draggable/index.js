/**
 * WordPress dependencies
 */
import { Draggable } from '@wordpress/components';

const BlockDraggable = ( { children, clientId, rootClientId, blockElementId, layout, order, onDragStart, onDragEnd } ) => {
	const transferData = {
		type: 'block',
		fromIndex: order,
		rootClientId,
		clientId,
		layout,
	};

	return (
		<Draggable
			elementId={ blockElementId }
			transferData={ transferData }
			onDragStart={ onDragStart }
			onDragEnd={ onDragEnd }
		>
			{
				( { onDraggableStart, onDraggableEnd } ) => {
					return children( {
						onDraggableStart: onDraggableStart,
						onDraggableEnd: onDraggableEnd,
					} );
				}
			}
		</Draggable>
	);
};

export default BlockDraggable;
