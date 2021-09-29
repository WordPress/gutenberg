/**
 * WordPress dependencies
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

export default function CommentSave( {
	attributes: { tagName: Tag = 'div' },
} ) {
	return (
		<Tag { ...useBlockProps.save() }>
			<InnerBlocks.Content />
		</Tag>
	);
}
