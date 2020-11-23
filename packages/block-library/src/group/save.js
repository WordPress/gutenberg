/**
 * WordPress dependencies
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { tagName: Tag } = attributes;

	return (
		<Tag { ...useBlockProps.save() }>
			<div className="wp-block-group__inner-container">
				<InnerBlocks.Content />
			</div>
		</Tag>
	);
}
