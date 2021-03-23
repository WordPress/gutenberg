/**
 * Internal dependencies
 */
import getRectangleFromRange from './get-rectangle-from-range';

/**
 * Get the rectangle for the selection in a container.
 *
 * @param {Window} win The window of the selection.
 *
 * @return {?DOMRect} The rectangle.
 */
export default function computeCaretRect( win ) {
	const selection = win.getSelection();
	const range = selection.rangeCount ? selection.getRangeAt( 0 ) : null;

	if ( ! range ) {
		return;
	}

	return getRectangleFromRange( range );
}
