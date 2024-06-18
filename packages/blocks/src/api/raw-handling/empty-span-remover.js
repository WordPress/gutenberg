/**
 * WordPress dependencies
 */
import { unwrap } from '@wordpress/dom';

export default ( node ) => {
	// Remove spans with no attributes.
	if ( node.nodeName === 'SPAN' && ! node.attributes.length ) {
		unwrap( node );
	}
};
