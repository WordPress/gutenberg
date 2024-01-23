/**
 * Internal dependencies
 */
import { getInlineStyles } from './style';

// This utility is intended to assist where the serialization of the spacing
// block support is being skipped for a block but the spacing related CSS
// styles still need to be generated so they can be applied to inner elements.

/**
 * Provides the CSS class names and inline styles for a block's spacing support
 * attributes.
 *
 * @param {Object} attributes Block attributes.
 *
 * @return {Object} Spacing block support derived CSS classes & styles.
 */
export function getSpacingClassesAndStyles( attributes ) {
	const { style } = attributes;

	// Collect inline styles for spacing.
	const spacingStyles = style?.spacing || {};
	const styleProp = getInlineStyles( { spacing: spacingStyles } );

	return {
		style: styleProp,
	};
}
