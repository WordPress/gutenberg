/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Draggable } from '@wordpress/components';

export const IconDragHandle = ( { isVisible, className, icon, onFocus, onBlur, onDragStart, onDragEnd, blockElementId, order, rootClientId, clientId, layout } ) => {
	if ( ! isVisible ) {
		return null;
	}

	const dragHandleClassNames = classnames( 'editor-block-mover__control-drag-handle', className );

	return (
		<Draggable
			elementId={ blockElementId }
			transferData={ {
				type: 'block',
				fromIndex: order,
				rootClientId,
				clientId,
				layout,
			} }
			onDragStart={ onDragStart }
			onDragEnd={ onDragEnd }
		>
			{
				( { onDraggableStart, onDraggableEnd } ) => (
					<div
						className={ dragHandleClassNames }
						aria-hidden="true"
						onFocus={ onFocus }
						onBlur={ onBlur }
						onDragStart={ onDraggableStart }
						onDragEnd={ onDraggableEnd }
						draggable
					>
						{ icon }
					</div>
				) }
		</Draggable>
	);
};
