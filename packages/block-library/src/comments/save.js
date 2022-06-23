/**
 * WordPress dependencies
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

export default function CommentsSave( { attributes: { tagName: Tag } } ) {
	return (
		<Tag
			{ ...useBlockProps.save( {
				// We add the previous block name for backward compatibility.
				className: 'wp-block-comments-query-loop',
			} ) }
		>
			<InnerBlocks.Content />
		</Tag>
	);
}
