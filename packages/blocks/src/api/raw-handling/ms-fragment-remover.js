/**
 * WordPress dependencies
 */
import { remove } from '@wordpress/dom';

/**
 * Windows-specific "Fragment" comments.
 *
 * @param {Node} node The node to be processed.
 */
export default function msFragmentRemover( node ) {
	if (
		node.nodeType === node.COMMENT_NODE &&
		[ 'StartFragment', 'EndFragment' ].includes( node.textContent.trim() )
	) {
		remove( node );
	}
}
