/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import { getInlineStyles } from './style';

/**
 * Provides the CSS class names and inline styles for a block's dimensions support
 * attributes.
 *
 * @param {Object} attributes Block attributes.
 * @return {Object} Dimensions block support derived CSS classes & styles.
 */
export function getDimensionsClassesAndStyles( attributes ) {
	const { style } = attributes;
	const dimensions = style?.dimensions;
	const className = clsx( {
		'has-aspect-ratio': !! dimensions?.aspectRatio,
	} );

	// Allow dimensions-based inline style overrides to override any global styles rules that
	// might be set for the block, and therefore affect the display of the aspect ratio.
	const inlineStyleOverrides = {};

	// Apply rules to unset incompatible styles.
	// Note that a set `aspectRatio` will win out if both an aspect ratio and height-related properties are set.
	// This is because the aspect ratio is a newer block support, so (in theory) any aspect ratio
	// that is set should be intentional and should override any existing height properties. The Cover block
	// and dimensions controls have logic that will manually clear the aspect ratio if height properties
	// are set.
	if ( dimensions?.aspectRatio ) {
		// To ensure the aspect ratio does not get overridden by `minHeight` or `height` unset any existing rule.
		inlineStyleOverrides.minHeight = 'unset';
		inlineStyleOverrides.height = 'unset';
	} else if ( dimensions?.minHeight || dimensions?.height ) {
		// To ensure height properties do not get overridden by `aspectRatio` unset any existing rule.
		inlineStyleOverrides.aspectRatio = 'unset';
	}

	return {
		className: className || undefined,
		style: {
			...getInlineStyles( { dimensions } ),
			...inlineStyleOverrides,
		},
	};
}
