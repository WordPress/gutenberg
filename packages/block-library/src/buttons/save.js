/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

export default function save( { getBlockProps } ) {
	return (
		<div { ...getBlockProps() }>
			<InnerBlocks.Content />
		</div>
	);
}
