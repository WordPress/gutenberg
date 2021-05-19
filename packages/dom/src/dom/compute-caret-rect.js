/**
 * Internal dependencies
 */
import getRectangleFromRange from './get-rectangle-from-range';
import { assertIsDefined } from '../utils/assert-is-defined';

/**
 * Get the rectangle for the selection in a container.
 *
 * @param {Window} win The window of the selection.
 *
 * @return {DOMRect | null} The rectangle.
 */
export default function computeCaretRect( win ) {
	const selection = win.getSelection();
	assertIsDefined( selection, 'selection' );
	const range = selection.rangeCount ? selection.getRangeAt( 0 ) : null;

	if ( ! range ) {
		return null;
	}

	return getRectangleFromRange( range );
}
