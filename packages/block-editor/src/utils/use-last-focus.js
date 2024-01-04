/**
 * WordPress dependencies
 */
import { createRef } from '@wordpress/element';

/**
 * Returns the element of the last element that had focus when focus left the editor canvas.
 *
 * @return {Object} Object with a lastFocus ref and setLastFocus.
 */
const lastFocus = createRef();

export function useLastFocus() {
	const setLastFocus = ( node ) => {
		lastFocus.current = node;
	};
	return { lastFocus, setLastFocus };
}
