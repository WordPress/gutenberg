/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

export default function save() {
	return (
		<nav className="wp-block-post-navigation">
			<InnerBlocks.Content />
		</nav>
	);
}
