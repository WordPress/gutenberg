/**
 * WordPress dependencies
 */
import { unwrap } from '@wordpress/dom';

// eslint-disable-next-line valid-jsdoc
/**
 * @type {import('./').NodeFilterFunc}
 */
export default function( node ) {
	if ( ! node.id || node.id.indexOf( 'docs-internal-guid-' ) !== 0 ) {
		return;
	}

	unwrap( node );
}
