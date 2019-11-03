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
	__experimentalGetGradientClass,
} from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const {
		backgroundColor,
		borderRadius,
		customBackgroundColor,
		customTextColor,
		customGradient,
		linkTarget,
		gradient,
		rel,
		text,
		textColor,
		title,
		url,
	} = attributes;

	const textClass = getColorClassName( 'color', textColor );
	const backgroundClass = ! customGradient && getColorClassName( 'background-color', backgroundColor );
	const gradientClass = __experimentalGetGradientClass( gradient );

	const buttonClasses = classnames( 'wp-block-button__link', {
		'has-text-color': textColor || customTextColor,
		[ textClass ]: textClass,
		'has-background': backgroundColor || customBackgroundColor || customGradient || gradient,
		[ backgroundClass ]: backgroundClass,
		'no-border-radius': borderRadius === 0,
		[ gradientClass ]: gradientClass,
	} );

	const buttonStyle = {
		background: customGradient ? customGradient : undefined,
		backgroundColor: backgroundClass || customGradient || gradient ? undefined : customBackgroundColor,
		color: textClass ? undefined : customTextColor,
		borderRadius: borderRadius ? borderRadius + 'px' : undefined,
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
