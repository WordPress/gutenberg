/**
 * WordPress dependencies
 */
import { unwrap } from '@wordpress/dom';

export default function googleDocsUIdRemover( node: Node ): void {
	const el = node as HTMLElement;
	if ( ! el.id || el.id.indexOf( 'docs-internal-guid-' ) !== 0 ) {
		return;
	}

	// Google Docs sometimes wraps the content in a B tag. We don't want to keep
	// this.
	if ( el.tagName === 'B' ) {
		unwrap( node );
	} else {
		el.removeAttribute( 'id' );
	}
}
