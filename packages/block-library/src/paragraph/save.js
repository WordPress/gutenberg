/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	getColorClassName,
	getFontSizeClass,
	RichText,
	globalStylesManager,
} from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const {
		align,
		content,
		dropCap,
		backgroundColor,
		textColor,
		customBackgroundColor,
		customTextColor,
		fontSize,
		customFontSize,
		direction,
		styledClassName,
	} = attributes;

	console.log( globalStylesManager.css( `background: purple;` ) );

	const textClass = getColorClassName( 'color', textColor );
	const backgroundClass = getColorClassName(
		'background-color',
		backgroundColor
	);
	const fontSizeClass = getFontSizeClass( fontSize );

	const className = classnames(
		{
			'has-text-color': textColor || customTextColor,
			'has-background': backgroundColor || customBackgroundColor,
			'has-drop-cap': dropCap,
			[ `has-text-align-${ align }` ]: align,
			[ fontSizeClass ]: fontSizeClass,
			[ textClass ]: textClass,
			[ backgroundClass ]: backgroundClass,
		},
		styledClassName
	);

	const styles = {
		backgroundColor: backgroundClass ? undefined : customBackgroundColor,
		color: textClass ? undefined : customTextColor,
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
