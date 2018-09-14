/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import BlockDraggable from '../block-draggable';

export const IconDragHandle = ( { isVisible, className, icon, onDragStart, onDragEnd, blockElementId, clientId, layout } ) => {
	if ( ! isVisible ) {
		return null;
	}

	const dragHandleClassNames = classnames( 'editor-block-mover__control-drag-handle', className );

	return (
		<BlockDraggable
			clientId={ clientId }
			blockElementId={ blockElementId }
			layout={ layout }
			onDragStart={ onDragStart }
			onDragEnd={ onDragEnd }
		>
			{
				( { onDraggableStart, onDraggableEnd } ) => (
					<div
						className={ dragHandleClassNames }
						aria-hidden="true"
						onDragStart={ onDraggableStart }
						onDragEnd={ onDraggableEnd }
						draggable
					>
						{ icon }
					</div>
				) }
		</BlockDraggable>
	);
};
