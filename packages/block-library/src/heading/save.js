/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	getColorClassName,
	RichText,
} from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const {
		align,
		backgroundColor,
		customBackgroundColor,
		level,
		content,
		textColor,
		customTextColor,
	} = attributes;
	const tagName = 'h' + level;

	const textClass = getColorClassName( 'color', textColor );
	const backgroundClass = getColorClassName( 'background-color', backgroundColor );

	const className = classnames( {
		'has-background': backgroundColor || customBackgroundColor,
		[ textClass ]: textClass,
		[ backgroundClass ]: backgroundClass,
	} );

	return (
		<RichText.Content
			className={ className ? className : undefined }
			tagName={ tagName }
			style={ {
				textAlign: align,
				backgroundColor: backgroundClass ? undefined : customBackgroundColor,
				color: textClass ? undefined : customTextColor,
			} }
			value={ content }
		/>
	);
}
