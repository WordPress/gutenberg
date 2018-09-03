/**
 * WordPress dependencies
 */
import { IconButton, Draggable } from '@wordpress/components';

export const IconDragHandle = ( { isVisible, className, icon, label, onFocus, onBlur, blockElementId, order, rootClientId, clientId, layout } ) => {
	if ( ! isVisible ) {
		return null;
	}
	return (
		<Draggable
			elementId={ blockElementId }
			transferData={ {
				type: 'block',
				fromIndex: order,
				rootClientId,
				clientId: clientId,
				layout,
			} }
		>
			{
				( { onDraggableStart, onDraggableEnd } ) => (
					<IconButton
						className={ className }
						icon={ icon }
						label={ label }
						onFocus={ onFocus }
						onBlur={ onBlur }
						onDragStart={ onDraggableStart }
						onDragEnd={ onDraggableEnd }
						draggable
					/>
				) }
		</Draggable>
	);
};
