/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';
import { getBlockProps } from '@wordpress/blocks';

export default function save( { attributes } ) {
	const { tagName: Tag } = attributes;

	return (
		<Tag { ...getBlockProps() }>
			<div className="wp-block-group__inner-container">
				<InnerBlocks.Content />
			</div>
		</Tag>
	);
}
