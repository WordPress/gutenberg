/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

export default function save() {
	return (
		<nav className="wp-block-navigation-menu">
			<ul>
				<InnerBlocks.Content />
			</ul>
		</nav>
	);
}
