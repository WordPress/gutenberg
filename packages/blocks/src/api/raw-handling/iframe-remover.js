/**
 * WordPress dependencies
 */
import { remove } from '@wordpress/dom';

// eslint-disable-next-line valid-jsdoc
/**
 * @type {import('./').NodeFilterFunc}
 */
export default function( node ) {
	if ( node.nodeName === 'IFRAME' ) {
		remove( node );
	}
}
