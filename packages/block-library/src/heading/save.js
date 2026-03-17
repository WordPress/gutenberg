/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { content, level } = attributes;
	const TagName = 'h' + level;

	return (
		<TagName { ...useBlockProps.save() }>
			<RichText.Content value={ content } />
		</TagName>
	);
}
