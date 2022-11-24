/**
 * Fallback for caretRangeFromPoint.
 *
 * @param {DocumentMaybeWithCaretPositionFromPoint} doc The document of the range.
 * @param {number}                                  x   Horizontal position within the current viewport.
 * @param {number}                                  y   Vertical position within the current viewport.
 *
 * @return {Range | null} The best range for the given point.
 */
function rangeFromElementFromPoint( doc, x, y ) {
	const element = doc.elementFromPoint( x, y );

	if ( ! element ) {
		return null;
	}

	const range = doc.createRange();

	range.selectNodeContents( element );
	range.collapse( true );

	return range;
}

/**
 * Polyfill.
 * Get a collapsed range for a given point.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/caretRangeFromPoint
 *
 * @param {DocumentMaybeWithCaretPositionFromPoint} doc The document of the range.
 * @param {number}                                  x   Horizontal position within the current viewport.
 * @param {number}                                  y   Vertical position within the current viewport.
 *
 * @return {Range | null} The best range for the given point.
 */
export default function caretRangeFromPoint( doc, x, y ) {
	if ( doc.caretRangeFromPoint ) {
		const range = doc.caretRangeFromPoint( x, y );

		if ( ! range ) {
			return rangeFromElementFromPoint( doc, x, y );
		}

		return range;
	}

	if ( ! doc.caretPositionFromPoint ) {
		return rangeFromElementFromPoint( doc, x, y );
	}

	const point = doc.caretPositionFromPoint( x, y );

	// If x or y are negative, outside viewport, or there is no text entry node.
	// https://developer.mozilla.org/en-US/docs/Web/API/Document/caretRangeFromPoint
	if ( ! point ) {
		return rangeFromElementFromPoint( doc, x, y );
	}

	const range = doc.createRange();

	range.setStart( point.offsetNode, point.offset );
	range.collapse( true );

	return range;
}

/**
 * @typedef {{caretPositionFromPoint?: (x: number, y: number)=> CaretPosition | null} & Document } DocumentMaybeWithCaretPositionFromPoint
 * @typedef {{ readonly offset: number; readonly offsetNode: Node; getClientRect(): DOMRect | null; }} CaretPosition
 */
