/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Gets a CSS cursor value based on a drag direction.
 *
 * @param  dragDirection The drag direction.
 * @return  The CSS cursor value.
 */
export function getDragCursor( dragDirection: string ): string {
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
export function useDragCursor(
	isDragging: boolean,
	dragDirection: string
): string {
	const dragCursor = getDragCursor( dragDirection );

	useEffect( () => {
		if ( isDragging ) {
			document.documentElement.style.cursor = dragCursor;
		} else {
			// @ts-expect-error.
			document.documentElement.style.cursor = null;
		}
	}, [ isDragging ] );

	return dragCursor;
}
