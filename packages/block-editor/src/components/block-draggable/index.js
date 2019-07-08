/**
 * WordPress dependencies
 */
import { Draggable } from '@wordpress/components';

const BlockDraggable = ( { children, clientId, blockElementId, onDragStart, onDragEnd } ) => {
	const transferData = {
		type: 'block',
		clientId,
	};

	return (
		<Draggable
			elementId={ blockElementId }
			transferData={ transferData }
			onDragStart={ onDragStart }
			onDragEnd={ onDragEnd }
			showClone={ false }
		>
			{
				( { onDraggableStart, onDraggableEnd } ) => {
					return children( {
						onDraggableStart,
						onDraggableEnd,
					} );
				}
			}
		</Draggable>
	);
};

export default BlockDraggable;
