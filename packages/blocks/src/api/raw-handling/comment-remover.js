/**
 * WordPress dependencies
 */
import { remove } from '@wordpress/dom';

/**
 * Browser dependencies
 */
const { COMMENT_NODE } = window.Node;

/**
 * Looks for comments, and removes them.
 *
 * @param {Node} node The node to be processed.
 * @return {void}
 */
export default function( node ) {
	if ( node.nodeType === COMMENT_NODE ) {
		remove( node );
	}
}
