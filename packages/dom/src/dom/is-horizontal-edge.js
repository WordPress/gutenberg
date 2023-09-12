/**
 * Internal dependencies
 */
import isEdge from './is-edge';

/**
 * Check whether the selection is horizontally at the edge of the container.
 *
 * @param {HTMLElement} container Focusable element.
 * @param {boolean}     isReverse Set to true to check left, false for right.
 *
 * @return {boolean} True if at the horizontal edge, false if not.
 */
export default function isHorizontalEdge( container, isReverse ) {
	return isEdge( container, isReverse );
}
