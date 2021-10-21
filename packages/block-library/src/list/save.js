/**
 * WordPress dependencies
 */
import { InnerBlocks, RichText, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { ordered, values, type, reversed, start } = attributes;
	const TagName = ordered ? 'ol' : 'ul';

	return (
		<TagName { ...useBlockProps.save( { type, reversed, start } ) }>
			{ /*<RichText.Content value={ values } multiline="li" />*/ }
			<InnerBlocks.Content />
		</TagName>
	);
}
