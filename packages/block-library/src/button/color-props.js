/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	getColorClassName,
	getColorObjectByAttributeValues,
	__experimentalGetGradientClass,
} from '@wordpress/block-editor';

// The code in this file is copied entirely from the "color" and "style" support flags
// The flag can't be used at the moment because of the extra wrapper around
// the button block markup.

export default function getColorAndStyleProps(
	attributes,
	colors,
	isEdit = false
) {
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

	// This is needed only for themes that don't load their color stylesheets in the editor
	// We force an inline style to apply the color.
	if ( isEdit ) {
		if ( backgroundColor ) {
			const backgroundColorObject = getColorObjectByAttributeValues(
				colors,
				backgroundColor
			);

			styleProp.backgroundColor = backgroundColorObject.color;
		}

		if ( textColor ) {
			const textColorObject = getColorObjectByAttributeValues(
				colors,
				textColor
			);

			styleProp.color = textColorObject.color;
		}
	}

	return {
		className: !! className ? className : undefined,
		style: styleProp,
	};
}
