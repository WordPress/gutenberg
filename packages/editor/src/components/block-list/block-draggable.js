/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Draggable } from '@wordpress/components';

const BlockDraggable = ( { clientId, rootClientId, blockElementId, layout, order, isDragging, onDragStart, onDragEnd } ) => {
	const className = classnames( 'editor-block-list__block-draggable', {
		'is-visible': isDragging,
	} );

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
				( { onDraggableStart, onDraggableEnd } ) => (
					<div
						className={ className }
						onDragStart={ onDraggableStart }
						onDragEnd={ onDraggableEnd }
						draggable
					>
						<div className="editor-block-list__block-draggable-inner"></div>
					</div> )
			}
		</Draggable>
	);
};

export default BlockDraggable;
