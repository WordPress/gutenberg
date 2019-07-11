/* global Node */

/**
 * WordPress dependencies
 */
import { remove } from '@wordpress/dom';

// eslint-disable-next-line valid-jsdoc
/**
 * Looks for comments, and removes them.
 *
 * @type {import('./').NodeFilterFunc}
 */
export default function( node ) {
	if ( node.nodeType === Node.COMMENT_NODE ) {
		remove( node );
	}
}
