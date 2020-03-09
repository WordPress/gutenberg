/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	getFontSizeClass,
	RichText,
	__experimentalGetLineHeightControlStyles as getLineHeightStyles,
	__experimentalGetLineHeightControlClassName as getLineHeightClassName,
} from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const {
		align,
		content,
		dropCap,
		fontSize,
		customFontSize,
		direction,
	} = attributes;

	const lineHeightStyles = getLineHeightStyles( attributes );
	const lineHeightClassName = getLineHeightClassName( attributes );
	const fontSizeClass = getFontSizeClass( fontSize );

	const className = classnames(
		{
			'has-drop-cap': dropCap,
			[ `has-text-align-${ align }` ]: align,
			[ fontSizeClass ]: fontSizeClass,
		},
		lineHeightClassName
	);

	const styles = {
		...lineHeightStyles,
		fontSize: fontSizeClass ? undefined : customFontSize,
	};

	return (
		<RichText.Content
			tagName="p"
			style={ styles }
			className={ className ? className : undefined }
			value={ content }
			dir={ direction }
		/>
	);
}
