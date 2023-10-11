/**
 * WordPress dependencies
 */
import { unwrap } from '@wordpress/dom';

export default function wrapperRemover( node ) {
	if ( [ 'BODY', 'HTML' ].includes( node.nodeName ) ) {
		unwrap( node );
	}
}
