import getComputedStyle from './get-computed-style';
import isElement from './is-element';

/**
 * Returns the closest positioned element, or null under any of the conditions
 * of the offsetParent specification. Unlike offsetParent, this function is not
 * limited to HTMLElement and accepts any Node (e.g. Node.TEXT_NODE).
 *
 * @see https://drafts.csswg.org/cssom-view/#dom-htmlelement-offsetparent
 *
 * @param node Node from which to find offset parent.
 *
 * @return Offset parent.
 */
export default function getOffsetParent( node: Node ): Node | null {
	// Cannot retrieve computed style or offset parent only anything other than
	// an element node, so find the closest element node.
	let closestElement = node.parentNode;
	while ( closestElement && ! isElement( closestElement ) ) {
		closestElement = closestElement.parentNode;
	}

	if ( ! closestElement ) {
		return null;
	}

	// If the closest element is already positioned, return it, as offsetParent
	// does not otherwise consider the node itself.
	if ( getComputedStyle( closestElement ).position !== 'static' ) {
		return closestElement;
	}

	// offsetParent is undocumented/draft.
	return ( closestElement as HTMLElement ).offsetParent;
}
