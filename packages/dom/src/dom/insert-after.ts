import { assertIsDefined } from '../utils/assert-is-defined';

/**
 * Given two DOM nodes, inserts the former in the DOM as the next sibling of
 * the latter.
 *
 * @param newNode       Node to be inserted.
 * @param referenceNode Node after which to perform the insertion.
 */
export default function insertAfter(
	newNode: Node,
	referenceNode: Node
): void {
	assertIsDefined( referenceNode.parentNode, 'referenceNode.parentNode' );
	referenceNode.parentNode.insertBefore( newNode, referenceNode.nextSibling );
}
