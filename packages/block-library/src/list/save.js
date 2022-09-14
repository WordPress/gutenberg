/**
 * WordPress dependencies
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { ordered, type, reversed, start } = attributes;
	const TagName = ordered ? 'ol' : 'ul';
	return (
		<TagName { ...useBlockProps.save( { type, reversed, start } ) }>
			<InnerBlocks.Content />
		</TagName>
	);
}
