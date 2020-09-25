/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

export default function save( { attributes, getBlockProps } ) {
	const { tagName: Tag } = attributes;

	return (
		<Tag { ...getBlockProps() }>
			<div className="wp-block-group__inner-container">
				<InnerBlocks.Content />
			</div>
		</Tag>
	);
}
