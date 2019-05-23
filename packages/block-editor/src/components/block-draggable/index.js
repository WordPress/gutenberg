/**
 * WordPress dependencies
 */
import { Draggable } from '@wordpress/components';
import { withSelect } from '@wordpress/data';

const BlockDraggable = ( { children, clientId, rootClientId, blockElementId, index, onDragStart, onDragEnd } ) => {
	const transferData = {
		type: 'block',
		srcIndex: index,
		srcRootClientId: rootClientId,
		srcClientId: clientId,
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
						onDraggableStart,
						onDraggableEnd,
					} );
				}
			}
		</Draggable>
	);
};

export default withSelect( ( select, { clientId } ) => {
	const { getBlockIndex, getBlockRootClientId } = select( 'core/block-editor' );
	const rootClientId = getBlockRootClientId( clientId );
	return {
		index: getBlockIndex( clientId, rootClientId ),
		rootClientId,
	};
} )( BlockDraggable );
