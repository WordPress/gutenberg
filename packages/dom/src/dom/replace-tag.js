/**
 * Internal dependencies
 */
import { assertIsDefined } from '../utils/assert-is-defined';

/**
 * Replaces the given node with a new node with the given tag name.
 *
 * @param {Element} node    The node to replace
 * @param {string}  tagName The new tag name.
 *
 * @return {Element} The new node.
 */
export default function replaceTag( node, tagName ) {
	const newNode = node.ownerDocument.createElement( tagName );

	while ( node.firstChild ) {
		newNode.appendChild( node.firstChild );
	}

	assertIsDefined( node.parentNode, 'node.parentNode' );
	node.parentNode.replaceChild( newNode, node );

	return newNode;
}
