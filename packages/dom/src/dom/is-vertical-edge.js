/**
 * Internal dependencies
 */
import isEdge from './is-edge';

/**
 * Check whether the selection is vertically at the edge of the container.
 *
 * @param {HTMLElement} container Focusable element.
 * @param {boolean}     isReverse Set to true to check top, false for bottom.
 *
 * @return {boolean} True if at the vertical edge, false if not.
 */
export default function isVerticalEdge( container, isReverse ) {
	return isEdge( container, isReverse, true );
}
