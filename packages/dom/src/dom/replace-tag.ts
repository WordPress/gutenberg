import { assertIsDefined } from '../utils/assert-is-defined';

/**
 * Replaces the given node with a new node with the given tag name.
 *
 * @param node    The node to replace
 * @param tagName The new tag name.
 *
 * @return The new node.
 */
export default function replaceTag( node: Element, tagName: string ): Element {
	const newNode = node.ownerDocument.createElement( tagName );

	while ( node.firstChild ) {
		newNode.appendChild( node.firstChild );
	}

	assertIsDefined( node.parentNode, 'node.parentNode' );
	node.parentNode.replaceChild( newNode, node );

	return newNode;
}
