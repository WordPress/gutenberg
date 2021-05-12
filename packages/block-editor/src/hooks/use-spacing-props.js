/**
 * Internal dependencies
 */
import { getInlineStyles } from './style';

// This utility is intended to assist where the serialization of the spacing
// block support is being skipped for a block but the spacing related CSS
// styles still need to be generated so they can be applied to inner elements.

/**
 * Determines the spacing related props for a block derived from its spacing block
 * support attributes.
 *
 * @param  {Object} attributes Block attributes.
 * @return {Object}            ClassName & style props from spacing block support.
 */
export function useSpacingProps( attributes ) {
	const { style } = attributes;

	// Collect inline styles for spacing.
	const spacingStyles = style?.spacing || {};
	const styleProp = getInlineStyles( { spacing: spacingStyles } );

	return {
		style: styleProp,
	};
}
