/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

export default function save( { attributes, getBlockProps } ) {
	const { ordered, values, type, reversed, start } = attributes;
	const TagName = ordered ? 'ol' : 'ul';

	return (
		<TagName { ...getBlockProps( { type, reversed, start } ) }>
			<RichText.Content value={ values } multiline="li" />
		</TagName>
	);
}
