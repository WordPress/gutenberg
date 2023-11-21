/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * A minimum width of 1px will prevent the rich text container from collapsing
 * to 0 width and hiding the caret. This is useful for inline containers.
 */
const minWidth = '1px';

export function useDefaultStyle() {
	return useCallback( ( element ) => {
		if ( ! element ) return;
		element.style.minWidth = minWidth;
	}, [] );
}
