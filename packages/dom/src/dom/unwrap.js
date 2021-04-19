/**
 * Internal dependencies
 */
import { assertIsDefined } from '../utils/assert-is-defined';

/**
 * Unwrap the given node. This means any child nodes are moved to the parent.
 *
 * @param {Node} node The node to unwrap.
 *
 * @return {void}
 */
export default function unwrap( node ) {
	const parent = node.parentNode;

	assertIsDefined( parent, 'node.parentNode' );

	while ( node.firstChild ) {
		parent.insertBefore( node.firstChild, node );
	}

	parent.removeChild( node );
}
