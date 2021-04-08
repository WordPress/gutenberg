/**
 * Internal dependencies
 */
import { assertIsDefined } from '../utils/assert-is-defined';

/**
 * Given a DOM node, removes it from the DOM.
 *
 * @param {Node} node Node to be removed.
 * @return {void}
 */
export default function remove( node ) {
	assertIsDefined( node.parentNode, 'node.parentNode' );
	node.parentNode.removeChild( node );
}
