/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	RichText,
	getColorClassName,
} from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const {
		url,
		text,
		title,
		backgroundColor,
		textColor,
		customBackgroundColor,
		customTextColor,
		linkTarget,
		rel,
	} = attributes;

	const textClass = getColorClassName( 'color', textColor );
	const backgroundClass = getColorClassName( 'background-color', backgroundColor );

	const buttonClasses = classnames( 'wp-block-button__link', {
		'has-text-color': textColor || customTextColor,
		[ textClass ]: textClass,
		'has-background': backgroundColor || customBackgroundColor,
		[ backgroundClass ]: backgroundClass,
	} );

	const buttonStyle = {
		backgroundColor: backgroundClass ? undefined : customBackgroundColor,
		color: textClass ? undefined : customTextColor,
	};

	return (
		<div>
			<RichText.Content
				tagName="a"
				className={ buttonClasses }
				href={ url }
				title={ title }
				style={ buttonStyle }
				value={ text }
				target={ linkTarget }
				rel={ rel }
			/>
		</div>
	);
}
