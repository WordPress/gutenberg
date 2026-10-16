import { InnerBlocks } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	if ( attributes.ref || attributes.slug ) {
		// Avoid rendering inner blocks when a menu reference is defined.
		// When a reference is defined the inner blocks are loaded from the
		// `wp_navigation` entity rather than the hard-coded block html.
		return;
	}
	return <InnerBlocks.Content />;
}
