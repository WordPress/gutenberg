import { InnerBlocks } from '@wordpress/block-editor';

type NavigationSaveProps = {
	attributes: { ref?: number; slug?: string };
};

/**
 * Serializes the Navigation block.
 *
 * @param props The block's props, carrying its attributes.
 *
 * @return The inner blocks, unless the block references a Navigation Menu.
 */
export default function save( props: NavigationSaveProps ) {
	const { attributes } = props;

	if ( attributes.ref || attributes.slug ) {
		// Avoid rendering inner blocks when a menu reference is defined.
		// When a reference is defined the inner blocks are loaded from the
		// `wp_navigation` entity rather than the hard-coded block html.
		return;
	}
	return <InnerBlocks.Content />;
}
