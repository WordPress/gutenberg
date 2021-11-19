/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { ordered, values, type, reversed, start } = attributes;
	const TagName = ordered ? 'ol' : 'ul';

	return (
		<TagName { ...useBlockProps.save( { type, reversed, start, className: `wp-block-list` } ) }>
			<RichText.Content value={ values } multiline="li" />
		</TagName>
	);
}
