/**
 * Internal dependencies
 */
import { assertIsDefined } from '../utils/assert-is-defined';

/**
 * Given two DOM nodes, inserts the former in the DOM as the next sibling of
 * the latter.
 *
 * @param {Node} newNode       Node to be inserted.
 * @param {Node} referenceNode Node after which to perform the insertion.
 * @return {void}
 */
export default function insertAfter( newNode, referenceNode ) {
	assertIsDefined( referenceNode.parentNode, 'referenceNode.parentNode' );
	referenceNode.parentNode.insertBefore( newNode, referenceNode.nextSibling );
}
