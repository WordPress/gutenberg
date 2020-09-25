/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';
import { getBlockProps } from '@wordpress/blocks';

export default function save() {
	return (
		<div { ...getBlockProps() }>
			<InnerBlocks.Content />
		</div>
	);
}
