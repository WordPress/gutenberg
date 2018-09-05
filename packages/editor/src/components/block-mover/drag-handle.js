/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Draggable, Tooltip } from '@wordpress/components';

export const IconDragHandle = ( { label, isVisible, className, icon, onFocus, onBlur, onDragStart, onDragEnd, blockElementId, order, rootClientId, clientId, layout } ) => {
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
					<Tooltip
						text={ label }
					>
						<div
							className={ dragHandleClassNames }
							aria-hidden="true"
							aria-label=""
							tabIndex="-1"
							onFocus={ onFocus }
							onBlur={ onBlur }
							onDragStart={ onDraggableStart }
							onDragEnd={ onDraggableEnd }
							draggable
						>
							{ icon }
						</div>
					</Tooltip>
				) }
		</Draggable>
	);
};
