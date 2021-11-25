/**
 * Internal dependencies
 */
import getComputedStyle from './get-computed-style';

/**
 * Returns the closest positioned element, or null under any of the conditions
 * of the offsetParent specification. Unlike offsetParent, this function is not
 * limited to HTMLElement and accepts any Node (e.g. Node.TEXT_NODE).
 *
 * @see https://drafts.csswg.org/cssom-view/#dom-htmlelement-offsetparent
 *
 * @param {Node} node Node from which to find offset parent.
 *
 * @return {Node | null} Offset parent.
 */
export default function getOffsetParent( node ) {
	// Cannot retrieve computed style or offset parent only anything other than
	// an element node, so find the closest element node.
	let closestElement;
	while ( ( closestElement = /** @type {Node} */ ( node.parentNode ) ) ) {
		if ( closestElement.nodeType === closestElement.ELEMENT_NODE ) {
			break;
		}
	}

	if ( ! closestElement ) {
		return null;
	}

	// If the closest element is already positioned, return it, as offsetParent
	// does not otherwise consider the node itself.
	if (
		getComputedStyle( /** @type {Element} */ ( closestElement ) )
			.position !== 'static'
	) {
		return closestElement;
	}

	// OffsetParent is undocumented/draft.
	return /** @type {Node & { offsetParent: Node }} */ ( closestElement )
		.offsetParent;
}
