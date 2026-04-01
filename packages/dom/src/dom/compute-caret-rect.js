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

	// For collapsed selections inside text nodes, use the adjacent character's
	// rect when available. This works around a Firefox bug where collapsed
	// ranges at line-wrap boundaries report the previous line's position.
	// See: https://bugzilla.mozilla.org/show_bug.cgi?id=1014738
	if ( range.collapsed ) {
		const { startContainer, startOffset } = range;
		if (
			startContainer.nodeType === startContainer.TEXT_NODE &&
			startOffset < /** @type {Text} */ ( startContainer ).length
		) {
			const charRange = startContainer.ownerDocument.createRange();
			charRange.setStart( startContainer, startOffset );
			charRange.setEnd( startContainer, startOffset + 1 );
			const charRect = getRectangleFromRange( charRange );
			if ( charRect ) {
				return charRect;
			}
		}
	}

	return getRectangleFromRange( range );
}
