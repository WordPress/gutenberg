/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { DragDirection } from './types';

/**
 * Gets a CSS cursor value based on a drag direction.
 *
 * @param  dragDirection The drag direction.
 * @return  The CSS cursor value.
 */
export function getDragCursor(
	dragDirection: DragDirection
): 'ns-resize' | 'ew-resize' {
	let dragCursor: 'ns-resize' | 'ew-resize' = 'ns-resize';

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
 * @param  isDragging    The dragging state.
 * @param  dragDirection The drag direction.
 *
 * @return The CSS cursor value.
 */
export function useDragCursor(
	isDragging: boolean,
	dragDirection: DragDirection
): 'ns-resize' | 'ew-resize' {
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
