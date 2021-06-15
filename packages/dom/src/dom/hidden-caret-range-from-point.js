/**
 * Internal dependencies
 */
import caretRangeFromPoint from './caret-range-from-point';
import getComputedStyle from './get-computed-style';

/**
 * Get a collapsed range for a given point.
 * Gives the container a temporary high z-index (above any UI).
 * This is preferred over getting the UI nodes and set styles there.
 *
 * @param {Document}    doc       The document of the range.
 * @param {number}      x         Horizontal position within the current viewport.
 * @param {number}      y         Vertical position within the current viewport.
 * @param {HTMLElement} container Container in which the range is expected to be found.
 *
 * @return {?Range} The best range for the given point.
 */
export default function hiddenCaretRangeFromPoint( doc, x, y, container ) {
	const originalZIndex = container.style.zIndex;
	const originalPosition = container.style.position;

	const { position = 'static' } = getComputedStyle( container );

	// A z-index only works if the element position is not static.
	if ( position === 'static' ) {
		container.style.position = 'relative';
	}

	container.style.zIndex = '10000';

	const range = caretRangeFromPoint( doc, x, y );

	container.style.zIndex = originalZIndex;
	container.style.position = originalPosition;

	return range;
}
