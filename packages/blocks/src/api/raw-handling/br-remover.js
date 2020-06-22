/**
 * Internal dependencies
 */
import { getSibling } from './utils';

/**
 * Removes trailing br elements from text-level content.
 *
 * @param {Element} node Node to check.
 */
export default function brRemover( node ) {
	if ( node.nodeName !== 'BR' ) {
		return;
	}

	if ( getSibling( node, 'next' ) ) {
		return;
	}

	node.parentNode.removeChild( node );
}
