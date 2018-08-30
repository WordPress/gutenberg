/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Draggable } from '@wordpress/components';

const BlockDraggable = ( { isDragging, elementId, transferData, onDragStart, onDragEnd } ) => {
	const className = classnames( 'editor-block-list__block-draggable', {
		'is-visible': isDragging,
	} );

	return (
		<Draggable
			elementId={ elementId }
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
