/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { level, summary } = attributes;
	const TagName = 'h' + level;

	return (
		<summary { ...useBlockProps.save() }>
			<TagName>
				<RichText.Content value={ summary } />
			</TagName>
		</summary>
	);
}
