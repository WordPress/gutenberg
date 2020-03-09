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
	__experimentalWithLineHeight as withLineHeight,
} from '@wordpress/block-editor';
import { compose } from '@wordpress/compose';

function ParagraphSaveBlock( { attributes, className, style = {} } ) {
	const {
		align,
		content,
		dropCap,
		fontSize,
		customFontSize,
		direction,
	} = attributes;

	const fontSizeClass = getFontSizeClass( fontSize );

	const classes = classnames(
		{
			'has-drop-cap': dropCap,
			[ `has-text-align-${ align }` ]: align,
			[ fontSizeClass ]: fontSizeClass,
		},
		className
	);

	const styles = {
		...style,
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
