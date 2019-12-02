/**
 * Internal dependencies
 */
import isFocusable from './is-focusable';

/**
 * @param {Element} element
 * @return {Element|null} Closest focusable element
 */
export default function getClosestFocusable( element ) {
	let container = element;

	do {
		container = container.parentElement;
	} while ( container && ! isFocusable( container ) );

	return container;
}
