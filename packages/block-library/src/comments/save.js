/**
 * WordPress dependencies
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

export default function CommentsSave( { attributes: { tagName: Tag } } ) {
	return (
		<Tag { ...useBlockProps.save() }>
			<InnerBlocks.Content />
		</Tag>
	);
}
