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
		level,
		content,
		textColor,
		customTextColor,
	} = attributes;
	const tagName = 'h' + level;

	const textClass = getColorClassName( 'color', textColor );

	const className = classnames( {
		[ textClass ]: textClass,
	} );

	return (
		<RichText.Content
			className={ className ? className : undefined }
			tagName={ tagName }
			style={ {
				textAlign: align,
				color: textClass ? undefined : customTextColor,
			} }
			value={ content }
		/>
	);
}
