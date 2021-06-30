/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Gets a CSS cursor value based on a drag direction.
 *
 * @param {string} dragDirection The drag direction.
 * @return {string} The CSS cursor value.
 */
export function getDragCursor( dragDirection ) {
	let dragCursor = 'ns-resize';

	switch ( dragDirection ) {
		case 'n':
		case 's':
			dragCursor = 'ns-resize';
			break;

		case 'e':
		case 'w':
			dragCursor = 'ew-resize';
			break;
	}

	return dragCursor;
}

/**
 * Custom hook that renders a drag cursor when dragging.
 *
 * @param {boolean} isDragging    The dragging state.
 * @param {string}  dragDirection The drag direction.
 *
 * @return {string} The CSS cursor value.
 */
export function useDragCursor( isDragging, dragDirection ) {
	const dragCursor = getDragCursor( dragDirection );

	useEffect( () => {
		if ( isDragging ) {
			document.documentElement.style.cursor = dragCursor;
		} else {
			document.documentElement.style.cursor = null;
		}
	}, [ isDragging ] );

	return dragCursor;
}
