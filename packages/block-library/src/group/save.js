/**
 * WordPress dependencies
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { tagName: Tag } = attributes;
	return (
		<Tag { ...useBlockProps.save() }>
			<InnerBlocks.Content />
		</Tag>
	);
}
