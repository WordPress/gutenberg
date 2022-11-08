/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

export default function save( { attributes } ) {
	const { level, summary } = attributes;
	const TagName = 'h' + level;

	return (
		<summary { ...useBlockProps.save() }>
			<TagName>
				<RichText.Content
					value={ !! summary ? summary : __( 'Details' ) }
				/>
			</TagName>
		</summary>
	);
}
