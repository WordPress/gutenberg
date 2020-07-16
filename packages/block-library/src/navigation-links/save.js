/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

export default function save() {
	return (
		<ul className="wp-block-navigation__container">
			<InnerBlocks.Content />
		</ul>
	);
}
