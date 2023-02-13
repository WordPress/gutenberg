/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

export default function save( { attributes } ) {
	const { level, summary, fontSize, style } = attributes;
	const TagName = 'h' + level;

	const customFontSize = style?.typography?.fontSize
		? 'font-size:' + style?.typography?.fontSize
		: false;
	const additionalClassNames = classnames(
		'wp-block-details-summary__summary',
		{
			[ `has-${ fontSize }-font-size` ]: fontSize,
			'has-custom-font-size': customFontSize ? true : false,
		}
	);

	return (
		<summary { ...useBlockProps.save() }>
			<TagName
				className={ additionalClassNames }
				style={ customFontSize ? customFontSize : undefined }
			>
				<RichText.Content
					value={ !! summary ? summary : __( 'Details' ) }
				/>
			</TagName>
		</summary>
	);
}
