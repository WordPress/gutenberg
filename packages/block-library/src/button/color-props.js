/**
 * External dependencies
 */
import classnames from 'classnames';
import { find } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	getColorClassName,
	__experimentalGetGradientClass,
} from '@wordpress/block-editor';
import { select } from '@wordpress/data';

// The code in this file is copied entirely from the "color" and "style" support flags
// The flag can't be used at the moment because of the extra wrapper around
// the button block markup.

export function getColorAndStyleProps( attributes ) {
	// I'd have prefered to avoid the "style" attribute usage here
	const { backgroundColor, textColor, gradient, style } = attributes;

	const backgroundClass = getColorClassName(
		'background-color',
		backgroundColor
	);
	const gradientClass = __experimentalGetGradientClass( gradient );
	const textClass = getColorClassName( 'color', textColor );
	const className = classnames( textClass, gradientClass, {
		// Don't apply the background class if there's a custom gradient
		[ backgroundClass ]: ! style?.color?.gradient && !! backgroundClass,
		'has-text-color': textColor || style?.color?.text,
		'has-background':
			backgroundColor ||
			style?.color?.background ||
			gradient ||
			style?.color?.gradient,
	} );
	const styleProp =
		style?.color?.background || style?.color?.text || style?.color?.gradient
			? {
					background: style?.color?.gradient
						? style.color.gradient
						: undefined,
					backgroundColor: style?.color?.background
						? style.color.background
						: undefined,
					color: style?.color?.text ? style.color.text : undefined,
			  }
			: {};

	return {
		className: !! className ? className : undefined,
		style: styleProp,
	};
}

// This function is a copy of the one above except it converts backgroundColor,
// textColor and gradient to css styles.
export function getColorAndStylePropsForEditor( attributes ) {
	const { backgroundColor, textColor, gradient, style } = attributes;

	const { colors, gradients } = select( 'core/block-editor' ).getSettings();

	const bgColorObject = getColorOrGradientObjectBySlug(
		colors,
		backgroundColor
	);

	let bgColor = bgColorObject?.color ? bgColorObject?.color : undefined;
	if ( bgColor === undefined && style?.color?.background )
		bgColor = style?.color?.background;

	const textColorObject = getColorOrGradientObjectBySlug( colors, textColor );
	let txtColor = textColorObject?.color ? textColorObject?.color : undefined;
	if ( txtColor === undefined && style?.color?.text )
		txtColor = style?.color?.text;

	const gradientObject = getColorOrGradientObjectBySlug(
		gradients,
		gradient
	);

	let gradientStyle = gradientObject?.gradient
		? gradientObject?.gradient
		: undefined;
	if ( gradientStyle === undefined && style?.color?.gradient )
		gradientStyle = style?.color?.gradient;

	const styleProp =
		!! bgColor || !! txtColor || !! gradientStyle
			? {
					background: gradientStyle,
					backgroundColor: bgColor,
					color: txtColor,
			  }
			: {};

	const className = classnames( {
		'has-background': !! bgColor || !! gradientStyle,
	} );

	return {
		className: !! className ? className : undefined,
		style: styleProp,
	};
}

function getColorOrGradientObjectBySlug( colors, slugValue ) {
	return find( colors, { slug: slugValue } );
}
