/**
 * Internal dependencies
 */
import getRectangleFromRange from './get-rectangle-from-range';

/**
 * Get the rectangle of the character after the cursor for a collapsed range.
 * This is more accurate than the collapsed range rect for determining the
 * visual line, working around a Firefox bug where collapsed ranges at
 * line-wrap boundaries report the previous line's position.
 *
 * See: https://bugzilla.mozilla.org/show_bug.cgi?id=1014738
 *
 * @param {Range} collapsedRange The collapsed range.
 *
 * @return {DOMRect|null} The next character's rectangle, or null.
 */
export default function getAdjacentCharRect( collapsedRange ) {
	const { startContainer, startOffset } = collapsedRange;
	if ( startContainer.nodeType !== startContainer.TEXT_NODE ) {
		return null;
	}
	const textNode = /** @type {Text} */ ( startContainer );
	if ( startOffset >= textNode.length ) {
		return null;
	}
	const doc = startContainer.ownerDocument;
	if ( ! doc ) {
		return null;
	}
	const range = doc.createRange();
	range.setStart( textNode, startOffset );
	range.setEnd( textNode, startOffset + 1 );
	return getRectangleFromRange( range );
}
