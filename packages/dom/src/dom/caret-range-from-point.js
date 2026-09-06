/**
 * Get a collapsed range for a given point.
 *
 * Prefers the standard `caretPositionFromPoint` API and falls back to the
 * non-standard, WebKit-originated `caretRangeFromPoint` for older browsers.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/caretPositionFromPoint
 *
 * @param {Document} doc The document of the range.
 * @param {number}   x   Horizontal position within the current viewport.
 * @param {number}   y   Vertical position within the current viewport.
 *
 * @return {Range | null} The best range for the given point.
 */
export default function caretRangeFromPoint( doc, x, y ) {
	if ( doc.caretPositionFromPoint ) {
		const point = doc.caretPositionFromPoint( x, y );

		// If x or y are negative, outside viewport, or there is no text entry node.
		// https://developer.mozilla.org/en-US/docs/Web/API/Document/caretPositionFromPoint
		if ( ! point ) {
			return null;
		}

		const range = doc.createRange();

		range.setStart( point.offsetNode, point.offset );
		range.collapse( true );

		return range;
	}

	if ( doc.caretRangeFromPoint ) {
		return doc.caretRangeFromPoint( x, y );
	}

	return null;
}
