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
		content,
		customTextColor,
		level,
		textColor,
	} = attributes;
	const tagName = 'h' + level;

	const textClass = getColorClassName( 'color', textColor );

	const className = classnames( {
		[ textClass ]: textClass,
		[ `has-text-align-${ align }` ]: align,
	} );

	return (
		<RichText.Content
			className={ className ? className : undefined }
			tagName={ tagName }
			style={ {
				color: textClass ? undefined : customTextColor,
			} }
			value={ content }
		/>
	);
}
