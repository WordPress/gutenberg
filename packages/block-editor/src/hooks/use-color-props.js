/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { getInlineStyles } from './style';
import {
	getColorClassName,
	getColorObjectByAttributeValues,
} from '../components/colors';
import {
	__experimentalGetGradientClass,
	getGradientValueBySlug,
} from '../components/gradients';
import useSetting from '../components/use-setting';

// The code in this file has largely been lifted from the color block support
// hook.
//
// This utility is intended to assist where the serialization of the colors
// block support is being skipped for a block but the color related CSS classes
// & styles still need to be generated so they can be applied to inner elements.

const EMPTY_ARRAY = [];

/**
 * Provides the CSS class names and inline styles for a block's color support
 * attributes.
 *
 * @param  {Object} attributes Block attributes.
 * @return {Object}            Color block support derived CSS classes & styles.
 */
export function getColorClassesAndStyles( attributes ) {
	const { backgroundColor, textColor, gradient, style } = attributes;

	// Collect color CSS classes.
	const backgroundClass = getColorClassName(
		'background-color',
		backgroundColor
	);
	const textClass = getColorClassName( 'color', textColor );

	const gradientClass = __experimentalGetGradientClass( gradient );
	const hasGradient = gradientClass || style?.color?.gradient;

	// Determine color CSS class name list.
	const className = classnames( textClass, gradientClass, {
		// Don't apply the background class if there's a gradient.
		[ backgroundClass ]: ! hasGradient && !! backgroundClass,
		'has-text-color': textColor || style?.color?.text,
		'has-background':
			backgroundColor ||
			style?.color?.background ||
			gradient ||
			style?.color?.gradient,
		'has-link-color': style?.elements?.link?.color,
	} );

	// Collect inline styles for colors.
	const colorStyles = style?.color || {};
	const styleProp = getInlineStyles( { color: colorStyles } );

	return {
		className: className || undefined,
		style: styleProp,
	};
}

/**
 * Determines the color related props for a block derived from its color block
 * support attributes.
 *
 * Inline styles are forced for named colors to ensure these selections are
 * reflected when themes do not load their color stylesheets in the editor.
 *
 * @param  {Object} attributes Block attributes.
 * @return {Object}            ClassName & style props from colors block support.
 */
export function useColorProps( attributes ) {
	const { backgroundColor, textColor, gradient } = attributes;

	const colors = useSetting( 'color.palette' ) || EMPTY_ARRAY;
	const gradients = useSetting( 'color.gradients' ) || EMPTY_ARRAY;

	const colorProps = getColorClassesAndStyles( attributes );

	// Force inline styles to apply colors when themes do not load their color
	// stylesheets in the editor.
	if ( backgroundColor ) {
		const backgroundColorObject = getColorObjectByAttributeValues(
			colors,
			backgroundColor
		);

		colorProps.style.backgroundColor = backgroundColorObject.color;
	}

	if ( gradient ) {
		colorProps.style.background = getGradientValueBySlug(
			gradients,
			gradient
		);
	}

	if ( textColor ) {
		const textColorObject = getColorObjectByAttributeValues(
			colors,
			textColor
		);

		colorProps.style.color = textColorObject.color;
	}

	return colorProps;
}
