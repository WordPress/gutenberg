/**
 * WordPress dependencies
 */
import { unwrap } from '@wordpress/dom';

export default function googleDocsUIdRemover( node ) {
	if ( ! node.id || node.id.indexOf( 'docs-internal-guid-' ) !== 0 ) {
		return;
	}

	// Google Docs sometimes wraps the content in a B tag. We don't want to keep
	// this.
	if ( node.tagName === 'B' ) {
		unwrap( node );
	} else {
		node.removeAttribute( 'id' );
	}
}
