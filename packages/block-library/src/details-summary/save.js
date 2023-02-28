/**
 * WordPress dependencies
 */
import {
	RichText,
	useBlockProps,
	getTypographyClassesAndStyles,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

export default function save( { attributes } ) {
	const { level, summary } = attributes;
	const TagName = 'h' + level;
	const typographyProps = getTypographyClassesAndStyles( attributes );

	return (
		<summary { ...useBlockProps.save() } style={ typographyProps.style }>
			<div className="wp-block-details-summary__summary">
				<TagName style={ typographyProps.style }>
					<RichText.Content
						value={ !! summary ? summary : __( 'Details' ) }
					/>
				</TagName>
			</div>
		</summary>
	);
}
