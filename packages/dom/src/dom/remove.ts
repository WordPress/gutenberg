import { assertIsDefined } from '../utils/assert-is-defined';

/**
 * Given a DOM node, removes it from the DOM.
 *
 * @param node Node to be removed.
 */
export default function remove( node: Node ): void {
	assertIsDefined( node.parentNode, 'node.parentNode' );
	node.parentNode.removeChild( node );
}
