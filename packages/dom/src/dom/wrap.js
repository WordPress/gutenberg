/**
 * Internal dependencies
 */
import { assertIsDefined } from '../utils/assert-is-defined';

/**
 * Wraps the given node with a new node with the given tag name.
 *
 * @param {Element} newNode       The node to insert.
 * @param {Element} referenceNode The node to wrap.
 */
export default function wrap( newNode, referenceNode ) {
	assertIsDefined( referenceNode.parentNode, 'referenceNode.parentNode' );
	referenceNode.parentNode.insertBefore( newNode, referenceNode );
	newNode.appendChild( referenceNode );
}
