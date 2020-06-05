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
			dragCursor = 'ns-resize';
			break;
		case 'e':
			dragCursor = 'ew-resize';
			break;
		case 's':
			dragCursor = 'ns-resize';
			break;
		case 'w':
			dragCursor = 'ew-resize';
			break;
	}

	return dragCursor;
}

/**
 * Custom hook that renders a drag cursor when dragging.
 *
 * @param {boolean} isDragging The dragging state.
 * @param {string} dragDirection The drag direction.
 *
 * @return {string} The CSS cursor value.
 */
export function useDragCursor( isDragging, dragDirection ) {
	const dragCursor = getDragCursor( dragDirection );

	useEffect( () => {
		if ( isDragging ) {
			document.documentElement.style.cursor = dragCursor;
			document.documentElement.style.pointerEvents = 'none';
		} else {
			document.documentElement.style.cursor = null;
			document.documentElement.style.pointerEvents = null;
		}
	}, [ isDragging ] );

	return dragCursor;
}

/**
 * Determines if a value is empty, null, or undefined.
 *
 * @param {any} value The value to check.
 * @return {boolean} Whether value is empty.
 */
export function isValueEmpty( value ) {
	const isNullish = typeof value === 'undefined' || value === null;
	const isEmptyString = value === '';

	return isNullish || isEmptyString;
}
