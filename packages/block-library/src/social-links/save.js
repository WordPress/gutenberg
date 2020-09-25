/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

export default function save( { getBlockProps } ) {
	return (
		<ul { ...getBlockProps() }>
			<InnerBlocks.Content />
		</ul>
	);
}
