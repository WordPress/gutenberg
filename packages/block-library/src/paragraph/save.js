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
	__experimentalWithLineHeight as withLineHeight,
} from '@wordpress/block-editor';
import { compose } from '@wordpress/compose';

function ParagraphSaveBlock( { attributes, className, style = {} } ) {
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
	} = attributes;

	const textClass = getColorClassName( 'color', textColor );
	const backgroundClass = getColorClassName(
		'background-color',
		backgroundColor
	);
	const fontSizeClass = getFontSizeClass( fontSize );

	const classes = classnames(
		{
			'has-text-color': textColor || customTextColor,
			'has-background': backgroundColor || customBackgroundColor,
			'has-drop-cap': dropCap,
			[ `has-text-align-${ align }` ]: align,
			[ fontSizeClass ]: fontSizeClass,
			[ textClass ]: textClass,
			[ backgroundClass ]: backgroundClass,
		},
		className
	);

	const styles = {
		...style,
		backgroundColor: backgroundClass ? undefined : customBackgroundColor,
		color: textClass ? undefined : customTextColor,
		fontSize: fontSizeClass ? undefined : customFontSize,
	};

	return (
		<RichText.Content
			tagName="p"
			style={ styles }
			className={ classes ? classes : undefined }
			value={ content }
			dir={ direction }
		/>
	);
}

const ParagraphSave = compose( [ withLineHeight() ] )( ParagraphSaveBlock );

export default ParagraphSave;
